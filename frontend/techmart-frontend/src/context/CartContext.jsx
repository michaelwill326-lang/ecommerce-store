import { createContext, useEffect, useState, useCallback } from "react";
const API = import.meta.env.VITE_API_URL || "https://techmart-backend-ecbi.onrender.com";
export const CartContext = createContext();

export function CartProvider({ children }) {
  const isLoggedIn = () => !!localStorage.getItem("token");

  // Never expose a saved cart to a logged-out visitor.
  // A customer's cart is available only while authenticated.
  const [cart, setCart] = useState(() => {
    if (!localStorage.getItem("token")) return [];
    const saved = localStorage.getItem("cart");
    return saved ? JSON.parse(saved) : [];
  });

  // Save to localStorage whenever cart changes
  useEffect(() => {
    localStorage.setItem("cart", JSON.stringify(cart));
  }, [cart]);

  // Sync cart to backend when user logs in
  const syncCartToServer = useCallback(async () => {
    const token = localStorage.getItem("token");
    if (!token || !cart.length) return;
    try {
      await fetch(`${API}/api/cart/sync`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ items: cart })
      });
    } catch {}
  }, [cart]);

  // Load cart from backend on login
  const loadCartFromServer = useCallback(async () => {
    const token = localStorage.getItem("token");
    if (!token) return;
    try {
      const res = await fetch(`${API}/api/cart`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (data.items && data.items.length > 0) {
        setCart(data.items);
      } else {
        const saved = localStorage.getItem("cart");
        setCart(saved ? JSON.parse(saved) : []);
      }
    } catch {}
  }, []);

  // Handle storage events (login/logout)
  useEffect(() => {
    const handleStorage = (e) => {
      if (e.key === "token") {
        if (!e.newValue) {
          // Logged out — immediately clear the visible and browser cart.
          // The authenticated customer's persistent cart remains on the server.
          setCart([]);
          localStorage.setItem("cart", "[]");
        } else {
          // Logged in — load that user's cart from the server.
          loadCartFromServer();
        }
      }
    };
    window.addEventListener("storage", handleStorage);
    window.addEventListener("techmart-auth-change", handleStorage);

    // Load on mount only if logged in.
    if (isLoggedIn()) loadCartFromServer();

    return () => {
      window.removeEventListener("storage", handleStorage);
      window.removeEventListener("techmart-auth-change", handleStorage);
    };
  }, [loadCartFromServer]);

  // Sync to server on cart change (debounced)
  useEffect(() => {
    if (!isLoggedIn() || !cart.length) return;
    const timer = setTimeout(() => syncCartToServer(), 2000);
    return () => clearTimeout(timer);
  }, [cart, syncCartToServer]);

  const addToCart = (product) => {
    // Cart operations require an authenticated customer.
    if (!isLoggedIn()) return false;

    setCart((prev) => {
      const existing = prev.find((item) => item._id === product._id);
      if (existing) {
        return prev.map((item) =>
          item._id === product._id ? { ...item, quantity: item.quantity + 1 } : item
        );
      }
      return [...prev, { ...product, quantity: 1 }];
    });

    return true;
  };

  const removeFromCart = (id) => setCart((prev) => prev.filter((item) => item._id !== id));

  const updateQuantity = (id, quantity) => {
    if (quantity < 1) return;
    setCart((prev) => prev.map((item) => item._id === id ? { ...item, quantity } : item));
  };

  const clearCart = () => {
    setCart([]);
    localStorage.setItem("lastCartItems", localStorage.getItem("cart") || "[]");
    localStorage.removeItem("cart");
    // Clear from server too
    const token = localStorage.getItem("token");
    if (token) {
      fetch(`${API}/api/cart/clear`, { method: "DELETE", headers: { Authorization: `Bearer ${token}` } }).catch(() => {});
    }
  };

  const cartTotal = cart.reduce((total, item) => total + item.price * item.quantity, 0);

  return (
    <CartContext.Provider value={{ cart, addToCart, removeFromCart, updateQuantity, clearCart, cartTotal }}>
      {children}
    </CartContext.Provider>
  );
}

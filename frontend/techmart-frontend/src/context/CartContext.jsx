import { createContext, useEffect, useState, useCallback } from "react";
const API = import.meta.env.VITE_API_URL || "https://techmart-backend-ecbi.onrender.com";
export const CartContext = createContext();

export function CartProvider({ children }) {
  const isLoggedIn = () => !!localStorage.getItem("token");
  const [cart, setCart] = useState(() => {
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
      }
    } catch {}
  }, []);

  // Handle storage events (login/logout)
  useEffect(() => {
    const handleStorage = (e) => {
      if (e.key === "token") {
        if (!e.newValue) {
          // Logged out — keep cart locally
          return;
        } else {
          // Logged in — load from server
          loadCartFromServer();
        }
      }
    };
    window.addEventListener("storage", handleStorage);
    // Load on mount if logged in
    if (isLoggedIn()) loadCartFromServer();
    return () => window.removeEventListener("storage", handleStorage);
  }, [loadCartFromServer]);

  // Sync to server on cart change (debounced)
  useEffect(() => {
    if (!isLoggedIn() || !cart.length) return;
    const timer = setTimeout(() => syncCartToServer(), 2000);
    return () => clearTimeout(timer);
  }, [cart, syncCartToServer]);

  const addToCart = (product) => {
    setCart((prev) => {
      const existing = prev.find((item) => item._id === product._id);
      if (existing) {
        return prev.map((item) =>
          item._id === product._id ? { ...item, quantity: item.quantity + 1 } : item
        );
      }
      return [...prev, { ...product, quantity: 1 }];
    });
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

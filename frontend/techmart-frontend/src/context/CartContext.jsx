import { createContext, useEffect, useState, useCallback } from "react";

const API =
  import.meta.env.VITE_API_URL ||
  "https://techmart-backend-ecbi.onrender.com";

export const CartContext = createContext();

export function CartProvider({ children }) {
  const isLoggedIn = () => !!localStorage.getItem("token");

  // Never expose a customer's cart to a logged-out visitor.
  const [cart, setCart] = useState(() => {
    if (!isLoggedIn()) return [];

    try {
      const saved = localStorage.getItem("cart");
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  // Persist the browser copy ONLY while authenticated.
  useEffect(() => {
    if (isLoggedIn()) {
      localStorage.setItem("cart", JSON.stringify(cart));
    } else {
      localStorage.removeItem("cart");
    }
  }, [cart]);

  // Sync the authenticated customer's cart to the backend.
  const syncCartToServer = useCallback(async () => {
    const token = localStorage.getItem("token");

    if (!token) return;

    try {
      await fetch(`${API}/api/cart/sync`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ items: cart }),
      });
    } catch {
      // Keep the local authenticated cart if the server is temporarily unavailable.
    }
  }, [cart]);

  // Load the authenticated customer's persistent cart.
  const loadCartFromServer = useCallback(async () => {
    const token = localStorage.getItem("token");

    if (!token) {
      setCart([]);
      return;
    }

    try {
      const res = await fetch(`${API}/api/cart`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!res.ok) {
        throw new Error(`Cart request failed: ${res.status}`);
      }

      const data = await res.json();

      if (Array.isArray(data.items)) {
        setCart(data.items);
      } else {
        setCart([]);
      }
    } catch {
      // Do not expose a stale guest/browser cart after authentication fails.
      setCart([]);
    }
  }, []);

  // Handle login/logout events.
  useEffect(() => {
    const handleAuthChange = (e) => {
      if (e?.key !== "token" && e?.type !== "techmart-auth-change") {
        return;
      }

      const token = localStorage.getItem("token");

      if (!token) {
        // Logout/inactivity logout:
        // immediately remove the browser-visible customer cart.
        setCart([]);
        localStorage.removeItem("cart");
        return;
      }

      // Login:
      // load the cart belonging to the authenticated account.
      loadCartFromServer();
    };

    window.addEventListener("storage", handleAuthChange);
    window.addEventListener("techmart-auth-change", handleAuthChange);

    if (isLoggedIn()) {
      loadCartFromServer();
    }

    return () => {
      window.removeEventListener("storage", handleAuthChange);
      window.removeEventListener("techmart-auth-change", handleAuthChange);
    };
  }, [loadCartFromServer]);

  // Sync changes to MongoDB after the user pauses cart activity.
  useEffect(() => {
    if (!isLoggedIn()) return;

    const timer = setTimeout(() => {
      syncCartToServer();
    }, 2000);

    return () => clearTimeout(timer);
  }, [cart, syncCartToServer]);

  // SINGLE AUTHENTICATED CART ENTRY POINT.
  const addToCart = (product) => {
    if (!isLoggedIn()) {
      return false;
    }

    setCart((prev) => {
      const existing = prev.find((item) => item._id === product._id);

      if (existing) {
        return prev.map((item) =>
          item._id === product._id
            ? {
                ...item,
                quantity: (item.quantity || 1) + 1,
              }
            : item
        );
      }

      return [
        ...prev,
        {
          ...product,
          quantity: 1,
        },
      ];
    });

    return true;
  };

  const removeFromCart = (id) => {
    if (!isLoggedIn()) return;

    setCart((prev) => prev.filter((item) => item._id !== id));
  };

  const updateQuantity = (id, quantity) => {
    if (!isLoggedIn()) return;
    if (quantity < 1) return;

    setCart((prev) =>
      prev.map((item) =>
        item._id === id
          ? {
              ...item,
              quantity,
            }
          : item
      )
    );
  };

  const clearCart = () => {
    const token = localStorage.getItem("token");

    setCart([]);

    localStorage.setItem(
      "lastCartItems",
      localStorage.getItem("cart") || "[]"
    );

    localStorage.removeItem("cart");

    if (token) {
      fetch(`${API}/api/cart/clear`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }).catch(() => {});
    }
  };

  const cartTotal = cart.reduce(
    (total, item) =>
      total + Number(item.price || 0) * Number(item.quantity || 1),
    0
  );

  return (
    <CartContext.Provider
      value={{
        cart: isLoggedIn() ? cart : [],
        addToCart,
        removeFromCart,
        updateQuantity,
        clearCart,
        cartTotal: isLoggedIn() ? cartTotal : 0,
      }}
    >
      {children}
    </CartContext.Provider>
  );
}

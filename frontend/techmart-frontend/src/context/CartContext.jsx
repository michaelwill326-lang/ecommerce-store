import { createContext, useEffect, useState } from "react";
export const CartContext = createContext();
export function CartProvider({ children }) {
  const [cart, setCart] = useState(() => {
    if (!localStorage.getItem("token")) return [];
    const saved = localStorage.getItem("cart");
    return saved ? JSON.parse(saved) : [];
  });
  // Save cart to localStorage only when logged in
  useEffect(() => {
    if (localStorage.getItem("token")) {
      localStorage.setItem("cart", JSON.stringify(cart));
    }
  }, [cart]);
  // Clear cart on logout
  useEffect(() => {
    const handleStorage = (e) => {
      if (e.key === "token" && !e.newValue) {
        setCart([]);
        localStorage.removeItem("cart");
      }
    };
    window.addEventListener("storage", handleStorage);
    return () => window.removeEventListener("storage", handleStorage);
  }, []);
  // ADD TO CART
  const addToCart = (product) => {
    setCart((prev) => {
      const existing = prev.find((item) => item._id === product._id);

      if (existing) {
        return prev.map((item) =>
          item._id === product._id
            ? { ...item, quantity: item.quantity + 1 }
            : item
        );
      }

      return [...prev, { ...product, quantity: 1 }];
    });
  };

  // REMOVE ITEM
  const removeFromCart = (id) => {
    setCart((prev) => prev.filter((item) => item._id !== id));
  };

  // UPDATE QUANTITY
  const updateQuantity = (id, quantity) => {
    if (quantity < 1) return;

    setCart((prev) =>
      prev.map((item) =>
        item._id === id
          ? { ...item, quantity }
          : item
      )
    );
  };

  // CLEAR CART
  const clearCart = () => {
    setCart([]);
  };

  // TOTAL PRICE
  const cartTotal = cart.reduce(
    (total, item) => total + item.price * item.quantity,
    0
  );

  return (
    <CartContext.Provider
      value={{
        cart,
        addToCart,
        removeFromCart,
        updateQuantity,
        clearCart,
        cartTotal,
      }}
    >
      {children}
    </CartContext.Provider>
  );
}
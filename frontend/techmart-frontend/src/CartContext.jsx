import { createContext, useState } from "react";

export const CartContext = createContext();

export function CartProvider({ children }) {
  const [cart, setCart] = useState(
    JSON.parse(localStorage.getItem("cart")) || []
  );

  const saveCart = (updatedCart) => {
    setCart(updatedCart);
    localStorage.setItem("cart", JSON.stringify(updatedCart));
  };

  /* ADD TO CART */
  const addToCart = (product) => {
    let updatedCart = [...cart];
    const existing = updatedCart.find((item) => item._id === product._id);
    if (existing) {
      existing.quantity += 1;
    } else {
      updatedCart.push({ ...product, quantity: 1 });
    }
    saveCart(updatedCart);
  };

  /* REMOVE FROM CART */
  const removeFromCart = (id) => {
    const updatedCart = cart.filter((item) => item._id !== id);
    saveCart(updatedCart);
  };

  /* UPDATE QUANTITY */
  const updateQuantity = (id, quantity) => {
    if (quantity < 1) {
      removeFromCart(id);
      return;
    }
    const updatedCart = cart.map((item) =>
      item._id === id ? { ...item, quantity } : item
    );
    saveCart(updatedCart);
  };

  /* CLEAR CART */
  const clearCart = () => {
    saveCart([]);
  };

  return (
    <CartContext.Provider
      value={{
        cart,
        setCart,
        addToCart,
        removeFromCart,
        updateQuantity,
        clearCart,
      }}
    >
      {children}
    </CartContext.Provider>
  );
}
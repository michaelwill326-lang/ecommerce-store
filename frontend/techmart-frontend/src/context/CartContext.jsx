import { createContext, useContext, useState, useEffect } from "react";

const CartContext = createContext();

export function CartProvider({ children }) {
  const [cart, setCart] = useState(() => {
    return JSON.parse(localStorage.getItem("cart")) || [];
  });

  const [saved, setSaved] = useState([]);

  const [isCartOpen, setIsCartOpen] = useState(false);
  const openCart = () => setIsCartOpen(true);
  const closeCart = () => setIsCartOpen(false);

  // 💾 persist cart
  useEffect(() => {
    localStorage.setItem("cart", JSON.stringify(cart));
  }, [cart]);

  // 🧠 ADD TO CART (SMART UPSALE LOGIC)
  const addToCart = (product) => {
    const existing = cart.find(p => p._id === product._id);

    let updated;

    if (existing) {
      updated = cart.map(p =>
        p._id === product._id
          ? { ...p, qty: p.qty + 1 }
          : p
      );
    } else {
      updated = [...cart, { ...product, qty: 1 }];
    }

    setCart(updated);

    // 🧠 AI BEHAVIOR: open cart instantly
    setIsCartOpen(true);

    // 🧠 track recently added
    sessionStorage.setItem("lastAdded", JSON.stringify(product));
  };

  // ❌ REMOVE
  const removeFromCart = (id) => {
    setCart(cart.filter(p => p._id !== id));
  };

  // ➕ INCREASE
  const increaseQty = (id) => {
    setCart(cart.map(p =>
      p._id === id ? { ...p, qty: p.qty + 1 } : p
    ));
  };

  // ➖ DECREASE
  const decreaseQty = (id) => {
    setCart(cart.map(p =>
      p._id === id && p.qty > 1
        ? { ...p, qty: p.qty - 1 }
        : p
    ));
  };

  // 🧹 CLEAR
  const clearCart = () => {
    setCart([]);
    localStorage.removeItem("cart");
  };

  // 💰 TOTALS
  const total = cart.reduce(
    (sum, item) => sum + item.price * item.qty,
    0
  );

  const cartCount = cart.reduce(
    (sum, item) => sum + item.qty,
    0
  );

  // 🧠 AI FEATURE 1: FREQUENTLY BOUGHT TOGETHER (SIMULATION)
  const getRecommendations = () => {
    if (cart.length === 0) return [];

    const categories = cart.map(p => p.category);
    const topCategory = categories[0];

    // simple smart filter (replace later with AI backend)
    return cart
      .filter(p => p.category === topCategory)
      .slice(0, 3);
  };

  // 🧠 AI FEATURE 2: SAVE FOR LATER
  const saveForLater = (item) => {
    setSaved([...saved, item]);
    setCart(cart.filter(p => p._id !== item._id));
  };

  const moveToCart = (item) => {
    setCart([...cart, item]);
    setSaved(saved.filter(p => p._id !== item._id));
  };

  return (
    <CartContext.Provider
      value={{
        cart,
        saved,
        addToCart,
        removeFromCart,
        increaseQty,
        decreaseQty,
        clearCart,
        total,
        cartCount,

        isCartOpen,
        openCart,
        closeCart,

        // 🧠 AI FEATURES
        getRecommendations,
        saveForLater,
        moveToCart
      }}
    >
      {children}
    </CartContext.Provider>
  );
}

export const useCart = () => useContext(CartContext);
// src/context/WishlistContext.jsx
import { createContext, useContext, useState, useEffect } from "react";

const WishlistContext = createContext();

export const WishlistProvider = ({ children }) => {
  const [wishlist, setWishlist] = useState([]);

  // Load wishlist from localStorage
  useEffect(() => {
    const savedWishlist = localStorage.getItem("techmart_wishlist");
    if (savedWishlist) setWishlist(JSON.parse(savedWishlist));
  }, []);

  // Save wishlist whenever it changes
  useEffect(() => {
    localStorage.setItem("techmart_wishlist", JSON.stringify(wishlist));
  }, [wishlist]);

  const addToWishlist = (product) => {
    setWishlist((prev) => {
      if (!prev.find((item) => item.id === product.id)) {
        return [...prev, product];
      }
      return prev;
    });
  };

  const removeFromWishlist = (productId) => {
    setWishlist((prev) => prev.filter((item) => item.id !== productId));
  };

  const clearWishlist = () => setWishlist([]);

  return (
    <WishlistContext.Provider
      value={{ wishlist, addToWishlist, removeFromWishlist, clearWishlist }}
    >
      {children}
    </WishlistContext.Provider>
  );
};

// Custom hook for easier access
export const useWishlist = () => useContext(WishlistContext);
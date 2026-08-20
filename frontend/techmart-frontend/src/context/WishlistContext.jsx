import { createContext, useContext, useState, useEffect } from "react";

const WishlistContext = createContext();

export function WishlistProvider({ children }) {
  const isLoggedIn = () => !!sessionStorage.getItem("token");

  const [wishlist, setWishlist] = useState(() => {
    if (!isLoggedIn()) return [];

    try {
      return JSON.parse(localStorage.getItem("wishlist")) || [];
    } catch {
      return [];
    }
  });

  // Keep wishlist in localStorage only while logged in.
  useEffect(() => {
    if (isLoggedIn()) {
      localStorage.setItem("wishlist", JSON.stringify(wishlist));
    } else {
      localStorage.removeItem("wishlist");
    }
  }, [wishlist]);

  // React immediately to login/logout events in this tab and other tabs.
  useEffect(() => {
    const handleAuthChange = (e) => {
      if (e.key === "token" || e.type === "techmart-auth-change") {
        if (!sessionStorage.getItem("token")) {
          setWishlist([]);
          localStorage.removeItem("wishlist");
        }
      }
    };

    window.addEventListener("storage", handleAuthChange);
    window.addEventListener("techmart-auth-change", handleAuthChange);

    return () => {
      window.removeEventListener("storage", handleAuthChange);
      window.removeEventListener("techmart-auth-change", handleAuthChange);
    };
  }, []);

  const addToWishlist = (product) => {
    if (!isLoggedIn()) {
      return false;
    }

    setWishlist((prev) => {
      if (prev.find((p) => p._id === product._id)) {
        return prev;
      }

      return [...prev, product];
    });

    return true;
  };

  const removeFromWishlist = (id) => {
    setWishlist((prev) => prev.filter((p) => p._id !== id));
  };

  const clearWishlist = () => {
    setWishlist([]);
    localStorage.removeItem("wishlist");
  };

  const isInWishlist = (id) =>
    isLoggedIn() && wishlist.some((p) => p._id === id);

  return (
    <WishlistContext.Provider
      value={{
        wishlist: isLoggedIn() ? wishlist : [],
        addToWishlist,
        removeFromWishlist,
        clearWishlist,
        isInWishlist,
      }}
    >
      {children}
    </WishlistContext.Provider>
  );
}

export const useWishlist = () => useContext(WishlistContext);

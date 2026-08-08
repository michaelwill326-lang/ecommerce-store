const API = import.meta.env.VITE_API_URL || "https://techmart-backend-ecbi.onrender.com";

const getSessionId = () => {
  let sid = sessionStorage.getItem("techmart_sid");
  if (!sid) { sid = "s_" + Date.now() + "_" + Math.random().toString(36).slice(2); sessionStorage.setItem("techmart_sid", sid); }
  return sid;
};

export const track = async (type, data = {}) => {
  try {
    const token = localStorage.getItem("token");
    await fetch(`${API}/api/behavior/track`, {
      method: "POST",
      headers: { "Content-Type": "application/json", ...(token ? { Authorization: `Bearer ${token}` } : {}) },
      body: JSON.stringify({ type, sessionId: getSessionId(), city: "Lagos", ...data })
    });
  } catch {}
};

export const trackView = (product) => track("view", { productId: product._id, productName: product.name, category: product.category, price: product.price });
export const trackSearch = (query) => track("search", { searchQuery: query });
export const trackAddToCart = (product) => track("add_to_cart", { productId: product._id, productName: product.name, category: product.category, price: product.price });
export const trackPurchase = (items) => items.forEach(item => track("purchase", { productId: item.productId || item._id, productName: item.name, price: item.price }));
export const trackWishlist = (product) => track("wishlist", { productId: product._id, productName: product.name, category: product.category });

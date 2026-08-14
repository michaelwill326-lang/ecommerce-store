import { ProductDetailSkeleton } from "../components/Skeleton";
import { trackView, trackAddToCart, trackWishlist } from "../utils/tracker";
import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useContext } from "react";
import { CartContext } from "../context/CartContext";
import { useToast } from "../App";
import { useWishlist } from "../context/WishlistContext";
import axios from "axios";
import ReviewSection from "../components/ReviewSection";
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";
import AIReviewSummary from "../components/AIReviewSummary";
import AIBundle from "../components/AIBundle";

const API = import.meta.env.VITE_API_URL || "https://techmart-backend-ecbi.onrender.com";
const FALLBACK_IMG = "https://placehold.co/500x400?text=No+Image";

export default function ProductDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { cart, addToCart } = useContext(CartContext);
  const showToast = useToast();
  const [cartLoading, setCartLoading] = useState(false);
  const { addToWishlist, removeFromWishlist, isInWishlist } = useWishlist();

  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [selectedImage, setSelectedImage] = useState(0);
  const [touchStart, setTouchStart] = useState(null);
  const [touchEnd, setTouchEnd] = useState(null);

  const submitReport = async () => {
    if (!reportForm.reason) return;
    const token = localStorage.getItem("token");
    if (!token) { if (showToast) showToast("Please login to report a product", "error"); return; }
    setReportLoading(true);
    try {
      await axios.post(`${API}/api/products/${id}/report`, reportForm, { headers: { Authorization: `Bearer ${token}` } });
      if (showToast) showToast("Report submitted. Thank you!", "success");
      setShowReport(false);
      setReportForm({ reason: "", details: "" });
    } catch (err) {
      if (showToast) showToast(err.response?.data?.error || "Failed to submit report", "error");
    } finally { setReportLoading(false); }
  };

  const handleTouchStart = (e) => setTouchStart(e.targetTouches[0].clientX);
  const handleTouchMove = (e) => setTouchEnd(e.targetTouches[0].clientX);
  const handleTouchEnd = () => {
    if (!touchStart || !touchEnd) return;
    const diff = touchStart - touchEnd;
    if (Math.abs(diff) > 50) {
      if (diff > 0) setSelectedImage(i => Math.min(i + 1, images.length - 1));
      else setSelectedImage(i => Math.max(i - 1, 0));
    }
    setTouchStart(null);
    setTouchEnd(null);
  };
  const [isMobile, setIsMobile] = useState(() => typeof window !== 'undefined' ? window.innerWidth <= 768 : false);
  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth <= 768);
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);
  const [added, setAdded] = useState(false);
  const [quantity, setQuantity] = useState(1);
  const [recommendations, setRecommendations] = useState([]);
  const [priceHistory, setPriceHistory] = useState([]);
  const [showReport, setShowReport] = useState(false);
  const [reportForm, setReportForm] = useState({ reason: "", details: "" });
  const [reportLoading, setReportLoading] = useState(false);
  const [sellerResponseTime, setSellerResponseTime] = useState(null);
  const [showPriceHistory, setShowPriceHistory] = useState(false);
  const [recLoading, setRecLoading] = useState(false);

  const [selectedVariant, setSelectedVariant] = useState(null);
  const inCart = cart.some((item) => item._id === id);
  const wishlisted = isInWishlist(id);

  useEffect(() => {
    fetchProduct();
    return () => {
      document.title = "TechMart — Nigeria's Trusted Tech Marketplace";
    };
  }, [id]);

  const fetchProduct = async () => {
    try {
      setLoading(true);
      const res = await axios.get(`${API}/api/products/${id}`);
      setProduct(res.data);
      trackView(res.data);
      // Fetch seller response time
      if (res.data.vendorId) {
        axios.get(`${API}/api/seller/${res.data.vendorId}/response-time`)
          .then(r => setSellerResponseTime(r.data))
          .catch(() => {});
      }
      // Fetch price history
      try {
        const ph = await axios.get(`${API}/api/products/${id}/price-history`);
        setPriceHistory(ph.data.history || []);
      } catch {}
      if (res.data.variants && res.data.variants.length > 0) {
        setSelectedVariant(res.data.variants[0]);
      }
      setError("");
      // Update page title and meta for SEO
      document.title = `${res.data.name} — ₦${res.data.price?.toLocaleString()} | TechMart`;
      const metaDesc = document.querySelector('meta[name="description"]');
      if (metaDesc) metaDesc.content = res.data.description?.slice(0, 160) || `Buy ${res.data.name} on TechMart`;
      const ogTitle = document.querySelector('meta[property="og:title"]');
      if (ogTitle) ogTitle.content = `${res.data.name} — ₦${res.data.price?.toLocaleString()} | TechMart`;
      const ogImage = document.querySelector('meta[property="og:image"]');
      if (ogImage && res.data.images?.[0]) ogImage.content = res.data.images[0];
      fetchRecommendations(res.data);

      // SAVE TO RECENTLY VIEWED
      const recent = (() => { try { return JSON.parse(localStorage.getItem("recent")) || []; } catch { return []; } })();
      const filtered = recent.filter((p) => p._id !== res.data._id);
      filtered.unshift(res.data);
      localStorage.setItem("recent", JSON.stringify(filtered.slice(0, 6)));

    } catch (err) {
      setError("Product not found");
    } finally {
      setLoading(false);
    }
  };

  const fetchRecommendations = async (currentProduct) => {
    try {
      setRecLoading(true);
      const res = await axios.get(`${API}/api/products`);
      const all = res.data.products || res.data;
      const same = all.filter(p => p._id !== currentProduct._id && p.category === currentProduct.category);
      const others = same.length >= 2 ? same : all.filter(p => p._id !== currentProduct._id);
      setRecommendations(others.slice(0, 4));
    } catch (err) {
      console.error("Recommendations failed", err);
    } finally {
      setRecLoading(false);
    }
  };

  const handleAddToCart = () => {
    if (cartLoading) return;

    if (!localStorage.getItem("token")) {
      if (showToast) showToast("Please login to add items to your cart", "error");
      navigate("/login");
      return;
    }

    setCartLoading(true);
    const itemToAdd = selectedVariant
      ? { ...product, price: selectedVariant.price, selectedVariant, name: `${product.name} — ${selectedVariant.name || selectedVariant.color || selectedVariant.storage || ""}`.trim().replace(/— $/, "") }
      : product;
    for (let i = 0; i < quantity; i++) {
      addToCart(itemToAdd);
    }
    setAdded(true);
    if (showToast) showToast(`${product.name} added to cart!`);
    trackAddToCart(itemToAdd);
    setTimeout(() => { setAdded(false); setCartLoading(false); }, 1500);
  };

  const handleCompare = () => {
    try {
      const items = JSON.parse(localStorage.getItem("compareItems") || "[]");
      const exists = items.find(i => i._id === product._id);
      if (exists) {
        const updated = items.filter(i => i._id !== product._id);
        localStorage.setItem("compareItems", JSON.stringify(updated));
      } else if (items.length >= 3) {
        alert("You can compare up to 3 products at a time");
        return;
      } else {
        items.push(product);
        localStorage.setItem("compareItems", JSON.stringify(items));
      }
      window.dispatchEvent(new Event("compareUpdated"));
    } catch {}
  };

  const handleWishlist = () => {
    if (wishlisted) {
      removeFromWishlist(id);
    } else {
      addToWishlist(product);
      trackWishlist(product);
    }
  };

  if (loading) return <ProductDetailSkeleton />;

  if (error || !product) return (
    <div style={styles.centered}>
      <p style={{ fontSize: "48px" }}>😕</p>
      <h2 style={{ color: "var(--text-primary)" }}>Product not found</h2>
      <button onClick={() => navigate("/")} style={styles.backBtn}>
        ← Back to Shop
      </button>
    </div>
  );

  const images = product.images?.length > 0 ? product.images : [FALLBACK_IMG];
  const approvedReviews = product.reviews?.filter(r => r.approved) || [];
  const averageRating = approvedReviews.length
    ? (approvedReviews.reduce((sum, r) => sum + r.stars, 0) / approvedReviews.length).toFixed(1)
    : null;

  return (
    <div style={styles.page}>

      {/* BACK BUTTON */}
      <button onClick={() => navigate(-1)} style={styles.backBtn}>
        ← Back
      </button>

      <div style={isMobile ? styles.layoutMobile : styles.layout}>

        {/* LEFT — IMAGES */}
        <div style={styles.imageCol}>

          {/* MAIN IMAGE */}
          <div style={styles.mainImgWrap}
            onTouchStart={handleTouchStart}
            onTouchMove={handleTouchMove}
            onTouchEnd={handleTouchEnd}
          >
            {/* Prev arrow */}
            {images.length > 1 && selectedImage > 0 && (
              <button onClick={() => setSelectedImage(i => i - 1)} style={{ position: "absolute", left: "10px", top: "50%", transform: "translateY(-50%)", zIndex: 10, background: "rgba(0,0,0,0.6)", border: "none", color: "#fff", borderRadius: "50%", width: "32px", height: "32px", cursor: "pointer", fontSize: "16px", display: "flex", alignItems: "center", justifyContent: "center" }}>‹</button>
            )}
            {/* Next arrow */}
            {images.length > 1 && selectedImage < images.length - 1 && (
              <button onClick={() => setSelectedImage(i => i + 1)} style={{ position: "absolute", right: "10px", top: "50%", transform: "translateY(-50%)", zIndex: 10, background: "rgba(0,0,0,0.6)", border: "none", color: "#fff", borderRadius: "50%", width: "32px", height: "32px", cursor: "pointer", fontSize: "16px", display: "flex", alignItems: "center", justifyContent: "center" }}>›</button>
            )}
            <img
              src={images[selectedImage]}
              alt={product.name}
              onError={(e) => { e.target.src = FALLBACK_IMG; }}
              style={{ ...styles.mainImg, transition: "opacity 0.2s ease" }}
            />
            {/* Dot indicators */}
            {images.length > 1 && (
              <div style={{ position: "absolute", bottom: "10px", left: "50%", transform: "translateX(-50%)", display: "flex", gap: "6px", zIndex: 10 }}>
                {images.map((_, i) => (
                  <div key={i} onClick={() => setSelectedImage(i)} style={{ width: selectedImage === i ? "20px" : "6px", height: "6px", borderRadius: "3px", background: selectedImage === i ? "#f97316" : "rgba(255,255,255,0.5)", cursor: "pointer", transition: "all 0.3s ease" }} />
                ))}
              </div>
            )}
            {product.variants && product.variants.length > 1 && (
              <div style={{ marginBottom: "16px" }}>
                <p style={{ color: "var(--text-primary)", fontWeight: "700", fontSize: "14px", margin: "0 0 10px" }}>Select Variant</p>
                <div style={{ display: "flex", flexWrap: "wrap", gap: "8px" }}>
                  {product.variants.map((v, i) => (
                    <button key={i} onClick={() => setSelectedVariant(v)}
                      style={{ padding: "8px 14px", borderRadius: "8px", border: `2px solid ${selectedVariant?._id === v._id || (selectedVariant === v) ? "#f97316" : "#333"}`, background: selectedVariant === v ? "#1a0a00" : "#111", color: selectedVariant === v ? "#f97316" : "#888", cursor: "pointer", fontWeight: "600", fontSize: "13px" }}>
                      {v.name || [v.color, v.storage, v.size, v.condition].filter(Boolean).join(" / ")}
                      <span style={{ display: "block", fontSize: "11px", color: selectedVariant === v ? "#f97316" : "#666" }}>₦{Number(v.price).toLocaleString()}</span>
                    </button>
                  ))}
                </div>
                {selectedVariant && (
                  <p style={{ color: selectedVariant.stock > 0 ? "#22c55e" : "#dc2626", fontSize: "12px", marginTop: "8px", fontWeight: "600" }}>
                    {selectedVariant.stock > 0 ? `✅ ${selectedVariant.stock} in stock` : "❌ Out of stock"}
                  </p>
                )}
              </div>
            )}

            {/* Seller Response Time */}
            {sellerResponseTime?.responseLabel && (
              <div style={{ display: "flex", alignItems: "center", gap: "6px", marginBottom: "10px" }}>
                <span style={{ background: "#0a1a0a", border: "1px solid #22c55e", borderRadius: "6px", padding: "4px 10px", color: "#22c55e", fontSize: "11px", fontWeight: "700" }}>⏱ {sellerResponseTime.responseLabel}</span>
                {sellerResponseTime.verified && <span style={{ background: "#0a0a2a", border: "1px solid #3b82f6", borderRadius: "6px", padding: "4px 10px", color: "#3b82f6", fontSize: "11px", fontWeight: "700" }}>✅ Verified Seller</span>}
              </div>
            )}

            {product.stock === 0 && (
              <div style={styles.outOfStockBadge}>Out of Stock</div>
            )}

            {/* WISHLIST HEART BUTTON ON IMAGE */}
            <button
              onClick={handleWishlist}
              style={{
                ...styles.heartBtn,
                background: wishlisted ? "#dc2626" : "rgba(0,0,0,0.6)",
                border: wishlisted ? "none" : "1px solid #333",
              }}
            >
              {wishlisted ? "❤️" : "🤍"}
            </button>
            {/* Compare Button */}
            <button
              onClick={handleCompare}
              style={{ position: "absolute", top: "50px", right: "10px", background: "rgba(0,0,0,0.6)", border: "1px solid #333", borderRadius: "50%", width: "36px", height: "36px", cursor: "pointer", fontSize: "14px", display: "flex", alignItems: "center", justifyContent: "center" }}
              title="Add to Compare"
            >
              ⚖️
            </button>
            {/* Share Button */}
            <button
              onClick={() => {
                const seoUrl = `${API}/api/seo/product/${product._id}`;
                const shareUrl = window.location.href;
                const shareText = `Check out ${product.name} on TechMart for ₦${product.price?.toLocaleString()}! ${shareUrl}`;
                if (navigator.share) {
                  navigator.share({ title: product.name, text: shareText, url: shareUrl });
                } else {
                  window.open(`https://wa.me/?text=${encodeURIComponent(shareText)}`, "_blank");
                }
              }}
              style={{ position: "absolute", bottom: "10px", left: "10px", background: "rgba(0,0,0,0.6)", border: "1px solid #333", borderRadius: "50%", width: "36px", height: "36px", cursor: "pointer", fontSize: "16px", display: "flex", alignItems: "center", justifyContent: "center" }}
            >
              📤
            </button>
          </div>

          {/* THUMBNAILS */}
          {images.length > 1 && (
            <div style={styles.thumbRow}>
              {images.map((img, i) => (
                <img
                  key={i}
                  src={img}
                  alt={`thumb-${i}`}
                  onError={(e) => { e.target.src = FALLBACK_IMG; }}
                  onClick={() => setSelectedImage(i)}
                  style={{
                    ...styles.thumb,
                    border: selectedImage === i
                      ? "2px solid #f97316"
                      : "2px solid transparent",
                  }}
                />
              ))}
            </div>
          )}
        </div>

        {/* RIGHT — DETAILS */}
        <div style={styles.detailsCol}>
          {product.vendorName && (
            <div style={{ display: "flex", alignItems: "center", gap: "6px", marginBottom: "8px", flexWrap: "wrap" }}>
              <span style={{ color: "var(--text-muted)", fontSize: "13px" }}>Sold by</span>
              <span style={{ color: "#f97316", fontWeight: "700", fontSize: "13px" }}>{product.vendorName}</span>
              <span style={{ background: "#0a2a1a", border: "1px solid #22c55e", color: "#22c55e", fontSize: "11px", fontWeight: "700", padding: "2px 8px", borderRadius: "20px" }}>✓ Verified Seller</span>
            </div>
          )}
          {/* BUYER PROTECTION BADGE */}
          <div style={{ display: "flex", gap: "8px", marginBottom: "8px", flexWrap: "wrap" }}>
            <span style={{ background: "#0a1a2a", border: "1px solid #3b82f6", color: "#60a5fa", fontSize: "11px", fontWeight: "700", padding: "4px 10px", borderRadius: "20px" }}>🛡️ Buyer Protected</span>
            <span style={{ background: "#1a0a00", border: "1px solid #f97316", color: "#f97316", fontSize: "11px", fontWeight: "700", padding: "4px 10px", borderRadius: "20px" }}>↩️ Easy Returns</span>
            <span style={{ background: "#0a2a1a", border: "1px solid #22c55e", color: "#22c55e", fontSize: "11px", fontWeight: "700", padding: "4px 10px", borderRadius: "20px" }}>⚡ Fast Delivery</span>
          </div>

          {/* CATEGORY */}
          <span style={styles.categoryBadge}>{product.category}</span>

          {/* NAME */}
          <h1 style={styles.productName}>{product.name}</h1>

          {/* RATING */}
          {averageRating && (
            <div style={styles.ratingRow}>
              <span style={styles.stars}>
                {"★".repeat(Math.round(averageRating))}
                {"☆".repeat(5 - Math.round(averageRating))}
              </span>
              <span style={styles.ratingText}>
                {averageRating} ({approvedReviews.length} review{approvedReviews.length !== 1 ? "s" : ""})
              </span>
            </div>
          )}

          {/* PRICE */}
          <p style={styles.price}>₦{product.price?.toLocaleString()}</p>

          {/* STOCK */}
          <p style={{
            ...styles.stockText,
            color: (selectedVariant ? selectedVariant.stock : product.stock) > 0 ? "#22c55e" : "#dc2626"
          }}>
            {product.stock > 0 ? `✅ ${product.stock} in stock` : "❌ Out of stock"}
          </p>

          {/* DESCRIPTION */}
          <p style={styles.description}>{product.description}</p>

          <div style={styles.divider} />

          {/* QUANTITY */}
          <div style={styles.qtyRow}>
            <label style={styles.label}>Quantity</label>
            <div style={styles.qtyControls}>
              <button
                onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                style={styles.qtyBtn}
              >
                −
              </button>
              <span style={styles.qtyNum}>{quantity}</span>
              <button
                onClick={() => setQuantity((q) => Math.min(product.stock, q + 1))}
                style={styles.qtyBtn}
                disabled={quantity >= product.stock}
              >
                +
              </button>
            </div>
          </div>

          {/* ADD TO CART */}
          <button
            onClick={handleAddToCart}
            disabled={product.stock === 0 || cartLoading}
            style={{
              ...styles.addBtn,
              background: added
                ? "linear-gradient(135deg, #22c55e, #16a34a)"
                : product.stock === 0 || cartLoading
                ? "#333"
                : "linear-gradient(135deg, #f97316, #dc2626)",
              cursor: product.stock === 0 || cartLoading ? "not-allowed" : "pointer",
              opacity: cartLoading ? 0.7 : 1,
            }}
          >
            {cartLoading ? "Adding..." : added ? "✅ Added to Cart!" : product.stock === 0 ? "Out of Stock" : "🛒 Add to Cart"}
          </button>

          {/* WISHLIST BUTTON */}
          <button
            onClick={handleWishlist}
            style={{
              ...styles.wishlistBtn,
              borderColor: wishlisted ? "#dc2626" : "#f97316",
              color: wishlisted ? "#dc2626" : "#f97316",
              background: wishlisted ? "rgba(220,38,38,0.1)" : "transparent",
            }}
          >
            {wishlisted ? "❤️ Remove from Wishlist" : "🤍 Add to Wishlist"}
          </button>

          {/* WHATSAPP SHARE */}
          <a
            href={`https://wa.me/?text=${encodeURIComponent("Check out " + product.name + " on TechMart for just N" + product.price?.toLocaleString() + "! Shop here: " + window.location.href)}`}
            target="_blank"
            rel="noopener noreferrer"
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: "8px",
              padding: "14px",
              background: "#25D366",
              border: "none",
              borderRadius: "12px",
              fontSize: "15px",
              fontWeight: "700",
              cursor: "pointer",
              color: "var(--text-primary)",
              textDecoration: "none",
            }}
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="white">
              <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
            </svg>
            Share on WhatsApp
          </a>
          {/* MESSAGE SELLER */}
          {product.vendorId && (
            <button
              onClick={async () => {
                const user = (() => { try { return JSON.parse(localStorage.getItem("user")); } catch { return null; } })();
                const token = localStorage.getItem("token");
                if (!user || !token) { navigate("/login"); return; }
                const msg = prompt("Send a message to the seller about this product:");
                if (!msg) return;
                try {
                  await fetch(`${API}/api/seller/messages`, {
                    method: "POST",
                    headers: { "Content-Type": "application/json", "Authorization": `Bearer ${token}` },
                    body: JSON.stringify({ sellerId: product.vendorId, productId: product._id, productName: product.name, message: msg })
                  });
                  showToast("Message sent to seller!", "success");
                } catch { showToast("Failed to send message", "error"); }
              }}
              style={{ padding: "14px", background: "transparent", border: "1px solid #3b82f6", borderRadius: "12px", fontSize: "15px", fontWeight: "600", cursor: "pointer", color: "#3b82f6", width: "100%" }}
            >
              Message Seller
            </button>
          )}
          {/* VIEW CART */}
          {inCart && !added && (
            <button
              onClick={() => navigate("/cart")}
              style={styles.viewCartBtn}
            >
              View Cart →
            </button>
          )}

        </div>
      </div>

      <AIReviewSummary productId={product._id} />
                {/* REPORT PRODUCT */}
          <div style={{ marginBottom: "12px", textAlign: "right" }}>
            <button onClick={() => setShowReport(!showReport)} style={{ background: "none", border: "none", color: "#888", cursor: "pointer", fontSize: "12px", textDecoration: "underline" }}>🚨 Report this product</button>
          </div>
          {showReport && (
            <div style={{ background: "var(--bg-card)", border: "1px solid #dc2626", borderRadius: "12px", padding: "20px", marginBottom: "16px" }}>
              <p style={{ color: "#dc2626", fontWeight: "700", fontSize: "14px", margin: "0 0 12px" }}>🚨 Report Product</p>
              <select value={reportForm.reason} onChange={e => setReportForm({...reportForm, reason: e.target.value})} style={{ width: "100%", padding: "10px 12px", background: "#111", border: "1px solid #333", borderRadius: "8px", color: "var(--text-primary)", fontSize: "13px", marginBottom: "10px" }}>
                <option value="">Select a reason...</option>
                <option value="fake">Fake/Counterfeit product</option>
                <option value="counterfeit">Replica/Knockoff</option>
                <option value="wrong_description">Wrong description/photos</option>
                <option value="scam">Suspected scam</option>
                <option value="inappropriate">Inappropriate content</option>
                <option value="other">Other</option>
              </select>
              <textarea value={reportForm.details} onChange={e => setReportForm({...reportForm, details: e.target.value})} placeholder="Additional details (optional)" style={{ width: "100%", padding: "10px 12px", background: "#111", border: "1px solid #333", borderRadius: "8px", color: "var(--text-primary)", fontSize: "13px", marginBottom: "10px", height: "80px", resize: "none", boxSizing: "border-box" }} />
              <div style={{ display: "flex", gap: "8px" }}>
                <button onClick={submitReport} disabled={reportLoading || !reportForm.reason} style={{ flex: 1, padding: "10px", background: "#dc2626", color: "#fff", border: "none", borderRadius: "8px", cursor: "pointer", fontWeight: "700", fontSize: "13px", opacity: !reportForm.reason ? 0.6 : 1 }}>
                  {reportLoading ? "Submitting..." : "Submit Report"}
                </button>
                <button onClick={() => setShowReport(false)} style={{ padding: "10px 16px", background: "#333", color: "#888", border: "none", borderRadius: "8px", cursor: "pointer", fontSize: "13px" }}>Cancel</button>
              </div>
            </div>
          )}

          {/* PRICE HISTORY */}
          {priceHistory.length > 1 && (
            <div style={{ background: "var(--bg-card)", border: "1px solid #2a2a2a", borderRadius: "12px", padding: "16px", marginBottom: "16px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "12px" }}>
                <p style={{ color: "var(--text-primary)", fontWeight: "700", fontSize: "14px", margin: 0 }}>📈 Price History</p>
                <button onClick={() => setShowPriceHistory(!showPriceHistory)} style={{ padding: "4px 12px", background: "#1a1a1a", border: "1px solid #333", color: "var(--text-muted)", borderRadius: "6px", cursor: "pointer", fontSize: "12px" }}>
                  {showPriceHistory ? "Hide" : "Show"}
                </button>
              </div>
              {showPriceHistory && (
                <div>
                  <ResponsiveContainer width="100%" height={150}>
                    <LineChart data={priceHistory.map(h => ({ date: new Date(h.recordedAt).toLocaleDateString("en-NG", { month: "short", day: "numeric" }), price: h.price }))}>
                      <XAxis dataKey="date" tick={{ fill: "#888", fontSize: 10 }} />
                      <YAxis tick={{ fill: "#888", fontSize: 10 }} tickFormatter={v => `₦${(v/1000).toFixed(0)}k`} />
                      <Tooltip formatter={v => [`₦${Number(v).toLocaleString()}`, "Price"]} contentStyle={{ background: "#111", border: "1px solid #333", borderRadius: "8px", color: "#fff" }} />
                      <Line type="monotone" dataKey="price" stroke="#f97316" strokeWidth={2} dot={{ fill: "#f97316", r: 3 }} />
                    </LineChart>
                  </ResponsiveContainer>
                  {priceHistory.length >= 2 && (() => {
                    const first = priceHistory[0].price;
                    const last = priceHistory[priceHistory.length - 1].price;
                    const diff = last - first;
                    const pct = Math.round((diff / first) * 100);
                    return (
                      <p style={{ color: diff <= 0 ? "#22c55e" : "#dc2626", fontSize: "12px", fontWeight: "700", margin: "8px 0 0", textAlign: "center" }}>
                        {diff <= 0 ? `✅ Price dropped ${Math.abs(pct)}% — good time to buy!` : `⚠️ Price increased ${pct}% — consider waiting`}
                      </p>
                    );
                  })()}
                </div>
              )}
            </div>
          )}

          <ReviewSection product={product} onRefresh={fetchProduct} />
      <AIBundle productId={product._id} onAddBundle={(bundleProducts) => {
        bundleProducts.forEach(p => addToCart(p));
        showToast("Bundle added to cart!", "success");
      }} />

      {/* YOU MAY ALSO LIKE */}
      {recommendations.length > 0 && (
        <div style={styles.recSection}>
          <h2 style={styles.recTitle}>✨ You May Also Like</h2>
          <div style={styles.recGrid}>
            {recommendations.map(rec => (
              <div
                key={rec._id}
                style={styles.recCard}
                onClick={() => navigate(`/product/${rec._id}`)}
              >
                <img
                  src={rec.images?.[0] || "https://placehold.co/300x200?text=No+Image"}
                  alt={rec.name}
                  onError={e => { e.target.src = "https://placehold.co/300x200?text=No+Image"; }}
                  style={styles.recImg}
                />
                <div style={styles.recInfo}>
                  <p style={styles.recName}>{rec.name}</p>
                  <p style={styles.recPrice}>₦{rec.price?.toLocaleString()}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

    </div>
  );
}

const styles = {
  page: { maxWidth: "1100px", margin: "0 auto", padding: "16px", minHeight: "100vh", paddingBottom: "80px" },
  centered: { display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", minHeight: "70vh", gap: "16px" },
  spinner: { width: "40px", height: "40px", border: "4px solid #333", borderTop: "4px solid #f97316", borderRadius: "50%", animation: "spin 0.8s linear infinite" },
  backBtn: { background: "var(--bg-card)", border: "1px solid var(--border-color)", color: "var(--text-primary)", padding: "8px 14px", borderRadius: "8px", cursor: "pointer", fontSize: "13px", marginBottom: "16px" },
  layout: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: "48px", alignItems: "start" },
  layoutMobile: { display: "flex", flexDirection: "column", gap: "20px" },
  imageCol: { display: "flex", flexDirection: "column", gap: "12px" },
  mainImgWrap: { position: "relative", borderRadius: "16px", overflow: "hidden", background: "var(--bg-card)" },
  mainImg: { width: "100%", height: "300px", objectFit: "contain", display: "block", background: "#fff" },
  outOfStockBadge: { position: "absolute", top: "16px", left: "16px", background: "#dc2626", color: "var(--text-primary)", padding: "6px 14px", borderRadius: "999px", fontSize: "13px", fontWeight: "700" },
  heartBtn: { position: "absolute", top: "16px", right: "16px", width: "40px", height: "40px", borderRadius: "50%", fontSize: "18px", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", transition: "all 0.2s" },
  thumbRow: { display: "flex", gap: "10px", flexWrap: "wrap" },
  thumb: { width: "72px", height: "72px", objectFit: "cover", borderRadius: "8px", cursor: "pointer", transition: "border 0.2s" },
  detailsCol: { display: "flex", flexDirection: "column", gap: "8px" },
  categoryBadge: { background: "var(--bg-card)", border: "1px solid var(--border-color)", color: "#f97316", padding: "4px 12px", borderRadius: "999px", fontSize: "12px", fontWeight: "600", textTransform: "uppercase", letterSpacing: "1px", alignSelf: "flex-start" },
  productName: { color: "var(--text-primary)", fontSize: "22px", fontWeight: "800", lineHeight: "1.3" },
  ratingRow: { display: "flex", alignItems: "center", gap: "8px" },
  stars: { color: "#f97316", fontSize: "18px" },
  ratingText: { color: "var(--text-muted)", fontSize: "14px" },
  price: { color: "#f97316", fontSize: "28px", fontWeight: "800" },
  stockText: { fontSize: "14px", fontWeight: "600" },
  description: { color: "var(--text-secondary)", fontSize: "14px", lineHeight: "1.6", marginTop: "4px" },
  divider: { borderTop: "1px solid var(--border-light)", margin: "8px 0" },
  label: { color: "var(--text-secondary)", fontSize: "13px", fontWeight: "600", textTransform: "uppercase", letterSpacing: "0.5px" },
  qtyRow: { display: "flex", alignItems: "center", gap: "16px" },
  qtyControls: { display: "flex", alignItems: "center", gap: "12px" },
  qtyBtn: { width: "36px", height: "36px", borderRadius: "8px", border: "1px solid var(--border-color)", background: "var(--bg-card)", color: "var(--text-primary)", fontSize: "20px", cursor: "pointer" },
  qtyNum: { color: "var(--text-primary)", fontSize: "18px", fontWeight: "700", minWidth: "28px", textAlign: "center" },
  addBtn: { padding: "16px", color: "var(--text-primary)", border: "none", borderRadius: "12px", fontSize: "16px", fontWeight: "700", transition: "background 0.3s" },
  wishlistBtn: { padding: "14px", background: "transparent", border: "1px solid #f97316", borderRadius: "12px", fontSize: "15px", fontWeight: "600", cursor: "pointer", transition: "all 0.2s" },
  viewCartBtn: { padding: "14px", background: "transparent", border: "1px solid #f97316", color: "#f97316", borderRadius: "12px", fontSize: "15px", fontWeight: "600", cursor: "pointer" },
  recSection: { marginTop: "48px", paddingTop: "32px", borderTop: "1px solid var(--border-light)" },
  recTitle: { color: "var(--text-primary)", fontSize: "22px", fontWeight: "800", marginBottom: "24px" },
  recGrid: { display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: "12px" },
  recCard: { background: "var(--bg-card)", border: "1px solid #2a2a2a", borderRadius: "12px", overflow: "hidden", cursor: "pointer", transition: "border 0.2s, transform 0.2s" },
  recImg: { width: "100%", height: "150px", objectFit: "cover", display: "block" },
  recInfo: { padding: "12px" },
  recName: { color: "var(--text-primary)", fontSize: "13px", fontWeight: "600", margin: "0 0 6px", lineHeight: "1.4" },
  recPrice: { color: "#f97316", fontSize: "15px", fontWeight: "700", margin: 0 },
};
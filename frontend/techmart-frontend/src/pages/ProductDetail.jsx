import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useContext } from "react";
import { CartContext } from "../context/CartContext";
import { useWishlist } from "../context/WishlistContext";
import axios from "axios";
import ReviewSection from "../components/ReviewSection";

const API = import.meta.env.VITE_API_URL || "https://techmart-backend-ecbi.onrender.com";
const FALLBACK_IMG = "https://placehold.co/500x400?text=No+Image";

export default function ProductDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { cart, addToCart } = useContext(CartContext);
  const { addToWishlist, removeFromWishlist, isInWishlist } = useWishlist();

  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [selectedImage, setSelectedImage] = useState(0);
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);
  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth <= 768);
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);
  const [added, setAdded] = useState(false);
  const [quantity, setQuantity] = useState(1);
  const [recommendations, setRecommendations] = useState([]);
  const [recLoading, setRecLoading] = useState(false);

  const inCart = cart.some((item) => item._id === id);
  const wishlisted = isInWishlist(id);

  useEffect(() => {
    fetchProduct();
  }, [id]);

  const fetchProduct = async () => {
    try {
      setLoading(true);
      const res = await axios.get(`${API}/api/products/${id}`);
      setProduct(res.data);
      setError("");
      fetchRecommendations(res.data);

      // SAVE TO RECENTLY VIEWED
      const recent = JSON.parse(localStorage.getItem("recent")) || [];
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
    for (let i = 0; i < quantity; i++) {
      addToCart(product);
    }
    setAdded(true);
    setTimeout(() => setAdded(false), 2000);
  };

  const handleWishlist = () => {
    if (wishlisted) {
      removeFromWishlist(id);
    } else {
      addToWishlist(product);
    }
  };

  if (loading) return (
    <div style={styles.centered}>
      <div style={styles.spinner} />
      <p style={{ color: "#888", marginTop: "16px" }}>Loading product...</p>
    </div>
  );

  if (error || !product) return (
    <div style={styles.centered}>
      <p style={{ fontSize: "48px" }}>😕</p>
      <h2 style={{ color: "#fff" }}>Product not found</h2>
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
          <div style={styles.mainImgWrap}>
            <img
              src={images[selectedImage]}
              alt={product.name}
              onError={(e) => { e.target.src = FALLBACK_IMG; }}
              style={styles.mainImg}
            />
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
            color: product.stock > 0 ? "#22c55e" : "#dc2626"
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
            disabled={product.stock === 0}
            style={{
              ...styles.addBtn,
              background: added
                ? "linear-gradient(135deg, #22c55e, #16a34a)"
                : product.stock === 0
                ? "#333"
                : "linear-gradient(135deg, #f97316, #dc2626)",
              cursor: product.stock === 0 ? "not-allowed" : "pointer",
            }}
          >
            {added ? "✅ Added to Cart!" : product.stock === 0 ? "Out of Stock" : "🛒 Add to Cart"}
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

      <ReviewSection product={product} onRefresh={fetchProduct} />

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
  backBtn: { background: "#1a1a1a", border: "1px solid #333", color: "#fff", padding: "8px 14px", borderRadius: "8px", cursor: "pointer", fontSize: "13px", marginBottom: "16px" },
  layout: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: "48px", alignItems: "start" },
  layoutMobile: { display: "flex", flexDirection: "column", gap: "20px" },
  imageCol: { display: "flex", flexDirection: "column", gap: "12px" },
  mainImgWrap: { position: "relative", borderRadius: "16px", overflow: "hidden", background: "#1a1a1a" },
  mainImg: { width: "100%", height: "300px", objectFit: "contain", display: "block", background: "#fff" },
  outOfStockBadge: { position: "absolute", top: "16px", left: "16px", background: "#dc2626", color: "#fff", padding: "6px 14px", borderRadius: "999px", fontSize: "13px", fontWeight: "700" },
  heartBtn: { position: "absolute", top: "16px", right: "16px", width: "40px", height: "40px", borderRadius: "50%", fontSize: "18px", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", transition: "all 0.2s" },
  thumbRow: { display: "flex", gap: "10px", flexWrap: "wrap" },
  thumb: { width: "72px", height: "72px", objectFit: "cover", borderRadius: "8px", cursor: "pointer", transition: "border 0.2s" },
  detailsCol: { display: "flex", flexDirection: "column", gap: "8px" },
  categoryBadge: { background: "#1a1a1a", border: "1px solid #333", color: "#f97316", padding: "4px 12px", borderRadius: "999px", fontSize: "12px", fontWeight: "600", textTransform: "uppercase", letterSpacing: "1px", alignSelf: "flex-start" },
  productName: { color: "#fff", fontSize: "22px", fontWeight: "800", lineHeight: "1.3" },
  ratingRow: { display: "flex", alignItems: "center", gap: "8px" },
  stars: { color: "#f97316", fontSize: "18px" },
  ratingText: { color: "#888", fontSize: "14px" },
  price: { color: "#f97316", fontSize: "28px", fontWeight: "800" },
  stockText: { fontSize: "14px", fontWeight: "600" },
  description: { color: "#aaa", fontSize: "14px", lineHeight: "1.6", marginTop: "4px" },
  divider: { borderTop: "1px solid #222", margin: "8px 0" },
  label: { color: "#aaa", fontSize: "13px", fontWeight: "600", textTransform: "uppercase", letterSpacing: "0.5px" },
  qtyRow: { display: "flex", alignItems: "center", gap: "16px" },
  qtyControls: { display: "flex", alignItems: "center", gap: "12px" },
  qtyBtn: { width: "36px", height: "36px", borderRadius: "8px", border: "1px solid #333", background: "#1a1a1a", color: "#fff", fontSize: "20px", cursor: "pointer" },
  qtyNum: { color: "#fff", fontSize: "18px", fontWeight: "700", minWidth: "28px", textAlign: "center" },
  addBtn: { padding: "16px", color: "#fff", border: "none", borderRadius: "12px", fontSize: "16px", fontWeight: "700", transition: "background 0.3s" },
  wishlistBtn: { padding: "14px", background: "transparent", border: "1px solid #f97316", borderRadius: "12px", fontSize: "15px", fontWeight: "600", cursor: "pointer", transition: "all 0.2s" },
  viewCartBtn: { padding: "14px", background: "transparent", border: "1px solid #f97316", color: "#f97316", borderRadius: "12px", fontSize: "15px", fontWeight: "600", cursor: "pointer" },
  recSection: { marginTop: "48px", paddingTop: "32px", borderTop: "1px solid #222" },
  recTitle: { color: "#fff", fontSize: "22px", fontWeight: "800", marginBottom: "24px" },
  recGrid: { display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: "12px" },
  recCard: { background: "#1a1a1a", border: "1px solid #2a2a2a", borderRadius: "12px", overflow: "hidden", cursor: "pointer", transition: "border 0.2s, transform 0.2s" },
  recImg: { width: "100%", height: "150px", objectFit: "cover", display: "block" },
  recInfo: { padding: "12px" },
  recName: { color: "#fff", fontSize: "13px", fontWeight: "600", margin: "0 0 6px", lineHeight: "1.4" },
  recPrice: { color: "#f97316", fontSize: "15px", fontWeight: "700", margin: 0 },
};
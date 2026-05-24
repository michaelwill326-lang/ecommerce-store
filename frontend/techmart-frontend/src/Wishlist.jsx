import { Link } from "react-router-dom";
import { useWishlist } from "../context/WishlistContext";
import { useContext } from "react";
import { CartContext } from "../context/CartContext";

const FALLBACK_IMG = "https://placehold.co/300x200?text=No+Image";

export default function Wishlist() {
  const { wishlist, removeFromWishlist, clearWishlist } = useWishlist();
  const { addToCart } = useContext(CartContext);

  const handleMoveToCart = (product) => {
    addToCart(product);
    removeFromWishlist(product._id);
  };

  if (wishlist.length === 0) {
    return (
      <div style={styles.emptyWrap}>
        <span style={{ fontSize: "64px" }}>🤍</span>
        <h2 style={{ color: "#fff", marginTop: "16px" }}>Your wishlist is empty</h2>
        <p style={{ color: "#888", marginBottom: "24px" }}>Save products you love for later!</p>
        <Link to="/"><button style={styles.orangeBtn}>Browse Products</button></Link>
      </div>
    );
  }

  return (
    <div style={styles.page}>

      {/* HEADER */}
      <div style={styles.header}>
        <div>
          <h1 style={styles.title}>🤍 My Wishlist</h1>
          <p style={styles.subtitle}>{wishlist.length} saved item{wishlist.length !== 1 ? "s" : ""}</p>
        </div>
        <div style={{ display: "flex", gap: "12px" }}>
          <button onClick={clearWishlist} style={styles.clearBtn}>🗑️ Clear All</button>
          <Link to="/"><button style={styles.backBtn}>← Continue Shopping</button></Link>
        </div>
      </div>

      {/* GRID */}
      <div style={styles.grid}>
        {wishlist.map((p) => (
          <div key={p._id} style={styles.card}>

            {/* IMAGE */}
            <Link to={`/product/${p._id}`}>
              <div style={styles.imgWrap}>
                <img
                  src={p.images?.[0] || FALLBACK_IMG}
                  alt={p.name}
                  onError={(e) => { e.target.src = FALLBACK_IMG; }}
                  style={styles.img}
                />
                {p.stock === 0 && (
                  <div style={styles.outOfStock}>Out of Stock</div>
                )}
              </div>
            </Link>

            {/* DETAILS */}
            <div style={styles.cardBody}>
              <p style={styles.category}>{p.category}</p>
              <Link to={`/product/${p._id}`} style={{ textDecoration: "none" }}>
                <p style={styles.name}>{p.name}</p>
              </Link>
              <p style={styles.price}>₦{p.price?.toLocaleString()}</p>

              {/* ACTIONS */}
              <div style={styles.actions}>
                <button
                  onClick={() => handleMoveToCart(p)}
                  disabled={p.stock === 0}
                  style={{
                    ...styles.cartBtn,
                    opacity: p.stock === 0 ? 0.5 : 1,
                    cursor: p.stock === 0 ? "not-allowed" : "pointer",
                  }}
                >
                  🛒 {p.stock === 0 ? "Out of Stock" : "Move to Cart"}
                </button>
                <button
                  onClick={() => removeFromWishlist(p._id)}
                  style={styles.removeBtn}
                >
                  🗑️
                </button>
              </div>
            </div>

          </div>
        ))}
      </div>

      {/* MOVE ALL TO CART */}
      {wishlist.some(p => p.stock > 0) && (
        <div style={styles.bottomBar}>
          <p style={{ color: "#888", fontSize: "14px" }}>
            {wishlist.filter(p => p.stock > 0).length} item{wishlist.filter(p => p.stock > 0).length !== 1 ? "s" : ""} available
          </p>
          <button
            onClick={() => {
              wishlist.filter(p => p.stock > 0).forEach(p => {
                addToCart(p);
                removeFromWishlist(p._id);
              });
            }}
            style={styles.orangeBtn}
          >
            🛒 Move All to Cart
          </button>
        </div>
      )}

    </div>
  );
}

const styles = {
  page: { maxWidth: "1200px", margin: "0 auto", padding: "32px 16px", minHeight: "100vh" },
  emptyWrap: { display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", minHeight: "70vh", textAlign: "center" },
  header: { display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "32px", flexWrap: "wrap", gap: "16px" },
  title: { color: "#fff", fontSize: "28px", fontWeight: "800", margin: 0 },
  subtitle: { color: "#888", fontSize: "14px", marginTop: "4px" },
  backBtn: { background: "#1a1a1a", border: "1px solid #333", color: "#fff", padding: "10px 18px", borderRadius: "8px", cursor: "pointer", fontSize: "14px" },
  clearBtn: { background: "transparent", border: "1px solid #333", color: "#888", padding: "10px 18px", borderRadius: "8px", cursor: "pointer", fontSize: "14px" },
  orangeBtn: { padding: "12px 24px", background: "linear-gradient(135deg, #f97316, #dc2626)", color: "#fff", border: "none", borderRadius: "12px", cursor: "pointer", fontWeight: "700", fontSize: "15px" },
  grid: { display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))", gap: "24px", marginBottom: "32px" },
  card: { background: "#1a1a1a", border: "1px solid #2a2a2a", borderRadius: "16px", overflow: "hidden" },
  imgWrap: { position: "relative" },
  img: { width: "100%", height: "200px", objectFit: "cover", display: "block", background: "#222" },
  outOfStock: { position: "absolute", top: "10px", left: "10px", background: "#dc2626", color: "#fff", padding: "4px 10px", borderRadius: "999px", fontSize: "11px", fontWeight: "700" },
  cardBody: { padding: "16px" },
  category: { color: "#f97316", fontSize: "11px", fontWeight: "700", textTransform: "uppercase", letterSpacing: "1px", marginBottom: "6px" },
  name: { color: "#fff", fontSize: "15px", fontWeight: "600", marginBottom: "8px" },
  price: { color: "#f97316", fontSize: "18px", fontWeight: "800", marginBottom: "16px" },
  actions: { display: "flex", gap: "8px" },
  cartBtn: { flex: 1, padding: "10px", background: "linear-gradient(135deg, #f97316, #dc2626)", color: "#fff", border: "none", borderRadius: "8px", fontSize: "13px", fontWeight: "700" },
  removeBtn: { padding: "10px 12px", background: "transparent", border: "1px solid #333", color: "#888", borderRadius: "8px", cursor: "pointer", fontSize: "16px" },
  bottomBar: { background: "#1a1a1a", border: "1px solid #2a2a2a", borderRadius: "16px", padding: "20px 24px", display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "16px" },
};
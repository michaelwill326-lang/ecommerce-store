import { useEffect, useState, useContext } from "react";
import { ProductGridSkeleton } from "../components/Skeleton";
import { Link } from "react-router-dom";
import { CartContext } from "../context/CartContext";
import axios from "axios";

const API = import.meta.env.VITE_API_URL || "https://techmart-backend-ecbi.onrender.com";
const FALLBACK_IMG = "https://placehold.co/300x200?text=No+Image";

const CATEGORIES = ["All", "Phones", "Laptops", "Accessories", "Audio", "Gaming"];

export default function Dashboard() {
  const { addToCart } = useContext(CartContext);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("All");
  const [sortBy, setSortBy] = useState("newest");
  const [addedId, setAddedId] = useState(null);

  const user = (() => { try { return JSON.parse(localStorage.getItem("user")); } catch { return null; } })();
  const recent = (() => { try { return JSON.parse(localStorage.getItem("recent")) || []; } catch { return []; } })();

  useEffect(() => {
    fetchProducts();
  }, []);

  const fetchProducts = async () => {
    try {
      setLoading(true);
      const { data } = await axios.get(`${API}/api/products`);
      setProducts(data);
      setError("");
    } catch (err) {
      console.error(err);
      setError("Failed to load products");
    } finally {
      setLoading(false);
    }
  };

  const handleAddToCart = (e, product) => {
    e.preventDefault();
    e.stopPropagation();
    addToCart(product);
    setAddedId(product._id);
    setTimeout(() => setAddedId(null), 1500);
  };

  const filtered = products
    .filter((p) => {
      const matchSearch =
        p.name?.toLowerCase().includes(search.toLowerCase()) ||
        p.description?.toLowerCase().includes(search.toLowerCase());
      const matchCategory =
        category === "All" ||
        p.category?.toLowerCase() === category.toLowerCase();
      return matchSearch && matchCategory;
    })
    .sort((a, b) => {
      if (sortBy === "newest") return new Date(b.createdAt) - new Date(a.createdAt);
      if (sortBy === "price_asc") return a.price - b.price;
      if (sortBy === "price_desc") return b.price - a.price;
      if (sortBy === "popular") return (b.reviews?.length || 0) - (a.reviews?.length || 0);
      return 0;
    });

  const trending = [...products]
    .sort((a, b) => (b.reviews?.length || 0) - (a.reviews?.length || 0))
    .slice(0, 6);

  return (
    <div style={styles.page}>

      {/* HERO */}
      <div style={styles.hero}>
        <div style={styles.heroContent}>
          <p style={styles.heroTag}>🔥 The Store of the Future</p>
          <h1 style={styles.heroTitle}>
            Next-Gen Tech,<br />
            <span style={styles.heroOrange}>Delivered to You</span>
          </h1>
          <p style={styles.heroSubtitle}>
            Shop the latest phones, laptops, accessories and more.
          </p>
          <div style={styles.heroButtons}>
            <a href="#products">
              <button style={styles.heroBtn}>Shop Now →</button>
            </a>
            {!user && (
              <Link to="/signup">
                <button style={styles.heroOutlineBtn}>Create Account</button>
              </Link>
            )}
          </div>
        </div>
      </div>

      {/* STATS BAR */}
      <div style={styles.statsBar}>
        {[
          { label: "Products", value: products.length + "+" },
          { label: "Happy Customers", value: "10K+" },
          { label: "Delivery", value: "Free" },
          { label: "Support", value: "24/7" },
        ].map((s) => (
          <div key={s.label} style={styles.statItem}>
            <p style={styles.statValue}>{s.value}</p>
            <p style={styles.statLabel}>{s.label}</p>
          </div>
        ))}
      </div>

      <div style={styles.container}>

        {/* 🔥 TRENDING */}
        {trending.length > 0 && !search && category === "All" && (
          <section style={styles.section}>
            <div style={styles.sectionHeader}>
              <h2 style={styles.sectionTitle}>🔥 Trending Now</h2>
              <span style={styles.sectionSub}>Most reviewed products</span>
            </div>
            <div style={styles.grid}>
              {trending.map((p) => (
                <ProductCard
                  key={p._id}
                  product={p}
                  addedId={addedId}
                  onAddToCart={handleAddToCart}
                />
              ))}
            </div>
          </section>
        )}

        {/* 👀 RECENTLY VIEWED */}
        {recent.length > 0 && !search && category === "All" && (
          <section style={styles.section}>
            <div style={styles.sectionHeader}>
              <h2 style={styles.sectionTitle}>👀 Recently Viewed</h2>
            </div>
            <div style={styles.grid}>
              {recent.map((p) => (
                <ProductCard
                  key={p._id}
                  product={p}
                  addedId={addedId}
                  onAddToCart={handleAddToCart}
                />
              ))}
            </div>
          </section>
        )}

        {/* 🛍 ALL PRODUCTS */}
        <section style={styles.section} id="products">
          <div style={styles.sectionHeader}>
            <h2 style={styles.sectionTitle}>🛍️ All Products</h2>
            <span style={styles.sectionSub}>{filtered.length} products</span>
          </div>

          <div style={styles.controls}>
            <input
              type="text"
              placeholder="🔍 Search products..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              style={styles.searchInput}
            />
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              style={styles.select}
            >
              <option value="newest">Newest</option>
              <option value="popular">Most Popular</option>
              <option value="price_asc">Price: Low to High</option>
              <option value="price_desc">Price: High to Low</option>
            </select>
          </div>

          <div style={styles.categoryRow}>
            {CATEGORIES.map((cat) => (
              <button
                key={cat}
                onClick={() => setCategory(cat)}
                style={{
                  ...styles.catBtn,
                  background: category === cat
                    ? "linear-gradient(135deg, #f97316, #dc2626)"
                    : "#1a1a1a",
                  color: category === cat ? "#fff" : "#888",
                  border: category === cat ? "none" : "1px solid #333",
                }}
              >
                {cat}
              </button>
            ))}
          </div>

          {loading && <ProductGridSkeleton count={8} />}

          {error && (
            <div style={styles.centered}>
              <p style={{ color: "#f97316", fontSize: "18px" }}>⚠️ {error}</p>
              <button onClick={fetchProducts} style={styles.retryBtn}>Retry</button>
            </div>
          )}

          {!loading && !error && filtered.length === 0 && (
            <div style={styles.centered}>
              <p style={{ fontSize: "48px" }}>🔍</p>
              <p style={{ color: "var(--text-muted)" }}>No products found for "{search}"</p>
              <button
                onClick={() => { setSearch(""); setCategory("All"); }}
                style={styles.retryBtn}
              >
                Clear Filters
              </button>
            </div>
          )}

          {!loading && !error && filtered.length > 0 && (
            <div style={styles.grid}>
              {filtered.map((p) => (
                <ProductCard
                  key={p._id}
                  product={p}
                  addedId={addedId}
                  onAddToCart={handleAddToCart}
                />
              ))}
            </div>
          )}

        </section>
      </div>

      {/* FOOTER */}
      <footer style={styles.footer}>
        <div style={styles.footerTop}>
          <div>
            <h3 style={styles.footerBrand}>TechMart</h3>
            <p style={styles.footerTagline}>The Store of the Future</p>
          </div>
          <div style={styles.footerLinks}>
            <Link to="/" style={styles.footerLink}>Home</Link>
            <Link to="/cart" style={styles.footerLink}>Cart</Link>
            <Link to="/tracking" style={styles.footerLink}>Orders</Link>
            <Link to="/policy" style={styles.footerLink}>Policies</Link>
            {user ? (
              <span
                onClick={() => {
                  localStorage.removeItem("token");
                  localStorage.removeItem("user");
                  window.location.href = "/login";
                }}
                style={{ ...styles.footerLink, cursor: "pointer" }}
              >
                Logout
              </span>
            ) : (
              <>
                <Link to="/login" style={styles.footerLink}>Login</Link>
                <Link to="/signup" style={styles.footerLink}>Signup</Link>
              </>
            )}
          </div>
        </div>
        <div style={styles.footerBottom}>
          <p style={styles.footerCopy}>© 2025 TechMart. All rights reserved.</p>
          <p style={styles.footerCopy}>Built with ❤️ in Nigeria 🇳🇬</p>
        </div>
      </footer>

    </div>
  );
}

/* ===========================
   PRODUCT CARD COMPONENT
=========================== */
function ProductCard({ product: p, addedId, onAddToCart }) {
  const isAdded = addedId === p._id;
  const avgRating = p.reviews?.length
    ? (p.reviews.reduce((s, r) => s + r.stars, 0) / p.reviews.length).toFixed(1)
    : null;

  return (
    <Link to={`/product/${p._id}`} style={styles.card}>
      <div style={styles.cardImgWrap}>
        <img
          src={p.images?.[0] || FALLBACK_IMG}
          alt={p.name}
          onError={(e) => { e.target.src = FALLBACK_IMG; }}
          style={styles.cardImg}
        />
        {p.stock === 0 && (
          <div style={styles.outOfStock}>Out of Stock</div>
        )}
        {p.reviews?.length > 5 && (
          <div style={styles.trendingBadge}>🔥 Trending</div>
        )}
      </div>
      <div style={styles.cardBody}>
        <p style={styles.cardCategory}>{p.category}</p>
        <p style={styles.cardName}>{p.name}</p>
        {avgRating && (
          <div style={styles.ratingRow}>
            <span style={styles.stars}>
              {"★".repeat(Math.round(avgRating))}
              {"☆".repeat(5 - Math.round(avgRating))}
            </span>
            <span style={styles.ratingText}>({p.reviews.length})</span>
          </div>
        )}
        <div style={styles.cardFooter}>
          <p style={styles.cardPrice}>₦{p.price?.toLocaleString()}</p>
          <button
            onClick={(e) => onAddToCart(e, p)}
            disabled={p.stock === 0}
            style={{
              ...styles.addBtn,
              background: isAdded
                ? "#22c55e"
                : p.stock === 0
                ? "#333"
                : "linear-gradient(135deg, #f97316, #dc2626)",
              cursor: p.stock === 0 ? "not-allowed" : "pointer",
            }}
          >
            {isAdded ? "✅" : "🛒"}
          </button>
        </div>
      </div>
    </Link>
  );
}

const styles = {
  page: { background: "var(--bg-primary)", minHeight: "100vh", color: "var(--text-primary)" },
  hero: { background: "linear-gradient(135deg, #111 0%, #1a0a00 50%, #111 100%)", borderBottom: "1px solid var(--border-light)", padding: "80px 32px", textAlign: "center" },
  heroContent: { maxWidth: "700px", margin: "0 auto" },
  heroTag: { color: "#f97316", fontSize: "14px", fontWeight: "700", letterSpacing: "2px", textTransform: "uppercase", marginBottom: "16px" },
  heroTitle: { color: "var(--text-primary)", fontSize: "52px", fontWeight: "900", lineHeight: "1.2", marginBottom: "16px" },
  heroOrange: { color: "#f97316" },
  heroSubtitle: { color: "var(--text-muted)", fontSize: "18px", marginBottom: "32px", lineHeight: "1.6" },
  heroButtons: { display: "flex", gap: "16px", justifyContent: "center", flexWrap: "wrap" },
  heroBtn: { padding: "16px 32px", background: "linear-gradient(135deg, #f97316, #dc2626)", color: "var(--text-primary)", border: "none", borderRadius: "12px", fontSize: "16px", fontWeight: "700", cursor: "pointer" },
  heroOutlineBtn: { padding: "16px 32px", background: "transparent", color: "var(--text-primary)", border: "1px solid #444", borderRadius: "12px", fontSize: "16px", fontWeight: "600", cursor: "pointer" },
  statsBar: { display: "flex", justifyContent: "center", gap: "48px", padding: "24px 32px", background: "var(--bg-secondary)", borderBottom: "1px solid var(--border-light)", flexWrap: "wrap" },
  statItem: { textAlign: "center" },
  statValue: { color: "#f97316", fontSize: "24px", fontWeight: "800", margin: 0 },
  statLabel: { color: "var(--text-muted)", fontSize: "13px", margin: 0 },
  container: { maxWidth: "1200px", margin: "0 auto", padding: "40px 16px" },
  section: { marginBottom: "60px" },
  sectionHeader: { display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "20px" },
  sectionTitle: { color: "var(--text-primary)", fontSize: "22px", fontWeight: "700" },
  sectionSub: { color: "var(--text-muted)", fontSize: "14px" },
  controls: { display: "flex", gap: "12px", marginBottom: "16px", flexWrap: "wrap" },
  searchInput: { flex: 1, minWidth: "0", padding: "12px 20px", borderRadius: "999px", border: "1px solid var(--border-color)", background: "var(--bg-card)", color: "var(--text-primary)", fontSize: "15px", outline: "none" },
  select: { padding: "12px 16px", borderRadius: "10px", border: "1px solid var(--border-color)", background: "var(--bg-card)", color: "var(--text-primary)", fontSize: "14px", outline: "none", cursor: "pointer" },
  categoryRow: { display: "flex", gap: "10px", flexWrap: "wrap", marginBottom: "24px" },
  catBtn: { padding: "8px 18px", borderRadius: "999px", fontSize: "13px", fontWeight: "600", cursor: "pointer", transition: "all 0.2s" },
  grid: { display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))", gap: "20px" },
  card: { background: "var(--bg-card)", border: "1px solid #2a2a2a", borderRadius: "16px", overflow: "hidden", textDecoration: "none", color: "var(--text-primary)", display: "block", transition: "transform 0.2s, border-color 0.2s" },
  cardImgWrap: { position: "relative" },
  cardImg: { width: "100%", height: "180px", objectFit: "cover", background: "var(--bg-input)", display: "block" },
  outOfStock: { position: "absolute", top: "10px", left: "10px", background: "#dc2626", color: "var(--text-primary)", padding: "4px 10px", borderRadius: "999px", fontSize: "11px", fontWeight: "700" },
  trendingBadge: { position: "absolute", top: "10px", right: "10px", background: "#f97316", color: "var(--text-primary)", padding: "4px 10px", borderRadius: "999px", fontSize: "11px", fontWeight: "700" },
  cardBody: { padding: "14px" },
  cardCategory: { color: "#f97316", fontSize: "11px", fontWeight: "700", textTransform: "uppercase", letterSpacing: "1px", marginBottom: "6px" },
  cardName: { fontSize: "14px", fontWeight: "600", marginBottom: "6px", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" },
  ratingRow: { display: "flex", alignItems: "center", gap: "6px", marginBottom: "8px" },
  stars: { color: "#f97316", fontSize: "12px" },
  ratingText: { color: "var(--text-muted)", fontSize: "12px" },
  cardFooter: { display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: "8px" },
  cardPrice: { color: "#f97316", fontWeight: "800", fontSize: "16px" },
  addBtn: { width: "36px", height: "36px", borderRadius: "10px", border: "none", color: "var(--text-primary)", fontSize: "16px", display: "flex", alignItems: "center", justifyContent: "center", transition: "background 0.3s" },
  centered: { display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "60px 0", gap: "16px" },
  spinner: { width: "40px", height: "40px", border: "4px solid #333", borderTop: "4px solid #f97316", borderRadius: "50%", animation: "spin 0.8s linear infinite" },
  retryBtn: { padding: "10px 24px", background: "#f97316", color: "var(--text-primary)", border: "none", borderRadius: "8px", cursor: "pointer", fontWeight: "600" },
  footer: { background: "var(--bg-secondary)", borderTop: "1px solid var(--border-light)", padding: "40px 32px 24px", marginTop: "40px" },
  footerTop: { display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: "24px", marginBottom: "32px" },
  footerBrand: { color: "#f97316", fontSize: "22px", fontWeight: "800", marginBottom: "4px" },
  footerTagline: { color: "var(--text-muted)", fontSize: "13px" },
  footerLinks: { display: "flex", gap: "24px", flexWrap: "wrap", alignItems: "center" },
  footerLink: { color: "var(--text-muted)", textDecoration: "none", fontSize: "14px", fontWeight: "500" },
  footerBottom: { borderTop: "1px solid var(--border-light)", paddingTop: "20px", display: "flex", justifyContent: "space-between", flexWrap: "wrap", gap: "8px" },
  footerCopy: { color: "#555", fontSize: "13px" },
};
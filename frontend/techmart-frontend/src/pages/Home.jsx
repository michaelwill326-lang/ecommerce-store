import { useEffect, useState } from "react";
import { Link } from "react-router-dom";

export default function Home() {
  const [products, setProducts] = useState([]);
  const [trending, setTrending] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [search, setSearch] = useState("");

  const recent = JSON.parse(localStorage.getItem("recent")) || [];

  useEffect(() => {
    fetch(`${import.meta.env.VITE_API_URL}/api/products`)
      .then(res => {
        if (!res.ok) throw new Error("Failed to fetch products");
        return res.json();
      })
      .then(data => {
        setProducts(data);
        const sorted = [...data]
          .sort((a, b) => (b.reviews?.length || 0) - (a.reviews?.length || 0))
          .slice(0, 6);
        setTrending(sorted);
        setLoading(false);
      })
      .catch(err => {
        setError(err.message);
        setLoading(false);
      });
  }, []);

  const filtered = products.filter(p =>
    p.name?.toLowerCase().includes(search.toLowerCase())
  );

  const FALLBACK_IMG = "https://placehold.co/300x200?text=No+Image";

  const ProductCard = ({ p }) => (
    <Link key={p._id} to={`/product/${p._id}`} style={styles.card}>
      <img
        src={p.images?.[0] || FALLBACK_IMG}
        alt={p.name}
        onError={(e) => { e.target.src = FALLBACK_IMG; }}
        style={styles.cardImg}
      />
      <div style={styles.cardBody}>
        <p style={styles.cardName}>{p.name}</p>
        <p style={styles.cardPrice}>₦{p.price?.toLocaleString()}</p>
      </div>
    </Link>
  );

  if (loading) return (
    <div style={styles.centered}>
      <div style={styles.spinner} />
      <p style={{ color: "#888", marginTop: "16px" }}>Loading products...</p>
    </div>
  );

  if (error) return (
    <div style={styles.centered}>
      <p style={{ color: "#f97316", fontSize: "18px" }}>⚠️ {error}</p>
      <button onClick={() => window.location.reload()} style={styles.retryBtn}>
        Retry
      </button>
    </div>
  );

  return (
    <div style={styles.container}>

      {/* 🔍 Search Bar */}
      <div style={styles.searchWrap}>
        <input
          type="text"
          placeholder="🔍 Search products..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          style={styles.searchInput}
        />
      </div>

      {/* 🔥 TRENDING */}
      {!search && trending.length > 0 && (
        <section>
          <h2 style={styles.sectionTitle}>🔥 Trending</h2>
          <div style={styles.grid}>
            {trending.map(p => <ProductCard key={p._id} p={p} />)}
          </div>
        </section>
      )}

      {/* 🛍 ALL / FILTERED PRODUCTS */}
      <section>
        <h2 style={styles.sectionTitle}>
          {search ? `🔍 Results for "${search}"` : "🛍 All Products"}
        </h2>
        {filtered.length === 0 ? (
          <p style={{ color: "#888", textAlign: "center" }}>No products found.</p>
        ) : (
          <div style={styles.grid}>
            {filtered.map(p => <ProductCard key={p._id} p={p} />)}
          </div>
        )}
      </section>

      {/* 👀 RECENTLY VIEWED */}
      {!search && recent.length > 0 && (
        <section>
          <h2 style={styles.sectionTitle}>👀 Recently Viewed</h2>
          <div style={styles.grid}>
            {recent.map(p => <ProductCard key={p._id} p={p} />)}
          </div>
        </section>
      )}

    </div>
  );
}

const styles = {
  container: {
    maxWidth: "1200px",
    margin: "0 auto",
    padding: "24px 16px",
  },
  centered: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    minHeight: "60vh",
  },
  searchWrap: {
    marginBottom: "32px",
    display: "flex",
    justifyContent: "center",
  },
  searchInput: {
    width: "100%",
    maxWidth: "500px",
    padding: "12px 20px",
    borderRadius: "999px",
    border: "1px solid #333",
    background: "#1a1a1a",
    color: "#fff",
    fontSize: "15px",
    outline: "none",
  },
  sectionTitle: {
    fontSize: "22px",
    fontWeight: "700",
    marginBottom: "16px",
    color: "#fff",
  },
  grid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))",
    gap: "20px",
    marginBottom: "40px",
  },
  card: {
    background: "#1a1a1a",
    borderRadius: "12px",
    overflow: "hidden",
    textDecoration: "none",
    color: "#fff",
    border: "1px solid #2a2a2a",
    transition: "transform 0.2s, border-color 0.2s",
    display: "block",
  },
  cardImg: {
    width: "100%",
    height: "180px",
    objectFit: "cover",
    background: "#222",
  },
  cardBody: {
    padding: "12px",
  },
  cardName: {
    fontSize: "14px",
    fontWeight: "600",
    marginBottom: "6px",
    whiteSpace: "nowrap",
    overflow: "hidden",
    textOverflow: "ellipsis",
  },
  cardPrice: {
    fontSize: "15px",
    color: "#f97316",
    fontWeight: "700",
  },
  spinner: {
    width: "40px",
    height: "40px",
    border: "4px solid #333",
    borderTop: "4px solid #f97316",
    borderRadius: "50%",
    animation: "spin 0.8s linear infinite",
  },
  retryBtn: {
    marginTop: "16px",
    padding: "10px 24px",
    background: "#f97316",
    color: "#fff",
    border: "none",
    borderRadius: "8px",
    cursor: "pointer",
    fontWeight: "600",
  },
};
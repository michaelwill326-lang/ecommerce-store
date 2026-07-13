import { Link } from "react-router-dom";

const FALLBACK = "https://placehold.co/300x200?text=No+Image";

export default function ProductCard({ p }) {
  return (
    <Link to={`/product/${p._id}`} className="tm-card">
      <div style={{ position: "relative" }}>
        <img src={p.images?.[0] || FALLBACK} alt={p.name} onError={e => e.target.src = FALLBACK} loading="lazy" decoding="async" className="tm-card-img" />
        {p.stock === 0 && <span style={{ position: "absolute", top: "8px", left: "8px", background: "#dc2626", color: "#fff", fontSize: "10px", fontWeight: "700", padding: "2px 8px", borderRadius: "999px" }}>Out of Stock</span>}
        {p.stock > 0 && p.stock <= 5 && <span style={{ position: "absolute", top: "8px", left: "8px", background: "#f59e0b", color: "#fff", fontSize: "10px", fontWeight: "700", padding: "2px 8px", borderRadius: "999px" }}>Only {p.stock} left</span>}
      </div>
      <div style={{ padding: "10px" }}>
        {p.category && <p style={{ fontSize: "10px", color: "#f97316", textTransform: "uppercase", letterSpacing: "0.5px", margin: "0 0 3px", fontWeight: "600" }}>{p.category}</p>}
        <p style={{ fontSize: "13px", fontWeight: "600", margin: "0 0 4px", color: "var(--text-primary)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{p.name}</p>
        <p style={{ fontSize: "14px", color: "#f97316", fontWeight: "700", margin: 0 }}>₦{p.price?.toLocaleString()}</p>
      </div>
    </Link>
  );
}

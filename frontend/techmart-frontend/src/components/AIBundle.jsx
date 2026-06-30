import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";

const API = import.meta.env.VITE_API_URL || "https://techmart-backend-ecbi.onrender.com";
const FALLBACK = "https://placehold.co/150x150?text=No+Image";

export default function AIBundle({ productId, onAddBundle }) {
  const [bundle, setBundle] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    if (!productId) return;
    axios.post(`${API}/api/ai/bundles`, { productId })
      .then(res => setBundle(res.data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [productId]);

  if (loading || !bundle?.bundleProducts?.length) return null;

  return (
    <div style={{ background: "linear-gradient(135deg, #1a0a00, #0a1a0a)", border: "1px solid #f97316", borderRadius: "16px", padding: "20px", marginTop: "24px" }}>
      <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "16px" }}>
        <span style={{ fontSize: "20px" }}>🤖</span>
        <h3 style={{ color: "#f97316", fontWeight: "800", fontSize: "16px", margin: 0 }}>AI Bundle Suggestion</h3>
        <span style={{ background: "#f97316", color: "#fff", fontSize: "11px", fontWeight: "700", padding: "2px 8px", borderRadius: "999px" }}>5% OFF</span>
      </div>
      <p style={{ color: "#aaa", fontSize: "13px", marginBottom: "16px" }}>Complete your setup with these complementary products</p>
      <div style={{ display: "flex", gap: "12px", flexWrap: "wrap", marginBottom: "16px" }}>
        {bundle.bundleProducts.map(p => (
          <div key={p._id} onClick={() => navigate(`/product/${p._id}`)} style={{ display: "flex", alignItems: "center", gap: "8px", background: "#111", borderRadius: "10px", padding: "8px", cursor: "pointer", flex: "1", minWidth: "140px" }}>
            <img src={p.images?.[0] || FALLBACK} style={{ width: "40px", height: "40px", objectFit: "cover", borderRadius: "6px", flexShrink: 0 }} />
            <div>
              <p style={{ color: "#fff", fontSize: "12px", fontWeight: "600", margin: "0 0 2px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", maxWidth: "100px" }}>{p.name}</p>
              <p style={{ color: "#f97316", fontSize: "12px", fontWeight: "700", margin: 0 }}>N{p.price?.toLocaleString()}</p>
            </div>
          </div>
        ))}
      </div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderTop: "1px solid #333", paddingTop: "12px" }}>
        <div>
          <p style={{ color: "#888", fontSize: "12px", margin: "0 0 2px" }}>Bundle total: <span style={{ textDecoration: "line-through" }}>N{bundle.bundleTotal?.toLocaleString()}</span></p>
          <p style={{ color: "#22c55e", fontWeight: "800", fontSize: "16px", margin: 0 }}>N{bundle.bundlePrice?.toLocaleString()} <span style={{ fontSize: "12px" }}>save N{bundle.bundleDiscount?.toLocaleString()}</span></p>
        </div>
        <button onClick={() => onAddBundle && onAddBundle(bundle.bundleProducts)} style={{ padding: "10px 20px", background: "linear-gradient(135deg, #f97316, #dc2626)", color: "#fff", border: "none", borderRadius: "10px", cursor: "pointer", fontWeight: "700", fontSize: "14px" }}>
          Add Bundle to Cart
        </button>
      </div>
    </div>
  );
}

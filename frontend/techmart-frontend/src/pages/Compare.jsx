import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";

export default function Compare() {
  const [items, setItems] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    try { setItems(JSON.parse(localStorage.getItem("compareItems") || "[]")); } catch { setItems([]); }
  }, []);

  if (items.length < 2) return (
    <div style={{ minHeight: "80vh", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: "16px", padding: "20px" }}>
      <p style={{ fontSize: "48px", margin: 0 }}>⚖️</p>
      <p style={{ color: "var(--text-primary)", fontWeight: "700", fontSize: "18px", margin: 0 }}>Add at least 2 products to compare</p>
      <button onClick={() => navigate("/")} style={{ padding: "12px 24px", background: "linear-gradient(135deg, #f97316, #dc2626)", color: "#fff", border: "none", borderRadius: "10px", cursor: "pointer", fontWeight: "700" }}>Browse Products</button>
    </div>
  );

  const attrs = [
    { label: "Price", key: p => `₦${(p.price || 0).toLocaleString()}` },
    { label: "Category", key: p => p.category || "—" },
    { label: "Condition", key: p => p.condition || "New" },
    { label: "Rating", key: p => p.rating ? `⭐ ${p.rating}` : "No ratings" },
    { label: "Reviews", key: p => `${p.reviews?.length || 0} reviews` },
    { label: "Stock", key: p => p.stock > 0 ? `${p.stock} available` : "Out of stock" },
  ];

  return (
    <div style={{ padding: "20px", maxWidth: "900px", margin: "0 auto" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
        <h1 style={{ color: "var(--text-primary)", fontSize: "22px", fontWeight: "800", margin: 0 }}>⚖️ Product Comparison</h1>
        <button onClick={() => navigate(-1)} style={{ padding: "8px 16px", background: "#1a1a1a", border: "1px solid #333", color: "#888", borderRadius: "8px", cursor: "pointer", fontSize: "13px" }}>← Back</button>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: `120px repeat(${items.length}, 1fr)`, gap: "1px", background: "#2a2a2a", borderRadius: "12px", overflow: "hidden" }}>
        {/* Header row */}
        <div style={{ background: "var(--bg-card)", padding: "12px" }} />
        {items.map((p, i) => (
          <div key={i} style={{ background: "var(--bg-card)", padding: "16px", textAlign: "center" }}>
            <img src={p.images?.[0] || "https://placehold.co/80x80"} alt={p.name} style={{ width: "80px", height: "80px", objectFit: "cover", borderRadius: "8px", marginBottom: "8px" }} onError={e => e.target.src = "https://placehold.co/80x80"} />
            <p style={{ color: "var(--text-primary)", fontWeight: "700", fontSize: "13px", margin: "0 0 8px" }}>{p.name}</p>
            <button onClick={() => navigate(`/product/${p._id}`)} style={{ padding: "6px 14px", background: "linear-gradient(135deg, #f97316, #dc2626)", color: "#fff", border: "none", borderRadius: "6px", cursor: "pointer", fontWeight: "700", fontSize: "11px" }}>View</button>
          </div>
        ))}

        {/* Attribute rows */}
        {attrs.map((attr, i) => (
          <>
            <div key={`label-${i}`} style={{ background: i % 2 === 0 ? "#111" : "var(--bg-card)", padding: "12px", display: "flex", alignItems: "center" }}>
              <p style={{ color: "var(--text-muted)", fontSize: "12px", fontWeight: "700", margin: 0 }}>{attr.label}</p>
            </div>
            {items.map((p, j) => (
              <div key={`val-${i}-${j}`} style={{ background: i % 2 === 0 ? "#111" : "var(--bg-card)", padding: "12px", textAlign: "center", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <p style={{ color: attr.label === "Price" ? "#f97316" : "var(--text-primary)", fontWeight: attr.label === "Price" ? "800" : "500", fontSize: "13px", margin: 0 }}>{attr.key(p)}</p>
              </div>
            ))}
          </>
        ))}
      </div>

      <div style={{ display: "grid", gridTemplateColumns: `120px repeat(${items.length}, 1fr)`, gap: "10px", marginTop: "16px" }}>
        <div />
        {items.map((p, i) => (
          <button key={i} onClick={() => {
            const cart = (() => { try { return JSON.parse(localStorage.getItem("cart") || "[]"); } catch { return []; } })();
            const ex = cart.find(c => c._id === p._id);
            if (ex) ex.quantity += 1; else cart.push({ ...p, quantity: 1 });
            localStorage.setItem("cart", JSON.stringify(cart));
            window.dispatchEvent(new Event("storage"));
          }} style={{ padding: "10px", background: "linear-gradient(135deg, #f97316, #dc2626)", color: "#fff", border: "none", borderRadius: "8px", cursor: "pointer", fontWeight: "700", fontSize: "13px" }}>
            🛒 Add to Cart
          </button>
        ))}
      </div>
    </div>
  );
}

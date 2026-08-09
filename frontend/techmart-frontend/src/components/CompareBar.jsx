import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";

export default function CompareBar() {
  const [items, setItems] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    const load = () => {
      try { setItems(JSON.parse(localStorage.getItem("compareItems") || "[]")); } catch { setItems([]); }
    };
    load();
    window.addEventListener("compareUpdated", load);
    return () => window.removeEventListener("compareUpdated", load);
  }, []);

  if (items.length === 0) return null;

  return (
    <div style={{ position: "fixed", bottom: "64px", left: 0, right: 0, zIndex: 9998, background: "var(--bg-card)", borderTop: "2px solid #f97316", padding: "10px 16px", display: "flex", alignItems: "center", gap: "10px", boxShadow: "0 -4px 20px rgba(0,0,0,0.3)" }}>
      <p style={{ color: "#f97316", fontWeight: "700", fontSize: "13px", margin: 0, flexShrink: 0 }}>⚖️ Compare ({items.length}/3)</p>
      <div style={{ display: "flex", gap: "8px", flex: 1, overflowX: "auto" }}>
        {items.map((item, i) => (
          <div key={i} style={{ background: "#111", border: "1px solid #333", borderRadius: "8px", padding: "6px 10px", display: "flex", alignItems: "center", gap: "6px", flexShrink: 0 }}>
            <img src={item.images?.[0] || "https://placehold.co/30x30"} alt="" style={{ width: "24px", height: "24px", borderRadius: "4px", objectFit: "cover" }} />
            <p style={{ color: "var(--text-primary)", fontSize: "11px", margin: 0, maxWidth: "80px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{item.name}</p>
            <button onClick={() => {
              const updated = items.filter((_, j) => j !== i);
              localStorage.setItem("compareItems", JSON.stringify(updated));
              window.dispatchEvent(new Event("compareUpdated"));
            }} style={{ background: "none", border: "none", color: "#888", cursor: "pointer", fontSize: "12px", padding: 0 }}>✕</button>
          </div>
        ))}
      </div>
      <div style={{ display: "flex", gap: "6px", flexShrink: 0 }}>
        {items.length >= 2 && (
          <button onClick={() => navigate("/compare")} style={{ padding: "8px 14px", background: "linear-gradient(135deg, #f97316, #dc2626)", color: "#fff", border: "none", borderRadius: "8px", cursor: "pointer", fontWeight: "700", fontSize: "12px" }}>Compare Now</button>
        )}
        <button onClick={() => { localStorage.setItem("compareItems", "[]"); window.dispatchEvent(new Event("compareUpdated")); }} style={{ padding: "8px 12px", background: "#333", border: "none", color: "#888", borderRadius: "8px", cursor: "pointer", fontSize: "12px" }}>Clear</button>
      </div>
    </div>
  );
}

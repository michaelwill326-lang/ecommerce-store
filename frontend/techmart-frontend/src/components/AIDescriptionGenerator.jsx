import { useState } from "react";
import axios from "axios";

const API = import.meta.env.VITE_API_URL || "https://techmart-backend-ecbi.onrender.com";

export default function AIDescriptionGenerator({ onGenerated }) {
  const [form, setForm] = useState({ productName: "", category: "", price: "", keyFeatures: "" });
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState("");

  const generate = async () => {
    if (!form.productName) return;
    setLoading(true);
    try {
      const res = await axios.post(`${API}/api/ai/generate-description`, form);
      setResult(res.data.description);
    } catch { setResult("Failed to generate description"); }
    finally { setLoading(false); }
  };

  const inp = { width: "100%", padding: "10px 14px", background: "var(--bg-secondary)", border: "1px solid var(--border-color)", borderRadius: "8px", color: "var(--text-primary)", fontSize: "13px", outline: "none", boxSizing: "border-box", marginBottom: "10px" };

  return (
    <div style={{ background: "#0a1a0a", border: "1px solid #22c55e", borderRadius: "12px", padding: "16px", marginBottom: "16px" }}>
      <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "12px" }}>
        <span>🤖</span>
        <p style={{ color: "#22c55e", fontWeight: "700", fontSize: "14px", margin: 0 }}>AI Description Generator</p>
      </div>
      <input placeholder="Product name *" value={form.productName} onChange={e => setForm({...form, productName: e.target.value})} style={inp} />
      <input placeholder="Category" value={form.category} onChange={e => setForm({...form, category: e.target.value})} style={inp} />
      <input placeholder="Price (N)" value={form.price} onChange={e => setForm({...form, price: e.target.value})} style={inp} />
      <textarea placeholder="Key features (e.g. 12GB RAM, 256GB storage, 5000mAh battery)" value={form.keyFeatures} onChange={e => setForm({...form, keyFeatures: e.target.value})} style={{ ...inp, height: "70px", resize: "vertical" }} />
      <button onClick={generate} disabled={loading || !form.productName} style={{ width: "100%", padding: "10px", background: "linear-gradient(135deg, #16a34a, #15803d)", color: "var(--text-primary)", border: "none", borderRadius: "8px", cursor: "pointer", fontWeight: "700", fontSize: "14px" }}>
        {loading ? "Generating..." : "Generate Description with AI"}
      </button>
      {result && (
        <div style={{ marginTop: "12px", padding: "12px", background: "var(--bg-secondary)", borderRadius: "8px", border: "1px solid var(--border-color)" }}>
          <p style={{ color: "var(--text-primary)", fontSize: "13px", lineHeight: "1.6", margin: "0 0 8px" }}>{result}</p>
          <button onClick={() => onGenerated && onGenerated(result)} style={{ padding: "6px 14px", background: "#22c55e", color: "var(--text-primary)", border: "none", borderRadius: "6px", cursor: "pointer", fontSize: "12px", fontWeight: "700" }}>Use This Description</button>
        </div>
      )}
    </div>
  );
}

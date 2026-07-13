import { useState } from "react";
import axios from "axios";
const API = import.meta.env.VITE_API_URL || "https://techmart-backend-ecbi.onrender.com";
export default function AIDescriptionGenerator({ onGenerated }) {
  const [form, setForm] = useState({ productName: "", category: "", price: "", keyFeatures: "" });
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState("");
  const [applied, setApplied] = useState(false);

  const generate = async () => {
    if (!form.productName) return;
    setLoading(true);
    setApplied(false);
    try {
      const res = await axios.post(`${API}/api/ai/generate-description`, form);
      setResult(res.data.description || "");
    } catch { setResult("Failed to generate. Please try again."); }
    finally { setLoading(false); }
  };

  const handleUse = () => {
    if (!result || !onGenerated) return;
    onGenerated(result);
    setApplied(true);
    setTimeout(() => {
      setApplied(false);
      setResult("");
    }, 2500);
  };

  const inp = { width: "100%", padding: "10px 14px", background: "var(--bg-secondary)", border: "1px solid var(--border-color)", borderRadius: "8px", color: "var(--text-primary)", fontSize: "13px", outline: "none", boxSizing: "border-box", marginBottom: "10px" };

  return (
    <div style={{ background: "var(--bg-card)", border: "1px solid #22c55e", borderRadius: "12px", padding: "16px", marginBottom: "16px" }}>
      <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "12px" }}>
        <span>🤖</span>
        <p style={{ color: "#22c55e", fontWeight: "700", fontSize: "14px", margin: 0 }}>AI Description Generator</p>
      </div>
      <input placeholder="Product name *" value={form.productName} onChange={e => setForm({...form, productName: e.target.value})} style={inp} />
      <input placeholder="Category (e.g. Phones)" value={form.category} onChange={e => setForm({...form, category: e.target.value})} style={inp} />
      <input placeholder="Price (e.g. 150000)" value={form.price} onChange={e => setForm({...form, price: e.target.value})} style={inp} />
      <textarea placeholder="Key features (e.g. 12GB RAM, 256GB storage, 5000mAh battery)" value={form.keyFeatures} onChange={e => setForm({...form, keyFeatures: e.target.value})} style={{ ...inp, height: "70px", resize: "vertical" }} />
      <button
        type="button"
        onClick={generate}
        disabled={loading || !form.productName}
        style={{ width: "100%", padding: "10px", background: loading || !form.productName ? "#555" : "linear-gradient(135deg, #16a34a, #15803d)", color: "#fff", border: "none", borderRadius: "8px", cursor: loading || !form.productName ? "not-allowed" : "pointer", fontWeight: "700", fontSize: "14px", opacity: loading || !form.productName ? 0.7 : 1 }}
      >
        {loading ? "✨ Generating..." : "✨ Generate Description with AI"}
      </button>

      {applied && (
        <div style={{ marginTop: "12px", padding: "12px 16px", background: "#0a2a0a", border: "1px solid #22c55e", borderRadius: "8px", textAlign: "center" }}>
          <p style={{ color: "#22c55e", fontWeight: "700", fontSize: "14px", margin: 0 }}>✅ AI description applied to your product!</p>
        </div>
      )}

      {result && !applied && (
        <div style={{ marginTop: "12px", padding: "14px", background: "var(--bg-secondary)", borderRadius: "10px", border: "2px solid #22c55e" }}>
          <p style={{ color: "var(--text-secondary)", fontSize: "11px", fontWeight: "600", margin: "0 0 6px", textTransform: "uppercase" }}>Generated Description</p>
          <p style={{ color: "var(--text-primary)", fontSize: "13px", lineHeight: "1.7", margin: "0 0 12px" }}>{result}</p>
          <div style={{ display: "flex", gap: "8px" }}>
            <button
              type="button"
              onClick={handleUse}
              style={{ flex: 1, padding: "10px 16px", background: "linear-gradient(135deg, #22c55e, #16a34a)", color: "#fff", border: "none", borderRadius: "8px", cursor: "pointer", fontWeight: "700", fontSize: "14px" }}
            >
              ✅ Use This Description
            </button>
            <button
              type="button"
              onClick={() => setResult("")}
              style={{ padding: "10px 14px", background: "transparent", color: "var(--text-muted)", border: "1px solid var(--border-color)", borderRadius: "8px", cursor: "pointer", fontSize: "13px" }}
            >
              ✕
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
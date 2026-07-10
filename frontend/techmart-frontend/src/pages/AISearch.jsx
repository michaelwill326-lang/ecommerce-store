import { useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";

const API = import.meta.env.VITE_API_URL || "https://techmart-backend-ecbi.onrender.com";
const FALLBACK = "https://placehold.co/300x200?text=No+Image";

export default function AISearch() {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);
  const navigate = useNavigate();

  const search = async () => {
    if (!query.trim()) return;
    setLoading(true);
    setSearched(true);
    try {
      const res = await axios.post(`${API}/api/ai/search`, { query });
      setResults(res.data.results || []);
    } catch { setResults([]); }
    finally { setLoading(false); }
  };

  const suggestions = [
    "lightweight laptops under N500,000",
    "wireless earphones with good bass",
    "phones with best camera",
    "gaming accessories",
    "affordable smartwatches",
  ];

  return (
    <div style={{ background: "var(--bg-primary)", minHeight: "100vh", padding: "20px" }}>
      <div style={{ maxWidth: "800px", margin: "0 auto" }}>
        <div style={{ textAlign: "center", marginBottom: "32px" }}>
          <h1 style={{ color: "var(--text-primary)", fontSize: "24px", fontWeight: "900", margin: "0 0 8px" }}>
            <span style={{ color: "#f97316" }}>AI</span> Product Search
          </h1>
          <p style={{ color: "var(--text-muted)", fontSize: "14px" }}>Ask in plain English — I'll find exactly what you need</p>
        </div>

        <div style={{ display: "flex", gap: "8px", marginBottom: "16px" }}>
          <input
            value={query}
            onChange={e => setQuery(e.target.value)}
            onKeyPress={e => e.key === "Enter" && search()}
            placeholder='e.g. "show me laptops under N500,000 for video editing"'
            style={{ flex: 1, padding: "14px 18px", background: "var(--bg-card)", border: "1px solid var(--border-color)", borderRadius: "12px", color: "var(--text-primary)", fontSize: "15px", outline: "none" }}
          />
          <button onClick={search} disabled={loading} style={{ padding: "14px 24px", background: "linear-gradient(135deg, #f97316, #dc2626)", color: "var(--text-primary)", border: "none", borderRadius: "12px", cursor: "pointer", fontWeight: "700", fontSize: "15px", flexShrink: 0 }}>
            {loading ? "..." : "Search"}
          </button>
        </div>

        {!searched && (
          <div style={{ marginBottom: "24px" }}>
            <p style={{ color: "var(--text-muted)", fontSize: "13px", marginBottom: "10px" }}>Try asking:</p>
            <div style={{ display: "flex", flexWrap: "wrap", gap: "8px" }}>
              {suggestions.map((s, i) => (
                <button key={i} onClick={() => { setQuery(s); }} style={{ padding: "8px 14px", background: "var(--bg-card)", border: "1px solid var(--border-color)", borderRadius: "999px", color: "var(--text-secondary)", fontSize: "13px", cursor: "pointer" }}>{s}</button>
              ))}
            </div>
          </div>
        )}

        {loading && (
          <div style={{ textAlign: "center", padding: "40px" }}>
            <div style={{ width: "40px", height: "40px", border: "4px solid #333", borderTop: "4px solid #f97316", borderRadius: "50%", animation: "spin 0.8s linear infinite", margin: "0 auto 16px" }} />
            <p style={{ color: "var(--text-muted)" }}>AI is searching...</p>
          </div>
        )}

        {searched && !loading && (
          <div>
            <p style={{ color: "var(--text-muted)", fontSize: "14px", marginBottom: "16px" }}>{results.length} result{results.length !== 1 ? "s" : ""} for "{query}"</p>
            {results.length === 0 ? (
              <div style={{ textAlign: "center", padding: "40px", background: "var(--bg-card)", borderRadius: "12px" }}>
                <p style={{ fontSize: "40px", margin: "0 0 12px" }}>🤔</p>
                <p style={{ color: "var(--text-muted)" }}>No products found. Try a different search.</p>
              </div>
            ) : (
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(160px, 1fr))", gap: "16px" }}>
                {results.map(p => (
                  <div key={p._id} onClick={() => navigate(`/product/${p._id}`)} style={{ background: "var(--bg-card)", border: "1px solid #2a2a2a", borderRadius: "12px", overflow: "hidden", cursor: "pointer" }}>
                    <img src={p.images?.[0] || FALLBACK} alt={p.name} style={{ width: "100%", height: "140px", objectFit: "cover" }} />
                    <div style={{ padding: "10px" }}>
                      <p style={{ color: "var(--text-primary)", fontSize: "13px", fontWeight: "600", margin: "0 0 4px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{p.name}</p>
                      <p style={{ color: "#f97316", fontWeight: "700", fontSize: "14px", margin: 0 }}>N{p.price?.toLocaleString()}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

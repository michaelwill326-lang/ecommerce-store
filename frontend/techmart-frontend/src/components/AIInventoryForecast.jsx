import { useState, useEffect } from "react";
import axios from "axios";

const API = import.meta.env.VITE_API_URL || "https://techmart-backend-ecbi.onrender.com";

export default function AIInventoryForecast({ headers }) {
  const [forecasts, setForecasts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all");

  useEffect(() => {
    axios.get(`${API}/api/ai/inventory-forecast`, { headers })
      .then(res => setForecasts(res.data.forecasts || []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const filtered = filter === "all" ? forecasts : forecasts.filter(f => f.status === filter);
  const statusColor = { critical: "#dc2626", low: "#f59e0b", healthy: "#22c55e", slow: "#888" };
  const statusBg = { critical: "#2a1010", low: "#1a1a0a", healthy: "#0a2a1a", slow: "#1a1a1a" };

  if (loading) return <p style={{ color: "var(--text-muted)" }}>AI is analyzing inventory...</p>;

  return (
    <div>
      <div style={{ display: "flex", gap: "8px", marginBottom: "16px", flexWrap: "wrap" }}>
        {["all", "critical", "low", "healthy", "slow"].map(f => (
          <button key={f} onClick={() => setFilter(f)} style={{ padding: "6px 14px", borderRadius: "999px", border: "none", cursor: "pointer", fontSize: "12px", fontWeight: "700", background: filter === f ? "#f97316" : "#1a1a1a", color: filter === f ? "#fff" : "#888" }}>{f.charAt(0).toUpperCase() + f.slice(1)}</button>
        ))}
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
        {filtered.map((f, i) => (
          <div key={i} style={{ background: statusBg[f.status], border: `1px solid ${statusColor[f.status]}`, borderRadius: "10px", padding: "14px", display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "8px" }}>
            <div>
              <p style={{ color: "var(--text-primary)", fontWeight: "700", fontSize: "14px", margin: "0 0 4px" }}>{f.name}</p>
              <p style={{ color: "var(--text-muted)", fontSize: "12px", margin: 0 }}>Stock: {f.currentStock} | Sold (30d): {f.sold30Days} | Daily: {f.dailyVelocity}</p>
            </div>
            <div style={{ textAlign: "right" }}>
              <span style={{ padding: "4px 10px", borderRadius: "999px", fontSize: "11px", fontWeight: "700", background: statusColor[f.status], color: "var(--text-primary)" }}>{f.status.toUpperCase()}</span>
              {f.daysUntilStockout !== null && (
                <p style={{ color: statusColor[f.status], fontSize: "12px", fontWeight: "700", margin: "4px 0 0" }}>{f.daysUntilStockout} days left</p>
              )}
              {f.reorderSuggestion > 0 && (
                <p style={{ color: "var(--text-muted)", fontSize: "11px", margin: "2px 0 0" }}>Reorder: {f.reorderSuggestion} units</p>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

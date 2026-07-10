import { useState, useEffect } from "react";
import axios from "axios";

const API = import.meta.env.VITE_API_URL || "https://techmart-backend-ecbi.onrender.com";

export default function AIReviewSummary({ productId }) {
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!productId) return;
    axios.get(`${API}/api/ai/review-summary/${productId}`)
      .then(res => setSummary(res.data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [productId]);

  if (loading) return <div style={{ background: "var(--bg-card)", borderRadius: "10px", padding: "12px", marginBottom: "16px", color: "var(--text-muted)", fontSize: "13px" }}>AI is summarizing reviews...</div>;
  if (!summary?.summary) return null;

  return (
    <div style={{ background: "linear-gradient(135deg, #0a0a1a, #1a0a1a)", border: "1px solid #3b82f6", borderRadius: "12px", padding: "16px", marginBottom: "20px" }}>
      <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "10px" }}>
        <span style={{ fontSize: "16px" }}>🤖</span>
        <p style={{ color: "#3b82f6", fontWeight: "700", fontSize: "13px", margin: 0 }}>AI Review Summary</p>
        <p style={{ color: "var(--text-muted)", fontSize: "12px", margin: 0 }}>({summary.reviewCount} reviews · {summary.avgRating} avg)</p>
      </div>
      <p style={{ color: "var(--text-primary)", fontSize: "14px", lineHeight: "1.6", margin: 0 }}>{summary.summary}</p>
    </div>
  );
}

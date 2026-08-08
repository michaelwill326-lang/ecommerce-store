import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axios from "axios";

const API = import.meta.env.VITE_API_URL || "https://techmart-backend-ecbi.onrender.com";

export default function PayLink() {
  const { linkId } = useParams();
  const navigate = useNavigate();
  const [link, setLink] = useState(null);
  const [loading, setLoading] = useState(true);
  const [paying, setPaying] = useState(false);
  const [paid, setPaid] = useState(false);
  const [error, setError] = useState("");
  const [msg, setMsg] = useState("");
  const token = localStorage.getItem("token");

  useEffect(() => {
    axios.get(`${API}/api/paylink/${linkId}`)
      .then(res => setLink(res.data))
      .catch(() => setError("Payment link not found or expired"))
      .finally(() => setLoading(false));
  }, [linkId]);

  const pay = async () => {
    if (!token) return navigate(`/login?redirect=/pay/link/${linkId}`);
    setPaying(true);
    try {
      await axios.post(`${API}/api/paylink/${linkId}/pay`, {}, { headers: { Authorization: `Bearer ${token}` } });
      setPaid(true);
      setMsg(`✅ ₦${link.amount.toLocaleString()} sent to ${link.name}!`);
    } catch (err) {
      setMsg(err.response?.data?.error || "Payment failed");
    } finally { setPaying(false); }
  };

  if (loading) return (
    <div style={{ display: "flex", justifyContent: "center", alignItems: "center", minHeight: "100vh", background: "#0a0a0a" }}>
      <p style={{ color: "#f97316" }}>Loading...</p>
    </div>
  );

  if (error) return (
    <div style={{ display: "flex", justifyContent: "center", alignItems: "center", minHeight: "100vh", background: "#0a0a0a" }}>
      <p style={{ color: "#dc2626" }}>{error}</p>
    </div>
  );

  return (
    <div style={{ minHeight: "100vh", background: "#0a0a0a", display: "flex", alignItems: "center", justifyContent: "center", padding: "20px" }}>
      <div style={{ background: "#111", border: "1px solid #2a2a2a", borderRadius: "20px", padding: "32px", maxWidth: "380px", width: "100%", textAlign: "center" }}>
        <p style={{ fontSize: "40px", margin: "0 0 12px" }}>🔗</p>
        <p style={{ color: "#888", fontSize: "13px", margin: "0 0 4px" }}>Payment request from</p>
        <p style={{ color: "#fff", fontWeight: "800", fontSize: "22px", margin: "0 0 4px" }}>{link.name}</p>
        {link.description && <p style={{ color: "#888", fontSize: "13px", margin: "0 0 16px" }}>{link.description}</p>}
        <div style={{ background: "linear-gradient(135deg, #f97316, #dc2626)", borderRadius: "14px", padding: "20px", marginBottom: "24px" }}>
          <p style={{ color: "rgba(255,255,255,0.8)", fontSize: "12px", margin: "0 0 4px" }}>Amount</p>
          <p style={{ color: "#fff", fontWeight: "900", fontSize: "36px", margin: 0 }}>₦{link.amount.toLocaleString()}</p>
        </div>

        {msg && (
          <div style={{ background: paid ? "#0a2a1a" : "#2a0a0a", border: `1px solid ${paid ? "#22c55e" : "#dc2626"}`, borderRadius: "10px", padding: "12px", marginBottom: "16px" }}>
            <p style={{ color: paid ? "#22c55e" : "#dc2626", fontWeight: "700", fontSize: "13px", margin: 0 }}>{msg}</p>
          </div>
        )}

        {!paid && (
          <button onClick={pay} disabled={paying} style={{ width: "100%", padding: "16px", background: "linear-gradient(135deg, #f97316, #dc2626)", color: "#fff", border: "none", borderRadius: "12px", cursor: "pointer", fontWeight: "800", fontSize: "16px", marginBottom: "12px" }}>
            {paying ? "Processing..." : `💸 Pay ₦${link.amount.toLocaleString()} with Wallet`}
          </button>
        )}

        <button onClick={() => navigate("/")} style={{ width: "100%", padding: "12px", background: "#1a1a1a", color: "#888", border: "1px solid #2a2a2a", borderRadius: "12px", cursor: "pointer", fontWeight: "600", fontSize: "14px" }}>
          {paid ? "Go to TechMart" : "Cancel"}
        </button>
        <p style={{ color: "#333", fontSize: "11px", margin: "16px 0 0" }}>Powered by TechMart Pay</p>
      </div>
    </div>
  );
}

import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axios from "axios";

const API = import.meta.env.VITE_API_URL || "https://techmart-backend-ecbi.onrender.com";

export default function PayProfile() {
  const { userId } = useParams();
  const navigate = useNavigate();
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    axios.get(`${API}/api/pay/profile/${userId}`)
      .then(res => setProfile(res.data))
      .catch(() => setError("User not found"))
      .finally(() => setLoading(false));
  }, [userId]);

  const handleSendMoney = () => {
    navigate(`/pay?sendTo=${profile.email}`);
  };

  if (loading) return <div style={{ display: "flex", justifyContent: "center", alignItems: "center", minHeight: "100vh", background: "#0a0a0a" }}><p style={{ color: "#f97316" }}>Loading...</p></div>;
  if (error) return <div style={{ display: "flex", justifyContent: "center", alignItems: "center", minHeight: "100vh", background: "#0a0a0a" }}><p style={{ color: "#dc2626" }}>{error}</p></div>;

  return (
    <div style={{ minHeight: "100vh", background: "#0a0a0a", display: "flex", alignItems: "center", justifyContent: "center", padding: "20px" }}>
      <div style={{ background: "#111", border: "1px solid #2a2a2a", borderRadius: "20px", padding: "32px", maxWidth: "360px", width: "100%", textAlign: "center" }}>
        <div style={{ width: "72px", height: "72px", background: "linear-gradient(135deg, #f97316, #dc2626)", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "28px", fontWeight: "900", color: "#fff", margin: "0 auto 16px" }}>
          {profile.name?.charAt(0).toUpperCase()}
        </div>
        <p style={{ color: "#ffffff", fontWeight: "800", fontSize: "22px", margin: "0 0 4px" }}>{profile.name}</p>
        {profile.bvnVerified || profile.ninVerified ? (
          <p style={{ color: "#22c55e", fontSize: "12px", fontWeight: "700", margin: "0 0 8px" }}>✅ Verified TechMart User</p>
        ) : (
          <p style={{ color: "#888", fontSize: "12px", margin: "0 0 8px" }}>TechMart User</p>
        )}
        <p style={{ color: "#888", fontSize: "13px", margin: "0 0 24px" }}>{profile.email}</p>
        <button onClick={handleSendMoney} style={{ width: "100%", padding: "14px", background: "linear-gradient(135deg, #f97316, #dc2626)", color: "#fff", border: "none", borderRadius: "12px", cursor: "pointer", fontWeight: "800", fontSize: "16px", marginBottom: "12px" }}>
          💸 Send Money
        </button>
        <button onClick={() => navigate("/pay")} style={{ width: "100%", padding: "12px", background: "#1a1a1a", color: "#888", border: "1px solid #2a2a2a", borderRadius: "12px", cursor: "pointer", fontWeight: "600", fontSize: "14px" }}>
          Back to TechMart Pay
        </button>
        <p style={{ color: "#333", fontSize: "11px", margin: "16px 0 0" }}>Powered by TechMart Pay</p>
      </div>
    </div>
  );
}

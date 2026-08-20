import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";

const API = import.meta.env.VITE_API_URL || "https://techmart-backend-ecbi.onrender.com";

export default function Referral() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);
  const navigate = useNavigate();
  const token = sessionStorage.getItem("token");

  useEffect(() => {
    if (!token) { navigate("/login"); return; }
    axios.get(`${API}/api/referral/stats`, { headers: { Authorization: `Bearer ${token}` } })
      .then(res => setStats(res.data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const copyLink = () => {
    navigator.clipboard?.writeText(stats.referralLink);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const shareWhatsApp = () => {
    const msg = `Join me on TechMart — Nigeria's best tech marketplace! Use my referral link to sign up and we both get ₦500 bonus: ${stats.referralLink}`;
    window.open(`https://wa.me/?text=${encodeURIComponent(msg)}`, "_blank");
  };

  if (loading) return <div style={{ display: "flex", justifyContent: "center", alignItems: "center", minHeight: "80vh" }}><p style={{ color: "#f97316" }}>Loading...</p></div>;

  return (
    <div style={{ background: "var(--bg-primary)", minHeight: "100vh", padding: "20px 20px 80px" }}>
      <div style={{ maxWidth: "600px", margin: "0 auto" }}>
        {/* Header */}
        <div style={{ background: "linear-gradient(135deg, #1a0a00, #2a1000)", border: "1px solid #f97316", borderRadius: "20px", padding: "28px", textAlign: "center", marginBottom: "20px" }}>
          <p style={{ fontSize: "40px", margin: "0 0 12px" }}>🎁</p>
          <h1 style={{ color: "#fff", fontWeight: "900", fontSize: "24px", margin: "0 0 8px" }}>Invite Friends, Earn ₦500</h1>
          <p style={{ color: "rgba(255,255,255,0.65)", fontSize: "14px", margin: 0 }}>You earn ₦500 for every friend who signs up with your referral link. They also get ₦500 bonus!</p>
        </div>

        {/* Stats */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "12px", marginBottom: "20px" }}>
          {[
            { label: "Friends Invited", value: stats?.referralCount || 0, color: "#f97316" },
            { label: "Total Earned", value: `₦${(stats?.totalEarned || 0).toLocaleString()}`, color: "#22c55e" },
            { label: "Wallet Credits", value: `₦${(stats?.referralCredits || 0).toLocaleString()}`, color: "#3b82f6" },
          ].map((s, i) => (
            <div key={i} style={{ background: "var(--bg-card)", border: "1px solid #2a2a2a", borderRadius: "12px", padding: "16px", textAlign: "center" }}>
              <p style={{ color: s.color, fontWeight: "900", fontSize: "20px", margin: "0 0 4px" }}>{s.value}</p>
              <p style={{ color: "var(--text-muted)", fontSize: "11px", margin: 0 }}>{s.label}</p>
            </div>
          ))}
        </div>

        {/* Referral Link */}
        <div style={{ background: "var(--bg-card)", border: "1px solid #2a2a2a", borderRadius: "14px", padding: "20px", marginBottom: "16px" }}>
          <p style={{ color: "var(--text-primary)", fontWeight: "700", fontSize: "14px", margin: "0 0 12px" }}>Your Referral Link</p>
          <div style={{ background: "#111", border: "1px solid #333", borderRadius: "10px", padding: "12px 14px", marginBottom: "12px", display: "flex", alignItems: "center", justifyContent: "space-between", gap: "8px" }}>
            <p style={{ color: "#f97316", fontSize: "12px", margin: 0, wordBreak: "break-all", flex: 1 }}>{stats?.referralLink}</p>
            <button onClick={copyLink} style={{ padding: "6px 14px", background: copied ? "#22c55e" : "#333", border: "none", color: "#fff", borderRadius: "6px", cursor: "pointer", fontWeight: "700", fontSize: "12px", flexShrink: 0 }}>
              {copied ? "✅ Copied!" : "Copy"}
            </button>
          </div>
          <div style={{ background: "#111", border: "1px solid #333", borderRadius: "10px", padding: "12px 14px", marginBottom: "12px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <div>
              <p style={{ color: "var(--text-muted)", fontSize: "11px", margin: "0 0 2px" }}>Your Referral Code</p>
              <p style={{ color: "#fff", fontWeight: "900", fontSize: "18px", letterSpacing: "3px", margin: 0 }}>{stats?.referralCode}</p>
            </div>
            <button onClick={() => { navigator.clipboard?.writeText(stats.referralCode); setCopied(true); setTimeout(() => setCopied(false), 2000); }} style={{ padding: "6px 14px", background: "#333", border: "none", color: "#fff", borderRadius: "6px", cursor: "pointer", fontWeight: "700", fontSize: "12px" }}>Copy Code</button>
          </div>
          <div style={{ display: "flex", gap: "10px" }}>
            <button onClick={shareWhatsApp} style={{ flex: 1, padding: "12px", background: "#25d366", color: "#fff", border: "none", borderRadius: "10px", cursor: "pointer", fontWeight: "700", fontSize: "14px" }}>💬 Share on WhatsApp</button>
            <button onClick={() => { const msg = `Join TechMart: ${stats.referralLink}`; window.open(`https://twitter.com/intent/tweet?text=${encodeURIComponent(msg)}`, "_blank"); }} style={{ flex: 1, padding: "12px", background: "#1da1f2", color: "#fff", border: "none", borderRadius: "10px", cursor: "pointer", fontWeight: "700", fontSize: "14px" }}>🐦 Share on Twitter</button>
          </div>
        </div>

        {/* How it works */}
        <div style={{ background: "var(--bg-card)", border: "1px solid #2a2a2a", borderRadius: "14px", padding: "20px", marginBottom: "16px" }}>
          <p style={{ color: "var(--text-primary)", fontWeight: "700", fontSize: "14px", margin: "0 0 14px" }}>How It Works</p>
          {[
            { step: "1", text: "Share your referral link or code with friends" },
            { step: "2", text: "Friend signs up using your link" },
            { step: "3", text: "You both instantly get ₦500 in your wallets" },
            { step: "4", text: "No limit — invite as many friends as you want!" },
          ].map((s, i) => (
            <div key={i} style={{ display: "flex", gap: "12px", alignItems: "flex-start", marginBottom: "10px" }}>
              <div style={{ width: "28px", height: "28px", borderRadius: "50%", background: "linear-gradient(135deg, #f97316, #dc2626)", display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", fontWeight: "800", fontSize: "12px", flexShrink: 0 }}>{s.step}</div>
              <p style={{ color: "var(--text-muted)", fontSize: "13px", margin: "4px 0 0" }}>{s.text}</p>
            </div>
          ))}
        </div>

        {/* Referred Users */}
        {stats?.referredUsers?.length > 0 && (
          <div style={{ background: "var(--bg-card)", border: "1px solid #2a2a2a", borderRadius: "14px", padding: "20px" }}>
            <p style={{ color: "var(--text-primary)", fontWeight: "700", fontSize: "14px", margin: "0 0 12px" }}>Friends You've Invited ({stats.referredUsers.length})</p>
            {stats.referredUsers.map((u, i) => (
              <div key={i} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "8px 0", borderBottom: "1px solid #1a1a1a" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                  <div style={{ width: "32px", height: "32px", borderRadius: "50%", background: "linear-gradient(135deg, #f97316, #dc2626)", display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", fontWeight: "800", fontSize: "13px" }}>{u.name?.charAt(0).toUpperCase()}</div>
                  <p style={{ color: "var(--text-primary)", fontSize: "13px", margin: 0 }}>{u.name}</p>
                </div>
                <div style={{ textAlign: "right" }}>
                  <p style={{ color: "#22c55e", fontWeight: "700", fontSize: "12px", margin: 0 }}>+₦500 earned</p>
                  <p style={{ color: "var(--text-muted)", fontSize: "11px", margin: 0 }}>{new Date(u.joinedAt).toLocaleDateString("en-NG")}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

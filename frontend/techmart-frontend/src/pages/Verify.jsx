import { useState } from "react";
import { useNavigate } from "react-router-dom";
const API = import.meta.env.VITE_API_URL || "https://techmart-backend-ecbi.onrender.com";

export default function Verify() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const verify = async () => {
    setError("");
    if (!email || !otp) return setError("Please enter your email and OTP");
    setLoading(true);
    try {
      const res = await fetch(`${API}/api/auth/verify-otp`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, otp })
      });
      const data = await res.json();
      if (data.token) {
        localStorage.setItem("token", data.token);
        localStorage.setItem("user", JSON.stringify(data.user));
        if (data.deviceToken) localStorage.setItem("deviceToken", data.deviceToken);
        window.dispatchEvent(new StorageEvent("storage", { key: "token", newValue: data.token }));
        navigate("/");
      } else {
        setError(data.error || "Verification failed");
      }
    } catch {
      setError("Connection error. Please try again.");
    } finally { setLoading(false); }
  };

  return (
    <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", padding: "24px", background: "var(--bg-primary)" }}>
      <div style={{ background: "var(--bg-card)", border: "1px solid var(--border-color)", borderRadius: "16px", padding: "40px 32px", width: "100%", maxWidth: "400px", textAlign: "center" }}>
        <p style={{ fontSize: "40px", margin: "0 0 16px" }}>📧</p>
        <h1 style={{ color: "var(--text-primary)", fontSize: "22px", fontWeight: "800", margin: "0 0 8px" }}>Verify your email</h1>
        <p style={{ color: "var(--text-muted)", fontSize: "14px", margin: "0 0 24px" }}>Enter the OTP sent to your email</p>
        {error && <div style={{ background: "rgba(220,38,38,0.1)", border: "1px solid #dc2626", color: "#f87171", padding: "10px 14px", borderRadius: "8px", fontSize: "13px", marginBottom: "16px" }}>{error}</div>}
        <input
          type="email"
          placeholder="Email address"
          value={email}
          onChange={e => setEmail(e.target.value)}
          style={{ width: "100%", padding: "12px 16px", background: "var(--bg-secondary)", border: "1px solid var(--border-color)", borderRadius: "10px", color: "var(--text-primary)", fontSize: "14px", outline: "none", boxSizing: "border-box", marginBottom: "12px" }}
        />
        <input
          type="text"
          placeholder="6-digit OTP"
          value={otp}
          onChange={e => setOtp(e.target.value.replace(/[^0-9]/g, "").slice(0, 6))}
          maxLength={6}
          style={{ width: "100%", padding: "12px 16px", background: "var(--bg-secondary)", border: "1px solid var(--border-color)", borderRadius: "10px", color: "var(--text-primary)", fontSize: "20px", outline: "none", boxSizing: "border-box", marginBottom: "20px", textAlign: "center", letterSpacing: "8px" }}
        />
        <button
          onClick={verify}
          disabled={loading}
          style={{ width: "100%", padding: "14px", background: "linear-gradient(135deg, #f97316, #dc2626)", color: "#fff", border: "none", borderRadius: "10px", fontSize: "15px", fontWeight: "700", cursor: loading ? "not-allowed" : "pointer", opacity: loading ? 0.7 : 1 }}
        >
          {loading ? "Verifying..." : "Verify OTP"}
        </button>
        <button onClick={() => navigate("/login")} style={{ marginTop: "12px", background: "none", border: "none", color: "var(--text-muted)", cursor: "pointer", fontSize: "13px" }}>
          ← Back to Login
        </button>
      </div>
    </div>
  );
}

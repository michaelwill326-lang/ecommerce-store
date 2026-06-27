import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import axios from "axios";
const API = "https://techmart-backend-ecbi.onrender.com";

export default function SellerLogin() {
  const navigate = useNavigate();
  const [form, setForm] = useState({ email: "", password: "" });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleLogin = async () => {
    setError("");
    if (!form.email || !form.password) { setError("Please fill all fields"); return; }
    try {
      setLoading(true);
      const res = await axios.post(`${API}/api/seller/login`, form);
      localStorage.setItem("sellerToken", res.data.token);
      localStorage.setItem("seller", JSON.stringify(res.data.seller));
      navigate("/seller/dashboard");
    } catch (err) {
      setError(err.response?.data?.error || "Login failed");
    } finally { setLoading(false); }
  };

  const inp = { width: "100%", padding: "12px 16px", background: "#111", border: "1px solid #333", borderRadius: "10px", color: "#fff", fontSize: "15px", outline: "none", boxSizing: "border-box", marginBottom: "12px" };

  return (
    <div style={{ minHeight: "100vh", background: "#0a0a0a", display: "flex", alignItems: "center", justifyContent: "center", padding: "24px" }}>
      <div style={{ width: "100%", maxWidth: "420px" }}>
        <div style={{ textAlign: "center", marginBottom: "32px" }}>
          <h1 style={{ color: "#f97316", fontSize: "28px", fontWeight: "900", margin: 0 }}>TechMart</h1>
          <p style={{ color: "#888", fontSize: "14px", marginTop: "4px" }}>Seller Portal</p>
        </div>
        <div style={{ background: "#1a1a1a", border: "1px solid #2a2a2a", borderRadius: "16px", padding: "32px" }}>
          <h2 style={{ color: "#fff", fontSize: "22px", fontWeight: "800", marginBottom: "24px" }}>Seller Login</h2>
          {error && <div style={{ background: "#2a1010", border: "1px solid #dc2626", color: "#f87171", padding: "12px 16px", borderRadius: "10px", fontSize: "14px", marginBottom: "16px" }}>{error}</div>}
          <input placeholder="Email Address" type="email" value={form.email} onChange={e => setForm({...form, email: e.target.value})} style={inp} />
          <input placeholder="Password" type="password" value={form.password} onChange={e => setForm({...form, password: e.target.value})} onKeyPress={e => e.key === "Enter" && handleLogin()} style={inp} />
          <button onClick={handleLogin} disabled={loading} style={{ width: "100%", padding: "14px", background: "linear-gradient(135deg, #f97316, #dc2626)", color: "#fff", border: "none", borderRadius: "12px", fontSize: "16px", fontWeight: "700", cursor: "pointer", opacity: loading ? 0.7 : 1 }}>
            {loading ? "Logging in..." : "Login"}
          </button>
          <p style={{ color: "#888", fontSize: "13px", textAlign: "center", marginTop: "16px" }}>
            Not a seller yet? <Link to="/seller/apply" style={{ color: "#f97316" }}>Apply here</Link>
          </p>
        </div>
      </div>
    </div>
  );
}

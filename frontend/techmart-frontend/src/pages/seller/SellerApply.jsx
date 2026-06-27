import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import axios from "axios";
const API = "https://techmart-backend-ecbi.onrender.com";

export default function SellerApply() {
  const navigate = useNavigate();
  const [form, setForm] = useState({ name: "", email: "", password: "", phone: "", storeName: "", storeDescription: "" });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const handleSubmit = async () => {
    setError(""); setSuccess("");
    if (!form.name || !form.email || !form.password || !form.storeName) {
      setError("Please fill all required fields"); return;
    }
    try {
      setLoading(true);
      await axios.post(`${API}/api/seller/apply`, form);
      setSuccess("Application submitted! We will review and get back to you within 24 hours.");
      setForm({ name: "", email: "", password: "", phone: "", storeName: "", storeDescription: "" });
    } catch (err) {
      setError(err.response?.data?.error || "Failed to submit application");
    } finally { setLoading(false); }
  };

  const inp = { width: "100%", padding: "12px 16px", background: "#111", border: "1px solid #333", borderRadius: "10px", color: "#fff", fontSize: "15px", outline: "none", boxSizing: "border-box", marginBottom: "12px" };

  return (
    <div style={{ minHeight: "100vh", background: "#0a0a0a", display: "flex", alignItems: "center", justifyContent: "center", padding: "24px" }}>
      <div style={{ width: "100%", maxWidth: "500px" }}>
        <div style={{ textAlign: "center", marginBottom: "32px" }}>
          <h1 style={{ color: "#f97316", fontSize: "28px", fontWeight: "900", margin: 0 }}>TechMart</h1>
          <p style={{ color: "#888", fontSize: "14px", marginTop: "4px" }}>Seller Portal</p>
        </div>
        <div style={{ background: "#1a1a1a", border: "1px solid #2a2a2a", borderRadius: "16px", padding: "32px" }}>
          <h2 style={{ color: "#fff", fontSize: "22px", fontWeight: "800", marginBottom: "8px" }}>Apply to Sell</h2>
          <p style={{ color: "#888", fontSize: "14px", marginBottom: "24px" }}>Fill the form below. We review all applications within 24 hours.</p>
          {error && <div style={{ background: "#2a1010", border: "1px solid #dc2626", color: "#f87171", padding: "12px 16px", borderRadius: "10px", fontSize: "14px", marginBottom: "16px" }}>{error}</div>}
          {success && <div style={{ background: "#0a2a1a", border: "1px solid #22c55e", color: "#86efac", padding: "12px 16px", borderRadius: "10px", fontSize: "14px", marginBottom: "16px" }}>{success}</div>}
          <input placeholder="Full Name *" value={form.name} onChange={e => setForm({...form, name: e.target.value})} style={inp} />
          <input placeholder="Email Address *" type="email" value={form.email} onChange={e => setForm({...form, email: e.target.value})} style={inp} />
          <input placeholder="Password *" type="password" value={form.password} onChange={e => setForm({...form, password: e.target.value})} style={inp} />
          <input placeholder="Phone Number" value={form.phone} onChange={e => setForm({...form, phone: e.target.value})} style={inp} />
          <input placeholder="Store Name *" value={form.storeName} onChange={e => setForm({...form, storeName: e.target.value})} style={inp} />
          <textarea placeholder="Tell us about your store and what you sell..." value={form.storeDescription} onChange={e => setForm({...form, storeDescription: e.target.value})} style={{ ...inp, height: "100px", resize: "vertical" }} />
          <button onClick={handleSubmit} disabled={loading} style={{ width: "100%", padding: "14px", background: "linear-gradient(135deg, #f97316, #dc2626)", color: "#fff", border: "none", borderRadius: "12px", fontSize: "16px", fontWeight: "700", cursor: "pointer", opacity: loading ? 0.7 : 1 }}>
            {loading ? "Submitting..." : "Submit Application"}
          </button>
          <p style={{ color: "#888", fontSize: "13px", textAlign: "center", marginTop: "16px" }}>
            Already approved? <Link to="/seller/login" style={{ color: "#f97316" }}>Login here</Link>
          </p>
        </div>
      </div>
    </div>
  );
}

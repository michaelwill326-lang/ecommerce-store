import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import axios from "axios";
const API = import.meta.env.VITE_API_URL || "https://techmart-backend-ecbi.onrender.com";

export default function SellerLogin() {
  const navigate = useNavigate();
  const [form, setForm] = useState({ email: "", password: "" });
  const [showPassword, setShowPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [view, setView] = useState("login");
  const [resetToken, setResetToken] = useState("");
  const [newPassword, setNewPassword] = useState("");

  const handleLogin = async () => {
    setError("");
    if (!form.email || !form.password) { setError("Please fill all fields"); return; }
    try {
      setLoading(true);
      const res = await axios.post(`${API}/api/seller/login`, form);
      sessionStorage.setItem("sellerToken", res.data.token);
      localStorage.setItem("seller", JSON.stringify(res.data.seller));
      navigate("/seller/dashboard");
    } catch (err) {
      setError(err.response?.data?.error || "Login failed");
    } finally { setLoading(false); }
  };


  const handleForgotPassword = async () => {
    setError("");
    setSuccess("");

    if (!form.email.trim()) {
      setError("Please enter your email address.");
      return;
    }

    try {
      setLoading(true);
      const res = await axios.post(`${API}/api/seller/forgot-password`, {
        email: form.email.trim()
      });

      setSuccess(res.data.message || "Verification code sent.");
      setView("reset");
    } catch (err) {
      setError(err.response?.data?.error || "Failed to send verification code.");
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async () => {
    setError("");
    setSuccess("");

    if (!resetToken.trim() || !newPassword.trim()) {
      setError("Please complete all fields.");
      return;
    }

    try {
      setLoading(true);
      const res = await axios.post(`${API}/api/seller/reset-password`, {
        email: form.email.trim(),
        token: resetToken.trim(),
        newPassword: newPassword.trim()
      });

      setSuccess(res.data.message || "Password reset successful.");
      setView("login");
      setResetToken("");
      setNewPassword("");
    } catch (err) {
      setError(err.response?.data?.error || "Password reset failed.");
    } finally {
      setLoading(false);
    }
  };

  const inp = { width: "100%", padding: "12px 16px", background: "var(--bg-secondary)", border: "1px solid var(--border-color)", borderRadius: "10px", color: "var(--text-primary)", fontSize: "15px", outline: "none", boxSizing: "border-box", marginBottom: "12px" };

  return (
    <div style={{ minHeight: "100vh", background: "var(--bg-primary)", display: "flex", alignItems: "center", justifyContent: "center", padding: "24px" }}>
      <div style={{ width: "100%", maxWidth: "420px" }}>
        <div style={{ textAlign: "center", marginBottom: "32px" }}>
          <h1 style={{ color: "#f97316", fontSize: "28px", fontWeight: "900", margin: 0 }}>TechMart</h1>
          <p style={{ color: "var(--text-muted)", fontSize: "14px", marginTop: "4px" }}>Seller Portal</p>
        </div>
        <div style={{ background: "var(--bg-card)", border: "1px solid #2a2a2a", borderRadius: "16px", padding: "32px" }}>
          <h2 style={{ color: "var(--text-primary)", fontSize: "22px", fontWeight: "800", marginBottom: "24px" }}>Seller Login</h2>
          {error && <div style={{ background: "#2a1010", border: "1px solid #dc2626", color: "#f87171", padding: "12px 16px", borderRadius: "10px", fontSize: "14px", marginBottom: "16px" }}>{error}</div>}
          {success && <div style={{ background: "#052e16", border: "1px solid #16a34a", color: "#86efac", padding: "12px 16px", borderRadius: "10px", fontSize: "14px", marginBottom: "16px" }}>{success}</div>}
          {view === "forgot" ? (
            <>
              <input
                placeholder="Seller Email"
                type="email"
                value={form.email}
                onChange={e => setForm({...form, email: e.target.value})}
                style={inp}
              />

              <button
                onClick={handleForgotPassword}
                disabled={loading}
                style={{ width:"100%", padding:"14px", background:"linear-gradient(135deg,#f97316,#dc2626)", color:"white", border:"none", borderRadius:"12px", fontWeight:"700", cursor:"pointer" }}
              >
                {loading ? "Sending..." : "Send Reset Code"}
              </button>

              <p style={{textAlign:"center", marginTop:"18px"}}>
                <span onClick={() => setView("reset")} style={{color:"#f97316", cursor:"pointer"}}>
                  I have a reset code
                </span>
              </p>

              <p style={{textAlign:"center"}}>
                <span onClick={() => setView("login")} style={{color:"#999", cursor:"pointer"}}>
                  Back to Login
                </span>
              </p>
            </>
          ) : view === "reset" ? (
            <>
              <input
                placeholder="Reset Code"
                value={resetToken}
                onChange={e => setResetToken(e.target.value)}
                style={inp}
              />

              <div style={{ position: "relative", marginBottom: "12px" }}>
                <input
                  placeholder="New Password"
                  type={showNewPassword ? "text" : "password"}
                  value={newPassword}
                  onChange={e => setNewPassword(e.target.value)}
                  style={{ ...inp, marginBottom: 0, paddingRight: "52px" }}
                />
                <button
                  type="button"
                  aria-label={showNewPassword ? "Hide new password" : "Show new password"}
                  title={showNewPassword ? "Hide new password" : "Show new password"}
                  onClick={() => setShowNewPassword(prev => !prev)}
                  style={{
                    position: "absolute",
                    right: "6px",
                    top: "50%",
                    transform: "translateY(-50%)",
                    width: "40px",
                    height: "40px",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    padding: 0,
                    background: "transparent",
                    border: "none",
                    borderRadius: "8px",
                    cursor: "pointer",
                    color: "var(--text-primary)",
                    zIndex: 20,
                  }}
                >
                  {showNewPassword ? "◉" : "◌"}
                </button>
              </div>

              <button
                onClick={handleResetPassword}
                disabled={loading}
                style={{ width:"100%", padding:"14px", background:"linear-gradient(135deg,#f97316,#dc2626)", color:"white", border:"none", borderRadius:"12px", fontWeight:"700", cursor:"pointer" }}
              >
                {loading ? "Resetting..." : "Reset Password"}
              </button>

              <p style={{textAlign:"center", marginTop:"18px"}}>
                <span onClick={() => setView("login")} style={{color:"#999", cursor:"pointer"}}>
                  Back to Login
                </span>
              </p>
            </>
          ) : (
            <>
              <input placeholder="Email Address" type="email" value={form.email} onChange={e => setForm({...form, email:e.target.value})} style={inp} />

              <div style={{ position:"relative", marginBottom:"12px" }}>
                <input
                  placeholder="Password"
                  type={showPassword ? "text" : "password"}
                  value={form.password}
                  onChange={e => setForm({...form, password:e.target.value})}
                  onKeyDown={e => e.key === "Enter" && handleLogin()}
                  style={{...inp, marginBottom:0, paddingRight:"44px"}}
                />

                <button
                  type="button"
                  aria-label={showPassword ? "Hide password" : "Show password"}
                  title={showPassword ? "Hide password" : "Show password"}
                  onClick={() => setShowPassword(p => !p)}
                  style={{
                    position: "absolute",
                    right: "6px",
                    top: "50%",
                    transform: "translateY(-50%)",
                    width: "40px",
                    height: "40px",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    padding: 0,
                    background: "transparent",
                    border: "none",
                    borderRadius: "8px",
                    cursor: "pointer",
                    color: "var(--text-primary)",
                    zIndex: 20,
                  }}
                >
                  {showPassword ? "◉" : "◌"}
                </button>
              </div>

              <button onClick={handleLogin} disabled={loading} style={{width:"100%", padding:"14px", background:"linear-gradient(135deg,#f97316,#dc2626)", color:"white", border:"none", borderRadius:"12px", fontWeight:"700", cursor:"pointer"}}>
                {loading ? "Logging in..." : "Login"}
              </button>

              <p style={{textAlign:"right", marginTop:"10px"}}>
                <span onClick={() => setView("forgot")} style={{color:"#f97316", cursor:"pointer"}}>
                  Forgot Password?
                </span>
              </p>

              <p style={{color:"var(--text-muted)", fontSize:"13px", textAlign:"center"}}>
                Not a seller yet? <Link to="/seller/apply" style={{color:"#f97316"}}>Apply here</Link>
              </p>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

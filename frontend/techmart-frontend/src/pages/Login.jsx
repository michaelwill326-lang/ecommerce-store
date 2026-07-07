import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import axios from "axios";

const API = import.meta.env.VITE_API_URL || "https://techmart-backend-ecbi.onrender.com";

export default function Login() {
  const navigate = useNavigate();
  
  // Auth view switcher state: "login" | "forgot" | "reset"
  const [view, setView] = useState("login");
  const [otpStep, setOtpStep] = useState(false);
  const [otp, setOtp] = useState("");
  
  // Shared Form inputs
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [token, setToken] = useState("");
  const [newPassword, setNewPassword] = useState("");
  
  // Status states
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  // 1. Core Login Handler
  const handleLogin = async (e) => {
    e.preventDefault();
    setError("");
    try {
      setLoading(true);
      // First verify credentials
      const response = await axios.post(`${API}/api/auth/login`, { email, password });
      // Send OTP
      await axios.post(`${API}/api/auth/send-otp`, { email });
      // Store temp user data and show OTP step
      localStorage.setItem("_tempUser", JSON.stringify(response.data));
      setOtpStep(true);
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.error || "Invalid email or password");
    } finally {
      setLoading(false);
    }
  };

  // 1b. Verify OTP and complete login
  const handleVerifyOtp = async (e) => {
    e.preventDefault();
    setError("");
    try {
      setLoading(true);
      const res = await axios.post(`${API}/api/auth/verify-otp`, { email, otp });
      localStorage.removeItem("_tempUser");
      localStorage.setItem("token", res.data.token);
      localStorage.setItem("user", JSON.stringify(res.data.user));
      navigate("/");
    } catch (err) {
      setError(err.response?.data?.error || "Invalid or expired OTP");
    } finally {
      setLoading(false);
    }
  };

  // 2. Request Recovery Token Handler
  const handleForgotPassword = async (e) => {
    e.preventDefault();
    setError("");
    setSuccessMessage("");
    try {
      setLoading(true);
      const response = await axios.post(`${API}/api/auth/forgot-password`, { email });
      setSuccessMessage("A 6-digit recovery code has been generated if the account exists.");
      setView("reset"); // Push them over to the verification window
    } catch (err) {
      setError(err.response?.data?.error || "Failed to issue password recovery request");
    } finally {
      setLoading(false);
    }
  };

  // 3. Reset Password Using Token Handler
  const handleResetPassword = async (e) => {
    e.preventDefault();
    setError("");
    setSuccessMessage("");
    try {
      setLoading(true);
      const response = await axios.post(`${API}/api/auth/reset-password`, { 
        token: token.trim(), 
        newPassword: newPassword.trim() 
      });
      setSuccessMessage("Password reset successful! You can now log in.");
      setView("login");
      setPassword("");
    } catch (err) {
      setError(err.response?.data?.error || "Invalid or expired verification token.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={styles.page}>
      <div style={styles.card}>

        {/* LOGO */}
        <div style={styles.logoWrap}>
          <img
            src="/techmart.png"
            alt="TechMart"
            onError={(e) => { e.target.style.display = "none"; }}
            style={{ height: "48px", objectFit: "contain" }}
          />
          <h1 style={styles.brand}>TechMart</h1>
        </div>

        {/* CONDITIONALLY RENDER INTERFACES BASED ON ACTIVE STATE */}
        {otpStep && (
          <>
            <h2 style={styles.title}>Check your email 📧</h2>
            <p style={styles.subtitle}>We sent a 6-digit code to {email}</p>
            {error && <div style={styles.errorBox}>⚠️ {error}</div>}
            <form onSubmit={handleVerifyOtp}>
              <div style={styles.fieldWrap}>
                <label style={styles.label}>Enter OTP</label>
                <input
                  type="text"
                  maxLength={6}
                  placeholder="123456"
                  value={otp}
                  onChange={(e) => setOtp(e.target.value.replace(/[^0-9]/g, ""))}
                  style={{ ...styles.input, textAlign: "center", fontSize: "24px", letterSpacing: "8px" }}
                  autoFocus
                />
              </div>
              <button type="submit" disabled={loading} style={{ ...styles.submitBtn, opacity: loading ? 0.7 : 1 }}>
                {loading ? "Verifying..." : "Verify OTP"}
              </button>
            </form>
            <p style={{ color: "#888", fontSize: "13px", textAlign: "center", marginTop: "12px" }}>
              Didn't receive it?{" "}
              <span onClick={async () => { await axios.post(`${API}/api/auth/send-otp`, { email }); setError(""); }} style={{ color: "#f97316", cursor: "pointer" }}>Resend OTP</span>
            </p>
            <p style={{ color: "#888", fontSize: "13px", textAlign: "center", marginTop: "8px" }}>
              <span onClick={() => { setOtpStep(false); setOtp(""); setError(""); }} style={{ color: "#888", cursor: "pointer" }}>← Back to login</span>
            </p>
          </>
        )}
        {!otpStep && view === "login" && (
          <>
            <h2 style={styles.title}>Welcome back 👋</h2>
            <p style={styles.subtitle}>Login to your account</p>

            {error && <div style={styles.errorBox}>⚠️ {error}</div>}
            {successMessage && <div style={styles.successBox}>✅ {successMessage}</div>}

            <form onSubmit={handleLogin}>
              <div style={styles.fieldWrap}>
                <label style={styles.label}>Email</label>
                <input
                  type="email"
                  placeholder="you@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  style={styles.input}
                />
              </div>

              <div style={styles.fieldWrap}>
                <div style={{ display: "flex", justifyContent: "between", alignItems: "center", marginBottom: "8px" }}>
                  <label style={{ ...styles.label, margin: 0, flex: 1 }}>Password</label>
                  <button 
                    type="button" 
                    onClick={() => { setError(""); setSuccessMessage(""); setView("forgot"); }} 
                    style={styles.forgotBtn}
                  >
                    Forgot Password?
                  </button>
                </div>
                <div style={styles.passwordWrap}>
                  <input
                    type={showPassword ? "text" : "password"}
                    placeholder="Enter your password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    style={{ ...styles.input, marginBottom: 0 }}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    style={styles.eyeBtn}
                  >
                    {showPassword ? "🙈" : "👁️"}
                  </button>
                </div>
              </div>

              <button type="submit" disabled={loading} style={{ ...styles.submitBtn, opacity: loading ? 0.7 : 1 }}>
                {loading ? "Logging in..." : "Login →"}
              </button>
            </form>
          </>
        )}

        {view === "forgot" && (
          <>
            <h2 style={styles.title}>Recover Password 🔑</h2>
            <p style={styles.subtitle}>Enter your account email to receive a password reset token</p>

            {error && <div style={styles.errorBox}>⚠️ {error}</div>}

            <form onSubmit={handleForgotPassword}>
              <div style={styles.fieldWrap}>
                <label style={styles.label}>Account Email Address</label>
                <input
                  type="email"
                  placeholder="you@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  style={styles.input}
                />
              </div>

              <button type="submit" disabled={loading} style={{ ...styles.submitBtn, opacity: loading ? 0.7 : 1 }}>
                {loading ? "Generating token..." : "Send Reset Code →"}
              </button>

              <button type="button" onClick={() => setView("login")} style={styles.backBtn}>
                ← Back to Login
              </button>
            </form>
          </>
        )}

        {view === "reset" && (
          <>
            <h2 style={styles.title}>Set New Password 🔒</h2>
            <p style={styles.subtitle}>Type in the recovery verification token issued to your account</p>

            {error && <div style={styles.errorBox}>⚠️ {error}</div>}
            {successMessage && <div style={styles.successBox}>✅ {successMessage}</div>}

            <form onSubmit={handleResetPassword}>
              <div style={styles.fieldWrap}>
                <label style={styles.label}>6-Digit Recovery Code</label>
                <input
                  type="text"
                  placeholder="e.g. 123456"
                  maxLength={6}
                  value={token}
                  onChange={(e) => setToken(e.target.value)}
                  required
                  style={styles.input}
                />
              </div>

              <div style={styles.fieldWrap}>
                <label style={styles.label}>New Secure Password</label>
                <input
                  type="password"
                  placeholder="At least 6 characters"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  required
                  style={styles.input}
                />
              </div>

              <button type="submit" disabled={loading} style={{ ...styles.submitBtn, opacity: loading ? 0.7 : 1 }}>
                {loading ? "Updating password..." : "Change Password & Login →"}
              </button>

              <button type="button" onClick={() => setView("login")} style={styles.backBtn}>
                Cancel and return
              </button>
            </form>
          </>
        )}

        {/* DIVIDER */}
        <div style={styles.divider}>
          <span style={styles.dividerLine} />
          <span style={styles.dividerText}>or</span>
          <span style={styles.dividerLine} />
        </div>

        {/* SIGNUP LINK */}
        <p style={styles.switchText}>
          Don't have an account?{" "}
          <Link to="/signup" style={styles.link}>
            Sign up free
          </Link>
        </p>

      </div>
    </div>
  );
}

const styles = {
  page: {
    minHeight: "100vh",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    background: "#0a0a0a",
    padding: "24px",
  },
  card: {
    background: "#111",
    border: "1px solid #222",
    borderRadius: "20px",
    padding: "40px",
    width: "100%",
    maxWidth: "420px",
    boxShadow: "0 8px 40px rgba(0,0,0,0.6)",
  },
  logoWrap: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: "10px",
    marginBottom: "24px",
  },
  brand: {
    color: "#f97316",
    fontSize: "24px",
    fontWeight: "800",
    letterSpacing: "1px",
  },
  title: {
    color: "#fff",
    fontSize: "22px",
    fontWeight: "700",
    textAlign: "center",
    marginBottom: "6px",
  },
  subtitle: {
    color: "#888",
    fontSize: "14px",
    textAlign: "center",
    marginBottom: "28px",
  },
  errorBox: {
    background: "#2a1010",
    border: "1px solid #dc2626",
    color: "#f87171",
    padding: "12px 16px",
    borderRadius: "10px",
    fontSize: "14px",
    marginBottom: "20px",
  },
  successBox: {
    background: "#102a18",
    border: "1px solid #22c55e",
    color: "#4ade80",
    padding: "12px 16px",
    borderRadius: "10px",
    fontSize: "14px",
    marginBottom: "20px",
  },
  fieldWrap: {
    marginBottom: "18px",
  },
  label: {
    display: "block",
    color: "#aaa",
    fontSize: "13px",
    fontWeight: "600",
    marginBottom: "8px",
    textTransform: "uppercase",
    letterSpacing: "0.5px",
  },
  input: {
    width: "100%",
    padding: "12px 16px",
    background: "#1a1a1a",
    border: "1px solid #333",
    borderRadius: "10px",
    color: "#fff",
    fontSize: "15px",
    outline: "none",
    boxSizing: "border-box",
  },
  passwordWrap: {
    position: "relative",
  },
  eyeBtn: {
    position: "absolute",
    right: "12px",
    top: "50%",
    transform: "translateY(-50%)",
    background: "transparent",
    border: "none",
    cursor: "pointer",
    fontSize: "16px",
  },
  forgotBtn: {
    background: "transparent",
    border: "none",
    color: "#f97316",
    fontSize: "12px",
    fontWeight: "600",
    cursor: "pointer",
    outline: "none",
    padding: 0,
  },
  backBtn: {
    width: "100%",
    background: "transparent",
    border: "none",
    color: "#888",
    fontSize: "14px",
    fontWeight: "600",
    cursor: "pointer",
    marginTop: "16px",
    textAlign: "center",
  },
  submitBtn: {
    width: "100%",
    padding: "14px",
    background: "linear-gradient(135deg, #f97316, #dc2626)",
    color: "#fff",
    border: "none",
    borderRadius: "12px",
    fontSize: "16px",
    fontWeight: "700",
    cursor: "pointer",
    marginTop: "8px",
  },
  divider: {
    display: "flex",
    alignItems: "center",
    gap: "12px",
    margin: "24px 0",
  },
  dividerLine: {
    flex: 1,
    height: "1px",
    background: "#222",
  },
  dividerText: {
    color: "#555",
    fontSize: "13px",
  },
  switchText: {
    color: "#888",
    fontSize: "14px",
    textAlign: "center",
  },
  link: {
    color: "#f97316",
    textDecoration: "none",
    fontWeight: "600",
  },
};
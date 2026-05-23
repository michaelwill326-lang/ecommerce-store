import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import axios from "axios";

const API = import.meta.env.VITE_API_URL || "https://techmart-backend-ecbi.onrender.com";

export default function Login() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  const handleLogin = async (e) => {
    e.preventDefault();
    setError("");

    try {
      setLoading(true);

      const response = await axios.post(`${API}/api/auth/login`, {
        email,
        password,
      });

      localStorage.setItem("token", response.data.token);
      localStorage.setItem("user", JSON.stringify(response.data.user));

      navigate("/");

    } catch (err) {
      console.error(err);
      setError(
        err.response?.data?.error || "Invalid email or password"
      );
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

        <h2 style={styles.title}>Welcome back 👋</h2>
        <p style={styles.subtitle}>Login to your account</p>

        {/* ERROR */}
        {error && (
          <div style={styles.errorBox}>
            ⚠️ {error}
          </div>
        )}

        {/* FORM */}
        <form onSubmit={handleLogin}>

          {/* EMAIL */}
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

          {/* PASSWORD */}
          <div style={styles.fieldWrap}>
            <label style={styles.label}>Password</label>
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

          {/* SUBMIT */}
          <button
            type="submit"
            disabled={loading}
            style={{
              ...styles.submitBtn,
              opacity: loading ? 0.7 : 1,
            }}
          >
            {loading ? "Logging in..." : "Login →"}
          </button>

        </form>

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
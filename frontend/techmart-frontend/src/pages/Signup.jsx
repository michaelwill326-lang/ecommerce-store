import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import axios from "axios";

const API = import.meta.env.VITE_API_URL || "https://techmart-backend-ecbi.onrender.com";

export default function Signup() {
  const navigate = useNavigate();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState(""); // 📱 Track phone number state
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const handleSignup = async (e) => {
    e.preventDefault();
    setError("");

    // VALIDATION
    if (name.trim().length < 2) {
      return setError("Name must be at least 2 characters");
    }

    if (!phone.trim()) {
      return setError("Phone number is required for dispatch updates");
    }

    const pwdRegex = /^(?=.*[0-9])(?=.*[!@#$%^&*])(.{8,})$/;
    if (!pwdRegex.test(password)) {
      return setError("Password must be 8+ characters with at least one number and symbol (e.g. !@#$%)");
    }

    if (password !== confirm) {
      return setError("Passwords do not match");
    }

    try {
      setLoading(true);

      const response = await axios.post(`${API}/api/auth/signup`, {
        name: name.trim(),
        email: email.trim(),
        phone: phone.trim(), // 📦 Added payload parameter for our updated backend
        password: password.trim(),
      });

      localStorage.setItem("token", response.data.token);
      localStorage.setItem("user", JSON.stringify(response.data.user));

      navigate("/");

    } catch (err) {
      console.error(err.response?.data || err.message);
      setError(err.response?.data?.error || "Signup failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const getPasswordStrength = () => {
    if (password.length === 0) return null;
    const hasNum = /[0-9]/.test(password);
    const hasSym = /[!@#$%^&*]/.test(password);
    if (password.length < 8 || !hasNum || !hasSym) return { label: "Weak", color: "#dc2626", width: "33%" };
    if (password.length < 12) return { label: "Medium", color: "#f97316", width: "66%" };
    return { label: "Strong", color: "#22c55e", width: "100%" };
  };

  const strength = getPasswordStrength();

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

        <h2 style={styles.title}>Create an account 🚀</h2>
        <p style={styles.subtitle}>Join TechMart — The Store of the Future</p>

        {/* ERROR */}
        {error && (
          <div style={styles.errorBox}>
            ⚠️ {error}
          </div>
        )}

        {/* FORM */}
        <form onSubmit={handleSignup}>

          {/* NAME */}
          <div style={styles.fieldWrap}>
            <label style={styles.label}>Full Name</label>
            <input
              type="text"
              placeholder="John Doe"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              style={styles.input}
            />
          </div>

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

          {/* PHONE NUMBER FIELD */}
          <div style={styles.fieldWrap}>
            <label style={styles.label}>Phone Number (For Delivery Updates)</label>
            <input
              type="tel"
              placeholder="e.g. 2348031234567"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
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
                placeholder="At least 6 characters"
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

            {/* PASSWORD STRENGTH BAR */}
            {strength && (
              <div style={styles.strengthWrap}>
                <div style={styles.strengthTrack}>
                  <div style={{
                    ...styles.strengthFill,
                    width: strength.width,
                    background: strength.color,
                  }} />
                </div>
                <span style={{ color: strength.color, fontSize: "12px", fontWeight: "600" }}>
                  {strength.label}
                </span>
              </div>
            )}
          </div>

          {/* CONFIRM PASSWORD */}
          <div style={styles.fieldWrap}>
            <label style={styles.label}>Confirm Password</label>
            <div style={styles.passwordWrap}>
              <input
                type={showConfirm ? "text" : "password"}
                placeholder="Repeat your password"
                value={confirm}
                onChange={(e) => setConfirm(e.target.value)}
                required
                style={{
                  ...styles.input,
                  marginBottom: 0,
                  borderColor: confirm && confirm !== password ? "#dc2626" : "#333",
                }}
              />
              <button
                type="button"
                onClick={() => setShowConfirm(!showConfirm)}
                style={styles.eyeBtn}
              >
                {showConfirm ? "🙈" : "👁️"}
              </button>
            </div>
            {confirm && confirm !== password && (
              <p style={{ color: "#dc2626", fontSize: "12px", marginTop: "6px" }}>
                Passwords do not match
              </p>
            )}
            {confirm && confirm === password && (
              <p style={{ color: "#22c55e", fontSize: "12px", marginTop: "6px" }}>
                ✅ Passwords match
              </p>
            )}
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
            {loading ? "Creating account..." : "Create Account →"}
          </button>

        </form>

        {/* DIVIDER */}
        <div style={styles.divider}>
          <span style={styles.dividerLine} />
          <span style={styles.dividerText}>or</span>
          <span style={styles.dividerLine} />
        </div>

        {/* LOGIN LINK */}
        <p style={styles.switchText}>
          Already have an account?{" "}
          <Link to="/login" style={styles.link}>
            Login
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
    background: "var(--bg-primary)",
    padding: "24px",
  },
  card: {
    background: "var(--bg-secondary)",
    border: "1px solid var(--border-light)",
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
    color: "var(--text-primary)",
    fontSize: "22px",
    fontWeight: "700",
    textAlign: "center",
    marginBottom: "6px",
  },
  subtitle: {
    color: "var(--text-muted)",
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
    color: "var(--text-secondary)",
    fontSize: "13px",
    fontWeight: "600",
    marginBottom: "8px",
    textTransform: "uppercase",
    letterSpacing: "0.5px",
  },
  input: {
    width: "100%",
    padding: "12px 16px",
    background: "var(--bg-card)",
    border: "1px solid var(--border-color)",
    borderRadius: "10px",
    color: "var(--text-primary)",
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
  strengthWrap: {
    display: "flex",
    alignItems: "center",
    gap: "10px",
    marginTop: "8px",
  },
  strengthTrack: {
    flex: 1,
    height: "4px",
    background: "var(--bg-input)",
    borderRadius: "999px",
    overflow: "hidden",
  },
  strengthFill: {
    height: "100%",
    borderRadius: "999px",
    transition: "width 0.3s, background 0.3s",
  },
  submitBtn: {
    width: "100%",
    padding: "14px",
    background: "linear-gradient(135deg, #f97316, #dc2626)",
    color: "var(--text-primary)",
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
    background: "var(--bg-input)",
  },
  dividerText: {
    color: "#555",
    fontSize: "13px",
  },
  switchText: {
    color: "var(--text-muted)",
    fontSize: "14px",
    textAlign: "center",
  },
  link: {
    color: "#f97316",
    textDecoration: "none",
    fontWeight: "600",
  },
};
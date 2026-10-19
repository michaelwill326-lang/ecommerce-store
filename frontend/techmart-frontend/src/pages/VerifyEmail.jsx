import { useEffect, useRef, useState } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import axios from "axios";

const API = (import.meta.env && import.meta.env.VITE_API_URL) || "https://techmart-backend-ecbi.onrender.com";

export function classifyVerifyError(err) {
  const res = err && err.response;
  if (!res) {
    return { kind: "network", message: "We could not reach the server. It may be waking up, so please try again in a moment." };
  }
  const data = res.data && typeof res.data === "object" ? res.data : {};
  if (data.code === "TOKEN_EXPIRED") {
    return { kind: "expired", message: data.error || "This link has expired. Enter your email below and we will send a new one." };
  }
  if (res.status >= 500) {
    return { kind: "server", message: "The server had a problem. Please try again in a moment." };
  }
  return { kind: "invalid", message: data.error || "This link is not valid. Enter your email below and we will send a new one." };
}

const card = { background: "var(--bg-card)", border: "1px solid var(--border-color)", borderRadius: "20px", padding: "40px 32px", maxWidth: "420px", width: "100%", textAlign: "center" };
const heading = { color: "var(--text-primary)", fontSize: "22px", fontWeight: 800, margin: "0 0 12px" };
const bodyText = { color: "var(--text-muted)", fontSize: "15px", lineHeight: 1.6, margin: "0 0 24px" };
const primaryBtn = { width: "100%", padding: "12px", background: "var(--cta-color)", color: "#fff", border: "none", borderRadius: "10px", fontWeight: 700, fontSize: "15px", cursor: "pointer", marginBottom: "12px" };
const secondaryBtn = { width: "100%", padding: "12px", background: "none", color: "var(--text-primary)", border: "1px solid var(--border-color)", borderRadius: "10px", fontWeight: 600, fontSize: "14px", cursor: "pointer" };
const labelStyle = { display: "block", color: "var(--text-secondary)", fontSize: "13px", fontWeight: 600, marginBottom: "4px" };
const inputStyle = { width: "100%", boxSizing: "border-box", padding: "10px 12px", borderRadius: "10px", border: "1px solid var(--border-color)", background: "var(--bg-input)", color: "var(--text-primary)", fontSize: "16px", fontFamily: "inherit" };

export function VerifyEmailView({ status, message, onLogin, onRetry, resendEmail, onResendEmail, onResend, resendState }) {
  const rs = resendState || {};
  const canResend = status === "expired" || status === "invalid";
  const canRetry = status === "network" || status === "server";
  return (
    <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "var(--bg-primary)", padding: "24px" }}>
      <div style={card}>
        {status === "verifying" && (
          <>
            <h2 style={heading}>Verifying your email…</h2>
            <p style={bodyText}>Please wait a moment.</p>
          </>
        )}
        {status === "success" && (
          <>
            <h2 style={{ ...heading, color: "var(--cta-color)" }}>Email verified</h2>
            <p style={bodyText}>Your account is now active. Taking you to your dashboard…</p>
          </>
        )}
        {status === "already" && (
          <>
            <h2 style={heading}>Your email is already verified</h2>
            <p style={bodyText}>You can log in to your account now.</p>
            <button type="button" style={primaryBtn} onClick={onLogin}>Go to login</button>
          </>
        )}
        {(canResend || canRetry) && (
          <>
            <h2 style={heading}>{canRetry ? "We could not verify your email yet" : "This link did not work"}</h2>
            <p style={bodyText}>{message}</p>
            {canRetry && <button type="button" style={primaryBtn} onClick={onRetry}>Try again</button>}
            {canResend && (
              <div style={{ textAlign: "left", marginBottom: "16px" }}>
                <label htmlFor="ve-email" style={labelStyle}>Your email address</label>
                <input id="ve-email" type="email" style={inputStyle} value={resendEmail} placeholder="you@example.com" onChange={(e) => onResendEmail(e.target.value)} />
                <button type="button" style={{ ...primaryBtn, marginTop: "12px", opacity: rs.sending ? 0.6 : 1 }} disabled={rs.sending || !String(resendEmail || "").trim()} onClick={onResend}>
                  {rs.sending ? "Sending…" : "Send a new link"}
                </button>
                {rs.error ? <p role="alert" style={{ margin: "0", padding: "10px 12px", borderRadius: "10px", background: "#fee2e2", color: "#7f1d1d", fontSize: "13px" }}>{rs.error}</p> : null}
                {rs.message ? <p role="status" style={{ margin: "0", padding: "10px 12px", borderRadius: "10px", background: "#dcfce7", color: "#14532d", fontSize: "13px" }}>{rs.message}</p> : null}
              </div>
            )}
            <button type="button" style={secondaryBtn} onClick={onLogin}>Go to login</button>
          </>
        )}
      </div>
    </div>
  );
}

export default function VerifyEmail() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [status, setStatus] = useState("verifying");
  const [message, setMessage] = useState("");
  const [attempt, setAttempt] = useState(0);
  const [resendEmail, setResendEmail] = useState("");
  const [resendState, setResendState] = useState({ sending: false, message: "", error: "" });
  const lastAttempt = useRef(-1);

  useEffect(() => {
    // One request per attempt, even when React runs this effect twice in development.
    if (lastAttempt.current === attempt) return;
    lastAttempt.current = attempt;
    const token = searchParams.get("token");
    if (!token) {
      setStatus("invalid");
      setMessage("No verification token was found in this link.");
      return;
    }
    setStatus("verifying");
    axios
      .get(`${API}/api/auth/verify-email`, { params: { token }, timeout: 30000 })
      .then((res) => {
        if (res.data && res.data.alreadyVerified) {
          setStatus("already");
          return;
        }
        sessionStorage.setItem("token", res.data.token);
        sessionStorage.setItem("user", JSON.stringify(res.data.user));
        localStorage.setItem("techmart_last_activity", String(Date.now()));
        window.dispatchEvent(new Event("techmart-auth-change"));
        setStatus("success");
        setTimeout(() => navigate("/home"), 2000);
      })
      .catch((err) => {
        const c = classifyVerifyError(err);
        setStatus(c.kind);
        setMessage(c.message);
      });
  }, [attempt]);

  const resend = async () => {
    setResendState({ sending: true, message: "", error: "" });
    try {
      await axios.post(`${API}/api/auth/resend-verification`, { email: resendEmail.trim() }, { timeout: 30000 });
      setResendState({ sending: false, message: "A new email is on its way. Check your inbox and spam folder.", error: "" });
    } catch (err) {
      const msg = err.response && err.response.data && err.response.data.error;
      setResendState({ sending: false, message: "", error: msg || "We could not send the email. Please try again in a moment." });
    }
  };

  return (
    <VerifyEmailView
      status={status}
      message={message}
      onLogin={() => navigate("/login")}
      onRetry={() => setAttempt((a) => a + 1)}
      resendEmail={resendEmail}
      onResendEmail={setResendEmail}
      onResend={resend}
      resendState={resendState}
    />
  );
}

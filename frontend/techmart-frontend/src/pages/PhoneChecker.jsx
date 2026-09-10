import { useState, useRef } from "react";
import axios from "axios";

const API = import.meta.env.VITE_API_URL || "https://techmart-backend-ecbi.onrender.com";

function getToken() {
  return sessionStorage.getItem("token");
}

function StatusIcon({ status }) {
  if (status === "pass") return <span style={{ color: "#22c55e", fontSize: "18px" }}>✅</span>;
  if (status === "fail") return <span style={{ color: "#ef4444", fontSize: "18px" }}>❌</span>;
  if (status === "warn") return <span style={{ color: "#f59e0b", fontSize: "18px" }}>⚠️</span>;
  return <span style={{ color: "#6b7280", fontSize: "18px" }}>❓</span>;
}

function VerdictBadge({ verdict, riskLevel }) {
  const colors = {
    low: { bg: "#052e16", border: "#22c55e", text: "#22c55e" },
    medium: { bg: "#1c1208", border: "#f59e0b", text: "#f59e0b" },
    high: { bg: "#1c0a0a", border: "#ef4444", text: "#ef4444" },
  };
  const c = colors[riskLevel] || colors.medium;
  return (
    <div style={{ background: c.bg, border: `2px solid ${c.border}`, borderRadius: "12px", padding: "16px 24px", display: "inline-block", textAlign: "center" }}>
      <div style={{ color: c.text, fontWeight: "800", fontSize: "22px", letterSpacing: "2px" }}>{verdict}</div>
      <div style={{ color: c.text, fontSize: "12px", opacity: 0.8, marginTop: "4px", textTransform: "uppercase", letterSpacing: "1px" }}>Risk: {riskLevel}</div>
    </div>
  );
}

function CheckRow({ label, status, detail }) {
  return (
    <div style={{ display: "flex", alignItems: "flex-start", gap: "12px", padding: "12px 0", borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
      <StatusIcon status={status} />
      <div style={{ flex: 1 }}>
        <div style={{ color: "#fff", fontWeight: "600", fontSize: "14px" }}>{label}</div>
        <div style={{ color: "rgba(255,255,255,0.5)", fontSize: "13px", marginTop: "2px" }}>{detail}</div>
      </div>
    </div>
  );
}

function ScoreRing({ score }) {
  const radius = 45;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (score / 100) * circumference;
  const color = score >= 70 ? "#22c55e" : score >= 40 ? "#f59e0b" : "#ef4444";
  return (
    <div style={{ position: "relative", width: "120px", height: "120px", margin: "0 auto 16px" }}>
      <svg width="120" height="120" style={{ transform: "rotate(-90deg)" }}>
        <circle cx="60" cy="60" r={radius} fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth="10" />
        <circle cx="60" cy="60" r={radius} fill="none" stroke={color} strokeWidth="10"
          strokeDasharray={circumference} strokeDashoffset={offset}
          style={{ transition: "stroke-dashoffset 1s ease", strokeLinecap: "round" }} />
      </svg>
      <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" }}>
        <span style={{ color, fontWeight: "800", fontSize: "26px" }}>{score}</span>
        <span style={{ color: "rgba(255,255,255,0.4)", fontSize: "11px" }}>/100</span>
      </div>
    </div>
  );
}

export default function PhoneChecker() {
  const [tab, setTab] = useState("photo");
  const [imei, setImei] = useState("");
  const [photo, setPhoto] = useState(null);
  const [preview, setPreview] = useState(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [imageUrl, setImageUrl] = useState(null);
  const [error, setError] = useState("");
  const fileRef = useRef();

  const token = getToken();
  const headers = { Authorization: `Bearer ${token}` };

  const handlePhoto = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    if (file.size > 10 * 1024 * 1024) return setError("Photo must be under 10MB");
    setPhoto(file);
    setPreview(URL.createObjectURL(file));
    setResult(null);
    setError("");
  };

  const analyzePhoto = async () => {
    if (!photo) return setError("Please upload a phone photo first");
    setLoading(true); setError(""); setResult(null);
    try {
      const form = new FormData();
      form.append("photo", photo);
      const r = await axios.post(`${API}/api/phone-checker/photo`, form, {
        headers: { ...headers, "Content-Type": "multipart/form-data" }
      });
      setResult(r.data.result);
      setImageUrl(r.data.imageUrl);
    } catch (e) {
      setError(e.response?.data?.error || "Analysis failed. Please try again.");
    } finally { setLoading(false); }
  };

  const checkImei = async () => {
    if (!imei.trim()) return setError("Please enter an IMEI number");
    setLoading(true); setError(""); setResult(null);
    try {
      const r = await axios.post(`${API}/api/phone-checker/imei`, { imei: imei.trim() }, { headers });
      setResult(r.data.result);
    } catch (e) {
      setError(e.response?.data?.error || "IMEI check failed. Please try again.");
    } finally { setLoading(false); }
  };

  const reset = () => { setResult(null); setPhoto(null); setPreview(null); setImei(""); setError(""); setImageUrl(null); };

  const s = {
    page: { minHeight: "100vh", background: "#0a0a0a", padding: "24px 16px 80px", fontFamily: "system-ui, sans-serif" },
    card: { background: "#111", border: "1px solid #1f1f1f", borderRadius: "16px", padding: "24px", marginBottom: "16px" },
    title: { color: "#fff", fontSize: "24px", fontWeight: "800", margin: "0 0 4px" },
    sub: { color: "rgba(255,255,255,0.4)", fontSize: "14px", margin: "0 0 24px" },
    tabRow: { display: "flex", gap: "8px", marginBottom: "24px" },
    input: { width: "100%", background: "#1a1a1a", border: "1px solid #2a2a2a", borderRadius: "10px", padding: "14px 16px", color: "#fff", fontSize: "16px", outline: "none", letterSpacing: "2px", boxSizing: "border-box" },
    btn: { width: "100%", padding: "14px", background: "linear-gradient(135deg,#6366f1,#4f46e5)", color: "#fff", border: "none", borderRadius: "12px", fontWeight: "700", fontSize: "16px", cursor: "pointer", marginTop: "12px" },
    uploadBox: { border: "2px dashed rgba(99,102,241,0.4)", borderRadius: "14px", padding: "32px 20px", textAlign: "center", cursor: "pointer", background: "rgba(99,102,241,0.04)" },
  };

  return (
    <div style={s.page}>
      <div style={{ maxWidth: "480px", margin: "0 auto" }}>

        {/* Header */}
        <div style={s.card}>
          <div style={{ fontSize: "36px", marginBottom: "8px" }}>📱</div>
          <h1 style={s.title}>Phone Checker</h1>
          <p style={s.sub}>Verify if a phone is stolen, blacklisted, or refurbished before you buy</p>

          {/* Tabs */}
          <div style={s.tabRow}>
            {["photo", "imei"].map(t => (
              <button key={t} onClick={() => { setTab(t); reset(); }} style={{
                flex: 1, padding: "10px", borderRadius: "10px", border: "none", cursor: "pointer", fontWeight: "700", fontSize: "14px",
                background: tab === t ? "linear-gradient(135deg,#6366f1,#4f46e5)" : "#1a1a1a",
                color: tab === t ? "#fff" : "rgba(255,255,255,0.4)"
              }}>
                {t === "photo" ? "📷 Photo Analysis" : "🔢 IMEI Lookup"}
              </button>
            ))}
          </div>

          {/* Photo tab */}
          {tab === "photo" && !result && (
            <div>
              <div style={s.uploadBox} onClick={() => fileRef.current?.click()}>
                {preview ? (
                  <img src={preview} alt="Phone" style={{ maxWidth: "100%", maxHeight: "240px", borderRadius: "10px", objectFit: "contain" }} />
                ) : (
                  <>
                    <div style={{ fontSize: "48px", marginBottom: "12px" }}>📸</div>
                    <div style={{ color: "#fff", fontWeight: "600", marginBottom: "4px" }}>Upload Phone Photo</div>
                    <div style={{ color: "rgba(255,255,255,0.4)", fontSize: "13px" }}>Tap to choose a clear photo of the phone</div>
                    <div style={{ color: "rgba(255,255,255,0.3)", fontSize: "12px", marginTop: "8px" }}>JPG, PNG up to 10MB</div>
                  </>
                )}
              </div>
              <input ref={fileRef} type="file" accept="image/*" onChange={handlePhoto} style={{ display: "none" }} />
              {preview && (
                <div style={{ display: "flex", gap: "8px", marginTop: "12px" }}>
                  <button onClick={() => { setPhoto(null); setPreview(null); }} style={{ flex: 1, padding: "12px", background: "#1a1a1a", color: "#888", border: "none", borderRadius: "10px", cursor: "pointer" }}>
                    Change Photo
                  </button>
                  <button onClick={analyzePhoto} disabled={loading} style={{ flex: 2, padding: "12px", background: loading ? "#333" : "linear-gradient(135deg,#6366f1,#4f46e5)", color: "#fff", border: "none", borderRadius: "10px", fontWeight: "700", cursor: loading ? "not-allowed" : "pointer" }}>
                    {loading ? "🔍 Analysing..." : "Analyse Phone"}
                  </button>
                </div>
              )}
              {!preview && <button onClick={() => fileRef.current?.click()} style={s.btn}>Choose Photo</button>}
            </div>
          )}

          {/* IMEI tab */}
          {tab === "imei" && !result && (
            <div>
              <div style={{ color: "rgba(255,255,255,0.5)", fontSize: "13px", marginBottom: "12px" }}>
                Dial <span style={{ color: "#a5b4fc", fontFamily: "monospace" }}>*#06#</span> on the phone to get the IMEI number
              </div>
              <input
                style={s.input}
                type="tel"
                inputMode="numeric"
                maxLength={15}
                placeholder="Enter 15-digit IMEI"
                value={imei}
                onChange={e => { setImei(e.target.value.replace(/\D/g, "")); setError(""); }}
              />
              <div style={{ color: "rgba(255,255,255,0.3)", fontSize: "12px", marginTop: "6px", textAlign: "right" }}>{imei.length}/15 digits</div>
              <button onClick={checkImei} disabled={loading || imei.length !== 15} style={{
                ...s.btn, background: (loading || imei.length !== 15) ? "#333" : "linear-gradient(135deg,#6366f1,#4f46e5)",
                cursor: (loading || imei.length !== 15) ? "not-allowed" : "pointer"
              }}>
                {loading ? "🔍 Checking..." : "Check IMEI"}
              </button>
            </div>
          )}

          {error && (
            <div style={{ background: "#1c0a0a", border: "1px solid #ef4444", borderRadius: "10px", padding: "12px 16px", color: "#ef4444", fontSize: "14px", marginTop: "12px" }}>
              {error}
            </div>
          )}
        </div>

        {/* Loading state */}
        {loading && (
          <div style={{ ...s.card, textAlign: "center", padding: "40px" }}>
            <div style={{ fontSize: "48px", marginBottom: "16px", animation: "spin 1s linear infinite", display: "inline-block" }}>🔍</div>
            <div style={{ color: "#fff", fontWeight: "600", marginBottom: "8px" }}>
              {tab === "photo" ? "Analysing phone condition..." : "Checking IMEI database..."}
            </div>
            <div style={{ color: "rgba(255,255,255,0.4)", fontSize: "13px" }}>This usually takes 5–10 seconds</div>
          </div>
        )}

        {/* Results */}
        {result && !loading && (
          <>
            {/* Verdict */}
            <div style={{ ...s.card, textAlign: "center" }}>
              {result.conditionScore !== undefined && <ScoreRing score={result.conditionScore} />}
              <VerdictBadge verdict={result.verdict} riskLevel={result.riskLevel} />
              <p style={{ color: "rgba(255,255,255,0.7)", fontSize: "14px", marginTop: "16px", lineHeight: "1.6", textAlign: "left" }}>
                {result.summary}
              </p>
            </div>

            {/* Device info (IMEI only) */}
            {result.deviceInfo && (result.deviceInfo.brand || result.deviceInfo.model) && (
              <div style={s.card}>
                <h3 style={{ color: "#fff", margin: "0 0 16px", fontSize: "16px" }}>📱 Device Info</h3>
                {Object.entries(result.deviceInfo).map(([k, v]) => v && (
                  <div key={k} style={{ display: "flex", justifyContent: "space-between", padding: "8px 0", borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
                    <span style={{ color: "rgba(255,255,255,0.5)", fontSize: "14px", textTransform: "capitalize" }}>{k.replace(/([A-Z])/g, " $1")}</span>
                    <span style={{ color: "#fff", fontWeight: "600", fontSize: "14px" }}>{v}</span>
                  </div>
                ))}
              </div>
            )}

            {/* Checks */}
            {result.checks?.length > 0 && (
              <div style={s.card}>
                <h3 style={{ color: "#fff", margin: "0 0 8px", fontSize: "16px" }}>🔎 Inspection Results</h3>
                {result.checks.map((c, i) => <CheckRow key={i} {...c} />)}
              </div>
            )}

            {/* Red flags */}
            {result.redFlags?.length > 0 && (
              <div style={{ ...s.card, background: "#1c0a0a", border: "1px solid rgba(239,68,68,0.3)" }}>
                <h3 style={{ color: "#ef4444", margin: "0 0 12px", fontSize: "16px" }}>🚩 Red Flags</h3>
                {result.redFlags.map((f, i) => (
                  <div key={i} style={{ color: "rgba(255,255,255,0.7)", fontSize: "14px", padding: "6px 0", borderBottom: "1px solid rgba(255,255,255,0.05)", display: "flex", gap: "8px" }}>
                    <span style={{ color: "#ef4444" }}>•</span> {f}
                  </div>
                ))}
              </div>
            )}

            {/* Buy advice */}
            {result.buyAdvice && (
              <div style={{ ...s.card, background: "#0a1628", border: "1px solid rgba(99,102,241,0.3)" }}>
                <h3 style={{ color: "#a5b4fc", margin: "0 0 8px", fontSize: "16px" }}>💡 TechMart's Advice</h3>
                <p style={{ color: "rgba(255,255,255,0.7)", fontSize: "14px", lineHeight: "1.6", margin: 0 }}>{result.buyAdvice}</p>
              </div>
            )}

            {/* Analysed image */}
            {imageUrl && (
              <div style={s.card}>
                <h3 style={{ color: "#fff", margin: "0 0 12px", fontSize: "16px" }}>📸 Analysed Photo</h3>
                <img src={imageUrl} alt="Analysed phone" style={{ width: "100%", borderRadius: "10px", objectFit: "cover" }} />
              </div>
            )}

            {/* Check another */}
            <button onClick={reset} style={{ ...s.btn, background: "#1a1a1a", color: "#a5b4fc", marginTop: "8px" }}>
              Check Another Phone
            </button>
          </>
        )}

        {/* Tips */}
        {!result && !loading && (
          <div style={s.card}>
            <h3 style={{ color: "#fff", fontSize: "15px", margin: "0 0 14px" }}>💡 Tips for best results</h3>
            {tab === "photo" ? [
              "Take photo in good lighting",
              "Show the full front of the phone",
              "Include the back if possible",
              "Make sure text and ports are visible",
            ] : [
              "Dial *#06# to get the IMEI",
              "Or check under the battery / Settings",
              "IMEI is always exactly 15 digits",
              "Each phone has a unique IMEI",
            ].map((tip, i) => (
              <div key={i} style={{ display: "flex", gap: "10px", padding: "6px 0", color: "rgba(255,255,255,0.5)", fontSize: "13px" }}>
                <span style={{ color: "#6366f1" }}>→</span> {tip}
              </div>
            ))}
          </div>
        )}
      </div>

      <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
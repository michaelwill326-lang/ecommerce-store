import { useEffect, useState } from "react";
import axios from "axios";
import { FEATURES } from "../config/features";
import Icon from "./Icons";

const SOURCE_LABELS = {
  provider_lookup: "Provider lookup",
  browser_test: "Tested in browser",
  seller_reported: "Seller reported",
  ai_estimate: "AI estimate",
  techmart_inspected: "TechMart inspected",
};

const STATUS_STYLES = {
  pass: { label: "Pass", bg: "#dcfce7", fg: "#14532d" },
  fail: { label: "Fail", bg: "#fee2e2", fg: "#7f1d1d" },
  unknown: { label: "Unknown", bg: "#fef3c7", fg: "#78350f" },
  not_checked: { label: "Not checked", bg: "#e5e7eb", fg: "#374151" },
};

const GRADE_LABELS = { new: "Brand new", A: "Grade A", B: "Grade B", C: "Grade C", D: "Grade D" };

// Check keys the backend and the device-test page will use.
const EXPECTED_CHECKS = [
  { key: "blacklist", label: "Blacklist / IMEI status" },
  { key: "screen", label: "Screen test" },
  { key: "camera", label: "Camera test" },
  { key: "speaker", label: "Speaker test" },
  { key: "sensors", label: "Sensor test" },
];

const valueStyle = { color: "var(--text-primary, #111111)", fontSize: "14px", fontWeight: 600, marginTop: "2px" };
const mutedStyle = { color: "var(--text-muted, #6b7280)", fontSize: "13px", marginTop: "2px" };

function formatDate(value) {
  if (!value) return "";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "";
  return d.toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
}

function Chip({ status }) {
  const s = STATUS_STYLES[status] || STATUS_STYLES.unknown;
  return (
    <span style={{ display: "inline-block", padding: "2px 8px", borderRadius: "999px", background: s.bg, color: s.fg, fontSize: "11px", fontWeight: 700 }}>
      {s.label}
    </span>
  );
}

function SourceLine({ source, date }) {
  const label = SOURCE_LABELS[source] || "Unknown source";
  const d = formatDate(date);
  return <div style={{ ...mutedStyle, fontSize: "12px" }}>{label}{d ? ` · ${d}` : ""}</div>;
}

function Row({ label, children }) {
  return (
    <div style={{ padding: "10px 0", borderTop: "1px solid var(--border-light, #e5e7eb)" }}>
      <div style={{ color: "var(--text-muted, #6b7280)", fontSize: "12px", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.4px" }}>{label}</div>
      {children}
    </div>
  );
}

export function DevicePassportView({ passport }) {
  const p = passport || {};
  const info = p.deviceInfo || {};
  const deviceName = [info.brand, info.model, info.storage, info.color].filter(Boolean).join(" · ");
  const checks = Array.isArray(p.checks) ? p.checks : [];
  const byKey = {};
  checks.forEach((c) => { if (c && c.key && !byKey[c.key]) byKey[c.key] = c; });
  const extra = checks.filter((c) => c && c.key && !EXPECTED_CHECKS.some((e) => e.key === c.key));
  const battery = p.battery && p.battery.healthPercent ? p.battery : null;
  const grade = p.cosmetic && p.cosmetic.grade;
  const gradeNotes = p.cosmetic && p.cosmetic.notes;
  const repairs = Array.isArray(p.repairs) ? p.repairs : [];
  const faults = Array.isArray(p.knownFaults) ? p.knownFaults : [];
  const last4 = p.imei && p.imei.last4;
  const blacklistCheck = byKey.blacklist;
  const imeiCheckPassed = blacklistCheck?.status === 'pass' &&
    ['provider_lookup', 'techmart_inspected'].includes(blacklistCheck?.source);
  const sellerDate = p.sellerReportedAt;

  const checkRow = (key, label, c) => (
    <Row key={key} label={label}>
      <div style={{ marginTop: "4px" }}><Chip status={c ? c.status : "not_checked"} /></div>
      {c && c.source ? <SourceLine source={c.source} date={c.checkedAt} /> : null}
      {c && c.detail ? <div style={mutedStyle}>{c.detail}</div> : null}
    </Row>
  );

  return (
    <section aria-label="Device passport" style={{ border: "1px solid var(--border-color, #e5e7eb)", borderRadius: "14px", padding: "16px", margin: "24px 0", background: "var(--bg-card, #ffffff)" }}>
      <h3 style={{ display: "flex", alignItems: "center", gap: "8px", margin: "0 0 4px", color: "var(--text-primary, #111111)", fontSize: "16px", fontWeight: 800 }}>
        <Icon name="shield" size={18} /> Device passport
      </h3>
      <p style={{ ...mutedStyle, margin: "0 0 8px" }}>
        Every line shows where it came from and when. Items marked “Not checked” have no source yet.
      </p>

      {imeiCheckPassed && (
        <div style={{ display: "inline-block", padding: "7px 11px", margin: "8px 0", borderRadius: "8px", background: "#dcfce7", color: "#14532d", fontSize: "12px", fontWeight: 800 }}>
          ✓ IMEI CHECK PASSED
        </div>
      )}
      <Row label="Device"><div style={valueStyle}>{deviceName || "Not provided"}</div></Row>

      <Row label="IMEI">
        {last4
          ? <><div style={valueStyle}>{`•••• ${last4}`}</div><div style={{ ...mutedStyle, fontSize: "12px" }}>Last 4 digits only</div></>
          : <div style={{ marginTop: "4px" }}><Chip status="not_checked" /></div>}
      </Row>

      {EXPECTED_CHECKS.map((e) => checkRow(e.key, e.label, byKey[e.key]))}
      {extra.map((c) => checkRow(c.key, c.label || c.key, c))}

      <Row label="Battery health">
        {battery
          ? <><div style={valueStyle}>{`${battery.healthPercent}%`}</div><SourceLine source={battery.source} date={battery.reportedAt} /></>
          : <div style={{ marginTop: "4px" }}><Chip status="not_checked" /></div>}
      </Row>

      <Row label="Cosmetic condition">
        <div style={valueStyle}>{grade ? (GRADE_LABELS[grade] || grade) : "Not provided"}</div>
        {gradeNotes ? <div style={mutedStyle}>{gradeNotes}</div> : null}
        {grade ? <SourceLine source="seller_reported" date={sellerDate} /> : null}
      </Row>

      <Row label="Reported repairs">
        {repairs.length
          ? repairs.map((r, i) => <div key={i} style={valueStyle}>{r.part}{r.note ? ` — ${r.note}` : ""}</div>)
          : <div style={valueStyle}>None reported</div>}
        {sellerDate ? <SourceLine source="seller_reported" date={sellerDate} /> : null}
      </Row>

      <Row label="Known faults">
        {faults.length
          ? faults.map((f, i) => <div key={i} style={valueStyle}>{f}</div>)
          : <div style={valueStyle}>None reported</div>}
        {sellerDate ? <SourceLine source="seller_reported" date={sellerDate} /> : null}
      </Row>

      <p style={{ ...mutedStyle, fontSize: "12px", margin: "10px 0 0" }}>
        Items marked “Seller reported” come from the seller and have not been verified by TechMart.
      </p>
    </section>
  );
}

export default function DevicePassportCard({ productId }) {
  const [passport, setPassport] = useState(null);

  useEffect(() => {
    if (!FEATURES.devicePassport || !productId) return undefined;
    let cancelled = false;
    const base = import.meta.env.VITE_API_URL || "https://techmart-backend-ecbi.onrender.com";
    axios
      .get(`${base}/api/passport/product/${productId}`, { timeout: 8000 })
      .then((r) => { if (!cancelled && r.data && r.data.passport) setPassport(r.data.passport); })
      .catch(() => {});
    return () => { cancelled = true; };
  }, [productId]);

  if (!FEATURES.devicePassport || !passport) return null;
  return <DevicePassportView passport={passport} />;
}

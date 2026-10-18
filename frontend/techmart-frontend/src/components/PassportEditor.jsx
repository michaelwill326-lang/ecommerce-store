import { useEffect, useState } from "react";
import axios from "axios";
import Icon from "./Icons";

const API = (import.meta.env && import.meta.env.VITE_API_URL) || "https://techmart-backend-ecbi.onrender.com";

export const GRADES = [
  { value: "", label: "Select a grade" },
  { value: "new", label: "New — unopened or never used" },
  { value: "A", label: "A, Like new — no marks visible at arm’s length" },
  { value: "B", label: "B, Good — light scratches or small marks, no dents or cracks" },
  { value: "C", label: "C, Fair — clear scratches, dents or wear, screen not cracked" },
  { value: "D", label: "D, Heavy wear — deep scratches, dents or cracks; list every damage in the notes" },
];

export const EMPTY_FORM = {
  brand: "", model: "", storage: "", color: "",
  grade: "", notes: "",
  repairs: [], knownFaults: [],
  battery: "", publish: false,
};

const trim = (v, n) => (typeof v === "string" ? v.trim().slice(0, n) : "");

export function formFromPassport(p) {
  if (!p) return { ...EMPTY_FORM, repairs: [], knownFaults: [] };
  const info = p.deviceInfo || {};
  const cos = p.cosmetic || {};
  return {
    brand: info.brand || "",
    model: info.model || "",
    storage: info.storage || "",
    color: info.color || "",
    grade: cos.grade || "",
    notes: cos.notes || "",
    repairs: Array.isArray(p.repairs) ? p.repairs.map((r) => ({ part: (r && r.part) || "", note: (r && r.note) || "" })) : [],
    knownFaults: Array.isArray(p.knownFaults) ? p.knownFaults.map((f) => String(f || "")) : [],
    battery: p.battery && p.battery.healthPercent ? String(p.battery.healthPercent) : "",
    publish: p.published === true,
  };
}

export function validateForm(form) {
  const f = form || {};
  const raw = String(f.battery == null ? "" : f.battery).trim();
  if (raw !== "") {
    const n = Number(raw);
    if (!/^\d+$/.test(raw) || n < 1 || n > 100) {
      return "Battery health must be a whole number from 1 to 100, or left blank.";
    }
  }
  if (f.grade && !GRADES.some((g) => g.value === f.grade)) return "Choose a cosmetic grade from the list.";
  if (f.publish) {
    if (!trim(f.model, 60)) return "Add the phone model before showing the passport to buyers.";
    if (!f.grade) return "Choose a cosmetic grade before showing the passport to buyers.";
  }
  return "";
}

// Only these fields are ever sent. Checks, IMEI data and ownership are not seller-editable.
export function buildPayload(form) {
  const f = form || {};
  const raw = String(f.battery == null ? "" : f.battery).trim();
  return {
    deviceInfo: { brand: trim(f.brand, 60), model: trim(f.model, 60), storage: trim(f.storage, 30), color: trim(f.color, 30) },
    cosmetic: { grade: trim(f.grade, 5), notes: trim(f.notes, 300) },
    repairs: (Array.isArray(f.repairs) ? f.repairs : []).slice(0, 10)
      .map((r) => ({ part: trim(r && r.part, 60), note: trim(r && r.note, 200) }))
      .filter((r) => r.part),
    knownFaults: (Array.isArray(f.knownFaults) ? f.knownFaults : []).slice(0, 10)
      .map((x) => trim(x, 120)).filter(Boolean),
    battery: raw === "" ? null : { healthPercent: Number(raw) },
    publish: Boolean(f.publish),
  };
}

const overlay = { position: "fixed", inset: 0, zIndex: 10001, background: "rgba(0,0,0,0.55)", overflowY: "auto", padding: "16px", WebkitOverflowScrolling: "touch" };
const panel = { maxWidth: "560px", margin: "0 auto", background: "var(--bg-card, #ffffff)", color: "var(--text-primary, #111111)", borderRadius: "16px", padding: "18px", border: "1px solid var(--border-color, #e5e7eb)" };
const labelStyle = { display: "block", color: "var(--text-secondary, #374151)", fontSize: "13px", fontWeight: 600, marginBottom: "4px" };
const inputStyle = { width: "100%", boxSizing: "border-box", padding: "10px 12px", borderRadius: "10px", border: "1px solid var(--border-color, #d1d5db)", background: "var(--bg-input, #ffffff)", color: "var(--text-primary, #111111)", fontSize: "16px", fontFamily: "inherit" };
const sectionTitle = { color: "var(--text-primary, #111111)", fontSize: "14px", fontWeight: 800, margin: "18px 0 6px" };
const helpStyle = { color: "var(--text-muted, #6b7280)", fontSize: "12px", margin: "4px 0 0", lineHeight: 1.5 };
const primaryBtn = { flex: 1, padding: "12px 16px", borderRadius: "12px", border: "none", background: "var(--text-primary, #111111)", color: "var(--bg-card, #ffffff)", fontSize: "15px", fontWeight: 700, cursor: "pointer" };
const secondaryBtn = { padding: "10px 14px", borderRadius: "10px", border: "1px solid var(--border-color, #d1d5db)", background: "transparent", color: "var(--text-primary, #111111)", fontSize: "14px", fontWeight: 600, cursor: "pointer" };
const iconBtn = { ...secondaryBtn, padding: "8px", display: "inline-flex", alignItems: "center", justifyContent: "center" };

function Field({ id, label, value, onChange, max, placeholder }) {
  return (
    <div>
      <label htmlFor={id} style={labelStyle}>{label}</label>
      <input id={id} style={inputStyle} value={value} maxLength={max} placeholder={placeholder} onChange={(e) => onChange(e.target.value)} />
    </div>
  );
}

export function PassportEditorView({ form, setForm, onSave, onClose, saving, loading, message, error, productName }) {
  const set = (key, value) => setForm({ ...form, [key]: value });
  const setRepair = (i, key, value) => set("repairs", form.repairs.map((r, k) => (k === i ? { ...r, [key]: value } : r)));
  const setFault = (i, value) => set("knownFaults", form.knownFaults.map((f, k) => (k === i ? value : f)));

  return (
    <div role="dialog" aria-modal="true" aria-label="Device passport editor" style={overlay}>
      <div style={panel}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: "12px" }}>
          <div>
            <h3 style={{ margin: 0, fontSize: "18px", fontWeight: 800, color: "var(--text-primary, #111111)" }}>Device passport</h3>
            {productName ? <p style={{ ...helpStyle, margin: "2px 0 0" }}>{productName}</p> : null}
          </div>
          <button type="button" aria-label="Close" onClick={onClose} style={iconBtn}><Icon name="close" size={18} /></button>
        </div>

        <p style={{ ...helpStyle, background: "var(--bg-secondary, #f3f4f6)", borderRadius: "10px", padding: "10px 12px", margin: "12px 0 0" }}>
          Everything you enter here is shown to buyers as “Seller reported” with today’s date. Only describe what you know about this phone, and do not claim tests you have not done.
        </p>

        {loading ? (
          <p style={{ ...helpStyle, margin: "16px 0" }}>Loading…</p>
        ) : (
          <>
            <div style={sectionTitle}>Device</div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
              <Field id="pp-brand" label="Brand" value={form.brand} max={60} placeholder="Apple" onChange={(v) => set("brand", v)} />
              <Field id="pp-model" label="Model" value={form.model} max={60} placeholder="iPhone 13" onChange={(v) => set("model", v)} />
              <Field id="pp-storage" label="Storage" value={form.storage} max={30} placeholder="128GB" onChange={(v) => set("storage", v)} />
              <Field id="pp-color" label="Colour" value={form.color} max={30} placeholder="Blue" onChange={(v) => set("color", v)} />
            </div>

            <div style={sectionTitle}>Cosmetic condition</div>
            <label htmlFor="pp-grade" style={labelStyle}>Grade</label>
            <select id="pp-grade" style={inputStyle} value={form.grade} onChange={(e) => set("grade", e.target.value)}>
              {GRADES.map((g) => <option key={g.value || "none"} value={g.value}>{g.label}</option>)}
            </select>
            <label htmlFor="pp-notes" style={{ ...labelStyle, marginTop: "10px" }}>Notes</label>
            <textarea id="pp-notes" rows={3} maxLength={300} style={{ ...inputStyle, resize: "vertical" }} value={form.notes} placeholder="Where the marks are, what they look like" onChange={(e) => set("notes", e.target.value)} />
            <p style={helpStyle}>{form.notes.length}/300</p>

            <div style={sectionTitle}>Repairs</div>
            {form.repairs.length === 0 ? <p style={{ ...helpStyle, margin: "0 0 8px" }}>None added. Leave this empty if the phone has never been repaired.</p> : null}
            {form.repairs.map((r, i) => (
              <div key={i} style={{ display: "grid", gridTemplateColumns: "1fr 1.4fr auto", gap: "8px", marginBottom: "8px", alignItems: "center" }}>
                <input aria-label={`Repaired part ${i + 1}`} style={inputStyle} value={r.part} maxLength={60} placeholder="Screen" onChange={(e) => setRepair(i, "part", e.target.value)} />
                <input aria-label={`Repair note ${i + 1}`} style={inputStyle} value={r.note} maxLength={200} placeholder="Replaced" onChange={(e) => setRepair(i, "note", e.target.value)} />
                <button type="button" aria-label={`Remove repair ${i + 1}`} style={iconBtn} onClick={() => set("repairs", form.repairs.filter((_, k) => k !== i))}><Icon name="close" size={16} /></button>
              </div>
            ))}
            <button type="button" style={secondaryBtn} disabled={form.repairs.length >= 10} onClick={() => set("repairs", [...form.repairs, { part: "", note: "" }])}>Add a repair</button>

            <div style={sectionTitle}>Known faults</div>
            {form.knownFaults.length === 0 ? <p style={{ ...helpStyle, margin: "0 0 8px" }}>None added. Leave this empty if there are no known faults.</p> : null}
            {form.knownFaults.map((f, i) => (
              <div key={i} style={{ display: "grid", gridTemplateColumns: "1fr auto", gap: "8px", marginBottom: "8px", alignItems: "center" }}>
                <input aria-label={`Known fault ${i + 1}`} style={inputStyle} value={f} maxLength={120} placeholder="Speaker crackles at high volume" onChange={(e) => setFault(i, e.target.value)} />
                <button type="button" aria-label={`Remove fault ${i + 1}`} style={iconBtn} onClick={() => set("knownFaults", form.knownFaults.filter((_, k) => k !== i))}><Icon name="close" size={16} /></button>
              </div>
            ))}
            <button type="button" style={secondaryBtn} disabled={form.knownFaults.length >= 10} onClick={() => set("knownFaults", [...form.knownFaults, ""])}>Add a fault</button>

            <div style={sectionTitle}>Battery health</div>
            <label htmlFor="pp-battery" style={labelStyle}>Maximum capacity (%)</label>
            <input id="pp-battery" type="number" inputMode="numeric" min={1} max={100} style={inputStyle} value={form.battery} placeholder="e.g. 87" onChange={(e) => set("battery", e.target.value)} />
            <p style={helpStyle}>iPhone: Settings → Battery → Battery Health &amp; Charging → Maximum Capacity. Leave blank if you do not know. Buyers see it as “Seller reported”.</p>

            <label style={{ display: "flex", gap: "10px", alignItems: "flex-start", cursor: "pointer", margin: "20px 0 0" }}>
              <input type="checkbox" checked={form.publish} onChange={(e) => set("publish", e.target.checked)} style={{ marginTop: "3px" }} />
              <span>
                <span style={{ display: "block", fontWeight: 700, fontSize: "14px" }}>Show this passport to buyers</span>
                <span style={helpStyle}>Needs the phone model and a cosmetic grade.</span>
              </span>
            </label>

            {error ? <p role="alert" style={{ margin: "14px 0 0", padding: "10px 12px", borderRadius: "10px", background: "#fee2e2", color: "#7f1d1d", fontSize: "13px" }}>{error}</p> : null}
            {message ? <p role="status" style={{ margin: "14px 0 0", padding: "10px 12px", borderRadius: "10px", background: "#dcfce7", color: "#14532d", fontSize: "13px" }}>{message}</p> : null}

            <div style={{ display: "flex", gap: "10px", marginTop: "18px" }}>
              <button type="button" style={{ ...primaryBtn, opacity: saving ? 0.6 : 1 }} disabled={saving} onClick={onSave}>{saving ? "Saving…" : "Save passport"}</button>
              <button type="button" style={secondaryBtn} onClick={onClose}>Close</button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

export default function PassportEditor({ productId, productName, token, onClose }) {
  const [form, setForm] = useState({ ...EMPTY_FORM, repairs: [], knownFaults: [] });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError("");
    axios
      .get(`${API}/api/passport/mine/${productId}`, { headers: { Authorization: `Bearer ${token}` }, timeout: 15000 })
      .then((r) => { if (!cancelled) setForm(formFromPassport(r.data && r.data.passport)); })
      .catch((e) => { if (!cancelled) setError((e.response && e.response.data && e.response.data.error) || "Could not load the passport. Check your connection and try again."); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [productId, token]);

  const save = async () => {
    setError("");
    setMessage("");
    const problem = validateForm(form);
    if (problem) { setError(problem); return; }
    setSaving(true);
    try {
      const r = await axios.put(`${API}/api/passport/product/${productId}`, buildPayload(form), {
        headers: { Authorization: `Bearer ${token}` },
        timeout: 15000,
      });
      setForm(formFromPassport(r.data && r.data.passport));
      setMessage(form.publish ? "Saved. Buyers can now see this passport." : "Saved as a draft. Buyers cannot see it yet.");
    } catch (e) {
      setError((e.response && e.response.data && e.response.data.error) || "Could not save. Check your connection and try again.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <PassportEditorView form={form} setForm={setForm} onSave={save} onClose={onClose} saving={saving} loading={loading} message={message} error={error} productName={productName} />
  );
}

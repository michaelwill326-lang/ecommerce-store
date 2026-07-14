import { useState, useEffect } from "react";

const THEMES = [
  { id: "dark", label: "🌙 Dark", bg: "#0a0a0a", cta: "#f97316" },
  { id: "light", label: "🌞 Light", bg: "#ffffff", cta: "#16a34a" },
  { id: "ocean", label: "🌊 Ocean", bg: "#0a1628", cta: "#06b6d4" },
  { id: "forest", label: "🌿 Forest", bg: "#0a1a0a", cta: "#f59e0b" },
  { id: "ember", label: "🔥 Ember", bg: "#1a0505", cta: "#f59e0b" },
  { id: "purple", label: "💜 Purple", bg: "#0f0a1a", cta: "#a855f7" },
];

export default function ThemeSwitcher() {
  const [open, setOpen] = useState(false);
  const [current, setCurrent] = useState(() => localStorage.getItem("techmart-theme") || "dark");

  useEffect(() => {
    document.body.setAttribute("data-theme", current);
    localStorage.setItem("techmart-theme", current);
  }, [current]);

  // Theme applied by first useEffect on current change

  const currentTheme = THEMES.find(t => t.id === current) || THEMES[0];

  return (
    <div style={{ position: "relative" }}>
      <button
        onClick={() => setOpen(o => !o)}
        title="Change theme"
        style={{
          background: "none",
          border: "1px solid var(--border-color)",
          borderRadius: "8px",
          padding: "6px 10px",
          cursor: "pointer",
          display: "flex",
          alignItems: "center",
          gap: "6px",
          fontSize: "13px",
          color: "var(--text-secondary)",
          transition: "all 0.2s"
        }}
      >
        <span style={{ width: "12px", height: "12px", borderRadius: "50%", background: currentTheme.cta, display: "inline-block", flexShrink: 0 }} />
        <span style={{ display: "none" }}>{currentTheme.label}</span>
        🎨
      </button>

      {open && (
        <div style={{
          position: "absolute",
          top: "calc(100% + 8px)",
          right: 0,
          background: "var(--bg-card)",
          border: "1px solid var(--border-color)",
          borderRadius: "12px",
          padding: "8px",
          zIndex: 10000,
          minWidth: "160px",
          boxShadow: "0 8px 32px var(--shadow)"
        }}>
          <p style={{ color: "var(--text-muted)", fontSize: "11px", fontWeight: "600", margin: "0 0 6px 8px", textTransform: "uppercase", letterSpacing: "0.5px" }}>Theme</p>
          {THEMES.map(t => (
            <button
              key={t.id}
              onClick={() => { setCurrent(t.id); setOpen(false); }}
              style={{
                width: "100%",
                display: "flex",
                alignItems: "center",
                gap: "10px",
                padding: "8px 10px",
                borderRadius: "8px",
                border: "none",
                background: current === t.id ? "var(--bg-secondary)" : "transparent",
                color: "var(--text-primary)",
                cursor: "pointer",
                fontSize: "13px",
                fontWeight: current === t.id ? "700" : "400",
                textAlign: "left",
                transition: "background 0.15s"
              }}
            >
              <span style={{ width: "14px", height: "14px", borderRadius: "50%", background: t.cta, flexShrink: 0, border: current === t.id ? "2px solid var(--text-primary)" : "none" }} />
              {t.label}
              {current === t.id && <span style={{ marginLeft: "auto", color: "var(--cta-color)" }}>✓</span>}
            </button>
          ))}
        </div>
      )}

      {open && <div onClick={() => setOpen(false)} style={{ position: "fixed", inset: 0, zIndex: 9999 }} />}
    </div>
  );
}

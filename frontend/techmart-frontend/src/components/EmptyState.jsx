export default function EmptyState({ icon, title, subtitle, action, onAction }) {
  return (
    <div style={{ textAlign: "center", padding: "48px 20px", display: "flex", flexDirection: "column", alignItems: "center", gap: "12px" }}>
      <div style={{ fontSize: "48px", lineHeight: 1 }}>{icon || "📭"}</div>
      <p style={{ color: "var(--text-primary)", fontWeight: "700", fontSize: "16px", margin: 0 }}>{title || "Nothing here yet"}</p>
      {subtitle && <p style={{ color: "var(--text-muted)", fontSize: "13px", margin: 0, maxWidth: "260px", lineHeight: "1.5" }}>{subtitle}</p>}
      {action && onAction && (
        <button onClick={onAction} style={{ marginTop: "8px", padding: "10px 24px", background: "linear-gradient(135deg, #f97316, #dc2626)", color: "#fff", border: "none", borderRadius: "10px", cursor: "pointer", fontWeight: "700", fontSize: "14px" }}>
          {action}
        </button>
      )}
    </div>
  );
}

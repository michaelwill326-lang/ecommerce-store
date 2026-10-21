export default function VerifiedBadge({ verified }) {
  // Only a strict true shows the badge. Missing, false or any other value shows nothing.
  if (verified !== true) return null;
  return (
    <span
      title="Verified by TechMart"
      style={{ display: "inline-block", marginLeft: "6px", padding: "1px 6px", borderRadius: "999px", background: "#dcfce7", color: "#14532d", fontSize: "10px", fontWeight: 700, lineHeight: 1.4, verticalAlign: "middle" }}
    >
      Verified
    </span>
  );
}

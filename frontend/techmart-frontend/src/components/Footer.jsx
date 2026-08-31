import { Link } from "react-router-dom";

export default function Footer() {
  const currentYear = new Date().getFullYear();
  return (
    <footer style={{ background: "var(--bg-secondary)", borderTop: "1px solid var(--border-color)", padding: "32px 24px 80px", marginTop: "auto" }}>
      <div style={{ maxWidth: "1200px", margin: "0 auto" }}>
        <div style={{ textAlign: "center", marginBottom: "24px" }}>
          <p style={{ color: "#f97316", fontWeight: "900", fontSize: "20px", margin: "0 0 4px" }}>TechMart</p>
          <p style={{ color: "#555", fontSize: "12px", margin: 0 }}>Nigeria's trusted tech marketplace — Built by Jamiu Sanni</p>
        </div>
        <div style={{ display: "flex", justifyContent: "center", alignItems: "center", gap: "8px", marginBottom: "12px", flexWrap: "wrap" }}>
          <Link to="/buyer-protection" style={linkStyle}>🛡️ Buyer Protection</Link>
          <span style={dot}>·</span>
          <Link to="/policy" style={linkStyle}>Privacy Policy</Link>
          <span style={dot}>·</span>
          <Link to="/policy" style={linkStyle}>Refund Policy</Link>
        </div>
        <div style={{ display: "flex", justifyContent: "center", alignItems: "center", gap: "8px", marginBottom: "24px", flexWrap: "wrap" }}>
          <Link to="/referral" style={linkStyle}>🎁 Refer & Earn ₦500</Link>
          <span style={dot}>·</span>
          <Link to="/seller/apply" style={linkStyle}>Sell on TechMart</Link>
          <span style={dot}>·</span>
          <a href="https://wa.me/2349032657217" target="_blank" rel="noopener noreferrer" style={linkStyle}>💬 WhatsApp Support</a>
        </div>
        <div style={{ display: "flex", justifyContent: "center", gap: "12px", marginBottom: "20px" }}>
          {[{label:"Twitter/X",href:"https://twitter.com",icon:"🐦"},{label:"Instagram",href:"https://instagram.com",icon:"📸"},{label:"Facebook",href:"https://facebook.com",icon:"👥"},{label:"WhatsApp",href:"https://wa.me/2349032657217",icon:"💬"}].map(s => (
            <a key={s.label} href={s.href} target="_blank" rel="noopener noreferrer" style={{ width:"36px",height:"36px",background:"#1a1a1a",border:"1px solid #2a2a2a",borderRadius:"50%",display:"flex",alignItems:"center",justifyContent:"center",fontSize:"16px",textDecoration:"none" }} title={s.label}>{s.icon}</a>
          ))}
        </div>
        <p style={{ color: "#555", fontSize: "12px", textAlign: "center", margin: 0 }}>© {currentYear} TechMart. All rights reserved. · Nigeria's Leading Tech Marketplace</p>
      </div>
    </footer>
  );
}
const linkStyle = { color: "var(--text-muted)", textDecoration: "none", fontSize: "13px", fontWeight: "500", whiteSpace: "nowrap" };
const dot = { color: "#444", fontSize: "13px", userSelect: "none" };

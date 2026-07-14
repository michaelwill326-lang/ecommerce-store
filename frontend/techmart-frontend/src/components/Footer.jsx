import { Link } from "react-router-dom";

export default function Footer() {
  const currentYear = new Date().getFullYear();
  return (
    <footer style={styles.footer}>
      <div style={styles.container}>
        <div style={styles.brand}>
          <span style={{ color: "#f97316", fontWeight: "800", fontSize: "16px" }}>TechMart</span>
          <p style={{ color: "#666", fontSize: "12px", margin: "4px 0 0" }}>Nigeria's trusted tech marketplace</p>
        </div>
        <div style={styles.links}>
          <Link to="/" style={styles.link}>Home</Link>
          <Link to="/tracking" style={styles.link}>Track Order</Link>
          <Link to="/pay" style={styles.link}>TechMart Pay</Link>
          <Link to="/seller/apply" style={styles.link}>Sell on TechMart</Link>
          <Link to="/policy" style={styles.link}>Privacy & Refund Policy</Link>
          <a href="https://wa.me/2349032657217" target="_blank" rel="noopener noreferrer" style={styles.link}>WhatsApp Support</a>
        </div>
        <span style={styles.copyright}>© {currentYear} TechMart. All rights reserved.</span>
      </div>
    </footer>
  );
}

const styles = {
  footer: {
    background: "var(--bg-secondary)",
    borderTop: "1px solid var(--border-light)",
    padding: "24px 32px",
    marginTop: "auto",
  },
  container: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    maxWidth: "1200px",
    margin: "0 auto",
    flexWrap: "wrap",
    gap: "16px",
  },
  brand: { display: "flex", flexDirection: "column" },
  links: { display: "flex", gap: "20px", flexWrap: "wrap", justifyContent: "center" },
  link: { color: "var(--text-muted)", textDecoration: "none", fontSize: "13px", fontWeight: "500" },
  copyright: { color: "#666", fontSize: "13px" },
};

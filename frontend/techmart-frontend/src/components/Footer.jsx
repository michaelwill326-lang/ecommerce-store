import { Link } from "react-router-dom";

export default function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer style={styles.footer}>
      <div style={styles.container}>
        <span style={styles.copyright}>
          © {currentYear} <strong style={{ color: "#f97316" }}>TechMart</strong>. All rights reserved.
        </span>
        <div style={styles.links}>
          <Link to="/policy" style={styles.link}>
            Privacy & Refund Policy
          </Link>
        </div>
      </div>
    </footer>
  );
}

const styles = {
  footer: {
    background: "var(--bg-secondary)",
    borderTop: "1px solid var(--border-light)",
    padding: "20px 32px",
    marginTop: "auto", // Ensures it stays pushed down on short pages
  },
  container: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    maxWidth: "1200px",
    margin: "0 auto",
    flexWrap: "wrap",
    gap: "12px",
  },
  copyright: {
    color: "#666",
    fontSize: "14px",
  },
  links: {
    display: "flex",
    gap: "24px",
  },
  link: {
    color: "var(--text-secondary)",
    textDecoration: "none",
    fontSize: "14px",
    fontWeight: "500",
    transition: "color 0.2s",
  },
};
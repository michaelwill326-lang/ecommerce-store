import { Link, useLocation } from "react-router-dom";
import { useContext } from "react";
import { CartContext } from "../context/CartContext";

export default function Navbar() {
  const { cart } = useContext(CartContext);
  const location = useLocation();

  const cartCount = cart.reduce((total, item) => total + (item.quantity || 1), 0);

  const linkStyle = (path) => ({
    color: location.pathname === path ? "#f97316" : "#fff",
    textDecoration: "none",
    fontSize: "14px",
    fontWeight: "500",
    transition: "color 0.2s",
  });

  return (
    <nav style={{
      display: "flex",
      alignItems: "center",
      justifyContent: "space-between",
      padding: "14px 32px",
      background: "#111",
      color: "#fff",
      borderBottom: "1px solid #222",
      position: "sticky",
      top: 0,
      zIndex: 1000,
    }}>

      {/* Logo */}
      <Link to="/" style={{ textDecoration: "none", display: "flex", alignItems: "center", gap: "10px" }}>
        <img
          src="/TechMart.png"
          alt="TechMart Logo"
          onError={(e) => { e.target.style.display = "none"; }} // hides if image missing
          style={{ height: "36px", width: "auto", objectFit: "contain" }}
        />
        <span style={{ color: "#f97316", fontWeight: "800", fontSize: "20px", letterSpacing: "1px" }}>
          TechMart
        </span>
      </Link>

      {/* Nav Links */}
      <div style={{ display: "flex", alignItems: "center", gap: "24px" }}>
        <Link to="/" style={linkStyle("/")}>Home</Link>
        <Link to="/login" style={linkStyle("/login")}>Login</Link>
        <Link to="/signup" style={linkStyle("/signup")}>Signup</Link>

        {/* Cart with badge */}
        <Link to="/cart" style={{ ...linkStyle("/cart"), position: "relative" }}>
          🛒 Cart
          {cartCount > 0 && (
            <span style={{
              position: "absolute",
              top: "-8px",
              right: "-12px",
              background: "#f97316",
              color: "#fff",
              borderRadius: "50%",
              fontSize: "11px",
              fontWeight: "700",
              width: "18px",
              height: "18px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}>
              {cartCount}
            </span>
          )}
        </Link>
      </div>
    </nav>
  );
}
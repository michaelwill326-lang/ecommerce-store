import { Link } from "react-router-dom";
import { useContext } from "react";
import { CartContext } from "../context/CartContext";

export default function Navbar() {
  const { cart } = useContext(CartContext);

  return (
    <nav style={{ display: "flex", padding: "15px", justifyContent: "space-between", background: "#000", color: "#fff" }}>
      <Link to="/" style={{ color: "#fff", textDecoration: "none" }}>TechMart</Link>
      <div>
        <Link to="/cart" style={{ color: "#fff", marginRight: "20px" }}>Cart ({cart.length})</Link>
        <Link to="/login" style={{ color: "#fff", marginRight: "20px" }}>Login</Link>
        <Link to="/signup" style={{ color: "#fff" }}>Signup</Link>
      </div>
    </nav>
  );
}
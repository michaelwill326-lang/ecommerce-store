// src/components/Navbar.jsx
import { Link } from "react-router-dom";
import { useCart } from "../context/CartContext.jsx";

export default function Navbar() {
  const { totalItems } = useCart();

  return (
    <nav style={{ padding: "10px 20px", display: "flex", justifyContent: "space-between" }}>
      <Link to="/">TechMart</Link>
      <div>
        <Link to="/cart">
          🛒 Cart {totalItems > 0 && <span>({totalItems})</span>}
        </Link>
      </div>
    </nav>
  );
}
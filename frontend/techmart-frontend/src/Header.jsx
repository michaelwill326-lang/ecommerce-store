import React, { useContext } from "react";
import { Link } from "react-router-dom";
import { CartContext } from "../context/CartContext";

const Header = () => {
  const { cart } = useContext(CartContext);

  return (
    <header style={{ display: "flex", justifyContent: "space-between", padding: "10px 20px", background: "#eee" }}>
      <Link to="/">
        <h1>TechMart</h1>
      </Link>
      <nav>
        <Link to="/cart">Cart ({cart.length})</Link>
      </nav>
    </header>
  );
};

export default Header;
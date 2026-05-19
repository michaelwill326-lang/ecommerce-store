import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import ProductCard from "../components/ProductCard";

const API = "https://techmart-backend-ecbi.onrender.com";

export default function Dashboard() {
  const [products, setProducts] = useState([]);

  useEffect(() => {
    fetch(`${API}/api/products`)
      .then((res) => res.json())
      .then((data) => {
        console.log("PRODUCTS:", data);
        setProducts(data);
      })
      .catch((err) => {
        console.log(err);
      });
  }, []);

  const addToCart = (product) => {
    let cart =
      JSON.parse(localStorage.getItem("cart")) || [];

    const existing = cart.find(
      (item) => item._id === product._id
    );

    if (existing) {
      existing.quantity += 1;
    } else {
      cart.push({
        ...product,
        quantity: 1,
      });
    }

    localStorage.setItem(
      "cart",
      JSON.stringify(cart)
    );

    alert("✅ Added To Cart");
  };

  const cart =
    JSON.parse(localStorage.getItem("cart")) || [];

  return (
    <div
      style={{
        padding: "20px",
      }}
    >
      {/* TOP NAVBAR */}

      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: "30px",
        }}
      >
        <h1>🛒 TechMart</h1>

        <div
          style={{
            display: "flex",
            gap: "15px",
          }}
        >
          <Link to="/cart">
            <button
              style={{
                padding: "10px 15px",
                background: "black",
                color: "white",
                border: "none",
                borderRadius: "8px",
                cursor: "pointer",
              }}
            >
              View Cart ({cart.length})
            </button>
          </Link>

          <Link to="/login">
            <button
              style={{
                padding: "10px 15px",
                background: "green",
                color: "white",
                border: "none",
                borderRadius: "8px",
                cursor: "pointer",
              }}
            >
              Login
            </button>
          </Link>
        </div>
      </div>

      {/* PRODUCTS */}

      <div
        style={{
          display: "grid",
          gridTemplateColumns:
            "repeat(auto-fill, minmax(250px, 1fr))",
          gap: "20px",
        }}
      >
        {products.map((product) => (
          <ProductCard
            key={product._id}
            product={product}
            onAddToCart={addToCart}
          />
        ))}
      </div>
    </div>
  );
}
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import ProductCard from "../components/ProductCard";

const API =
  "https://techmart-backend-ecbi.onrender.com";

export default function Dashboard() {

  const [products, setProducts] = useState([]);

  useEffect(() => {

    fetch(`${API}/api/products`)
      .then((res) => res.json())
      .then((data) => {

        console.log("PRODUCTS:", data);

        setProducts(data);

      })
      .catch((err) =>
        console.error(err)
      );

  }, []);

  const addToCart = (product) => {

    let cart =
      JSON.parse(
        localStorage.getItem("cart")
      ) || [];

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

    alert("✅ Added to cart");
  };

  return (
    <div
      style={{
        padding: "30px",
      }}
    >

      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: "30px",
          flexWrap: "wrap",
          gap: "10px",
        }}
      >

        <h1>🛍️ TechMart Store</h1>

        <div
          style={{
            display: "flex",
            gap: "10px",
          }}
        >

          <Link to="/cart">
            <button
              style={{
                padding: "12px 18px",
                background: "black",
                color: "white",
                border: "none",
                borderRadius: "8px",
                cursor: "pointer",
              }}
            >
              Cart
            </button>
          </Link>

          <Link to="/login">
            <button
              style={{
                padding: "12px 18px",
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

      <div
        style={{
          display: "flex",
          gap: "20px",
          flexWrap: "wrap",
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
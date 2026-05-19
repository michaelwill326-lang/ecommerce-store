import { useState, useEffect } from "react";
import ProductCard from "../components/ProductCard";

export default function Dashboard() {
  const [products, setProducts] = useState([]);

  useEffect(() => {
    // Fetch products from backend
    fetch("https://techmart-backend-ecbi.onrender.com/api/products")
      .then((res) => res.json())
      .then((data) => setProducts(data))
      .catch((err) => console.error("Failed to fetch products:", err));
  }, []);

  const addToCart = (product) => {
    let cart = JSON.parse(localStorage.getItem("cart")) || [];
    const existing = cart.find((item) => item._id === product._id);

    if (existing) {
      existing.quantity += 1;
    } else {
      cart.push({ ...product, quantity: 1 });
    }

    localStorage.setItem("cart", JSON.stringify(cart));
    alert("✅ Added to cart");
  };

  return (
    <div style={{ padding: "20px" }}>
      <h1>TechMart Products</h1>
      <div
        style={{
          display: "flex",
          flexWrap: "wrap",
          gap: "20px",
          marginTop: "20px",
        }}
      >
        {products.length === 0 ? (
          <p>Loading products...</p>
        ) : (
          products.map((product) => (
            <ProductCard
              key={product._id || product.name} // fallback key
              product={product}
              onAddToCart={addToCart}
            />
          ))
        )}
      </div>
    </div>
  );
}
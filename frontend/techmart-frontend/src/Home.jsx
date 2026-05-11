import { useEffect, useState } from "react";
import axios from "axios";
import { Link } from "react-router-dom";

export default function Home() {
  const [products, setProducts] = useState([]);

  useEffect(() => {
    fetchProducts();
  }, []);

  async function fetchProducts() {
    try {
      const res = await axios.get(
        `${import.meta.env.VITE_API_URL}/api/products`
      );

      setProducts(res.data);
    } catch (err) {
      console.error("Failed to load products", err);
    }
  }

  function addToCart(product) {
    let cart = JSON.parse(localStorage.getItem("cart")) || [];

    cart.push(product);

    localStorage.setItem("cart", JSON.stringify(cart));

    alert(`${product.name} added to cart`);
  }

  return (
    <div style={{ padding: "20px" }}>
      <h1>🛒 TechMart Store</h1>

      <div style={{ marginBottom: "20px" }}>
        <Link to="/cart">
          <button>Go To Cart</button>
        </Link>
      </div>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit,minmax(250px,1fr))",
          gap: "20px",
        }}
      >
        {products.map((product) => (
          <div
            key={product._id}
            style={{
              border: "1px solid #ddd",
              padding: "15px",
              borderRadius: "10px",
            }}
          >
            <h2>{product.name}</h2>

            <p>₦{product.price}</p>

            <button onClick={() => addToCart(product)}>
              Add To Cart
            </button>

            <Link to={`/product/${product._id}`}>
              <button style={{ marginLeft: "10px" }}>
                View Product
              </button>
            </Link>
          </div>
        ))}
      </div>
    </div>
  );
}
// src/pages/Home.jsx
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import axios from "axios";

export default function Home() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const res = await axios.get(`${import.meta.env.VITE_API_URL}/api/products`);
        setProducts(res.data);
      } catch (err) {
        console.error("Error fetching products:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchProducts();
  }, []);

  if (loading) return <p>Loading products...</p>;
  if (products.length === 0) return <p>No products available.</p>;

  return (
    <div className="product-list">
      <h1>🛍 Products</h1>
      <div className="products-grid" style={{ display: "flex", flexWrap: "wrap", gap: "20px" }}>
        {products.map((product) => (
          <div
            key={product._id}
            className="product-card"
            style={{
              border: "1px solid #ccc",
              borderRadius: "8px",
              padding: "10px",
              width: "200px",
            }}
          >
            <Link to={`/product/${product._id}`}>
              {product.images && product.images.length > 0 && (
                <img
                  src={product.images[0]}
                  alt={product.name}
                  style={{ width: "100%", height: "150px", objectFit: "cover" }}
                />
              )}
              <h2 style={{ fontSize: "1.1rem" }}>{product.name}</h2>
              <p>₦{product.price}</p>
            </Link>
            <p>Stock: {product.stock}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
import { useEffect, useState } from "react";
import axios from "axios";
import { Link } from "react-router-dom";
import { useCart } from "../context/CartContext.jsx";

export default function Dashboard() {
  const [products, setProducts] = useState([]);
  const { addToCart } = useCart();
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
  if (!products.length) return <p>No products available</p>;

  return (
    <div style={{ padding: "20px" }}>
      <h1>🔥 Trending Products</h1>
      <div style={{ display: "flex", flexWrap: "wrap", gap: "20px" }}>
        {products.map((product) => (
          <div
            key={product._id}
            style={{
              border: "1px solid #ccc",
              borderRadius: "8px",
              padding: "10px",
              width: "200px"
            }}
          >
            <Link to={`/product/${product._id}`}>
              <h3>{product.name}</h3>
              {product.images?.[0] && (
                <img
                  src={product.images[0]}
                  alt={product.name}
                  style={{ width: "100%", height: "150px", objectFit: "cover" }}
                />
              )}
            </Link>
            <p>₦{product.price}</p>
            <button
              onClick={() => addToCart(product)}
              disabled={product.stock === 0}
              style={{
                padding: "8px",
                width: "100%",
                backgroundColor: product.stock === 0 ? "#ccc" : "#007bff",
                color: "#fff",
                border: "none",
                borderRadius: "4px",
                cursor: product.stock === 0 ? "not-allowed" : "pointer"
              }}
            >
              {product.stock === 0 ? "Out of Stock" : "Add to Cart"}
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
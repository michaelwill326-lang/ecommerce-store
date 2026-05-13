import { useEffect, useState } from "react";
import axios from "axios";
import ProductCard from "../components/ProductCard";

const API = "https://techmart-backend-ecbi.onrender.com";

export default function Dashboard() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    fetchProducts();
  }, []);

  const fetchProducts = async () => {
    try {
      setLoading(true);

      const res = await axios.get(`${API}/api/products`);

      console.log("PRODUCTS:", res.data);

      if (Array.isArray(res.data)) {
        setProducts(res.data);
      } else {
        setProducts([]);
      }

      setError("");
    } catch (err) {
      console.error("FETCH ERROR:", err);

      setError("Failed to load products");
      setProducts([]);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div style={{ padding: "30px" }}>
        <h2>Loading products...</h2>
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ padding: "30px" }}>
        <h2>{error}</h2>
      </div>
    );
  }

  return (
    <div style={{ padding: "20px" }}>
      <h1>🛍 TechMart Store</h1>

      {products.length === 0 ? (
        <p>No products available</p>
      ) : (
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(250px, 1fr))",
            gap: "20px",
            marginTop: "20px",
          }}
        >
          {products.map((product) => (
            <ProductCard
              key={product._id || Math.random()}
              product={product}
            />
          ))}
        </div>
      )}
    </div>
  );
}
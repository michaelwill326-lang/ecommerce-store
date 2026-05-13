import { useEffect, useState } from "react";
import axios from "axios";
import ProductCard from "../components/ProductCard";

const API = "https://techmart-backend-ecbi.onrender.com";

export default function Dashboard() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchProducts();
  }, []);

  const fetchProducts = async () => {
    try {
      const res = await axios.get(`${API}/api/products`);

      console.log("PRODUCTS:", res.data);

      if (Array.isArray(res.data)) {
        setProducts(res.data);
      } else {
        setProducts([]);
      }
    } catch (err) {
      console.error("Failed to load products", err);
      setProducts([]);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div style={{ padding: "20px" }}>
        <h2>Loading products...</h2>
      </div>
    );
  }

  return (
    <div style={{ padding: "20px" }}>
      <h1>🛍 TechMart Products</h1>

      {products.length === 0 ? (
        <p>No products found</p>
      ) : (
        products.map((product) => (
          <ProductCard
            key={product._id}
            product={product}
          />
        ))
      )}
    </div>
  );
}
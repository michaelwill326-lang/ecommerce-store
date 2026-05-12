import { useEffect, useState } from "react";
import axios from "axios";
import ProductCard from "../components/ProductCard";

const API = "https://techmart-backend-ecbi.onrender.com";

export default function Dashboard() {
  const [products, setProducts] = useState([]);

  useEffect(() => {
    axios.get(`${API}/api/products`)
      .then(res => setProducts(res.data))
      .catch(err => console.error(err));
  }, []);

  return (
    <div style={{ padding: "20px" }}>
      <h1>🔥 Trending Products</h1>
      <div style={{ display: "flex", flexWrap: "wrap", gap: "20px" }}>
        {products.map(p => (
          <ProductCard key={p._id} product={p} />
        ))}
      </div>
    </div>
  );
}
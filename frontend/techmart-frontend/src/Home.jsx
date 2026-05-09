import { useEffect, useState, useContext } from "react";
import { CartContext } from "../context/CartContext";

const API = import.meta.env.VITE_API_URL;

export default function Home() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const { addToCart } = useContext(CartContext);

  useEffect(() => {
    fetch(`${API}/api/products`)
      .then((res) => res.json())
      .then((data) => {
        setProducts(data);
        setLoading(false);
      })
      .catch(() => {
        setError("Failed to load products");
        setLoading(false);
      });
  }, []);

  if (loading) {
    return <div className="container">Loading products...</div>;
  }

  if (error) {
    return <div className="container">{error}</div>;
  }

  return (
    <div className="container">
      <h1>TechMart Products</h1>

      <div className="grid">
        {products.map((product) => (
          <div key={product._id} className="product-card">
            <img
              src={product.images?.[0] || "https://via.placeholder.com/250"}
              alt={product.name}
            />

            <h3>{product.name}</h3>

            <p>${product.price}</p>

            <button onClick={() => addToCart(product)}>
              Add to Cart
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
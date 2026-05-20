import { useEffect, useState } from "react";
import axios from "axios";
import ProductCard from "../components/ProductCard";

export default function Dashboard() {
  const [products, setProducts] = useState([]);
  const [cart, setCart] = useState([]);

  // Fetch products from backend
  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const { data } = await axios.get(
          "https://techmart-backend-ecbi.onrender.com/api/products"
        );
        setProducts(
          data.map((product) => ({
            ...product,
            images:
              product.images?.length > 0
                ? product.images
                : [
                    "https://cdn.openai.com/file/000000000d3071f4823d056f5f2e06f9",
                  ], // fallback image
          }))
        );
      } catch (err) {
        console.error("Failed to fetch products:", err);
      }
    };

    fetchProducts();
  }, []);

  // Add product to cart
  const handleAddToCart = (product) => {
    setCart((prev) => {
      const exists = prev.find((item) => item._id === product._id);
      if (exists) {
        return prev.map((item) =>
          item._id === product._id
            ? { ...item, quantity: (item.quantity || 1) + 1 }
            : item
        );
      }
      return [...prev, { ...product, quantity: 1 }];
    });
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
        {products.map((product) => (
          <ProductCard
            key={product._id || product.name}
            product={product}
            onAddToCart={handleAddToCart}
          />
        ))}
      </div>

      {/* Simple cart preview */}
      {cart.length > 0 && (
        <div style={{ marginTop: "30px" }}>
          <h2>Cart</h2>
          <ul>
            {cart.map((item) => (
              <li key={item._id || item.name}>
                {item.name} x {item.quantity} - ₦{item.price * item.quantity}
              </li>
            ))}
          </ul>
          <p>
            Total: ₦
            {cart.reduce((sum, item) => sum + item.price * item.quantity, 0)}
          </p>
        </div>
      )}
    </div>
  );
}
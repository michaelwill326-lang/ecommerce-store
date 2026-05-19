import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import axios from "axios";

const API = "https://techmart-backend-ecbi.onrender.com";

export default function ProductDetail() {
  const { id } = useParams();
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    fetchProduct();
  }, [id]);

  const fetchProduct = async () => {
    try {
      setLoading(true);
      const res = await axios.get(`${API}/api/products/${id}`);
      setProduct(res.data);
      setError("");
    } catch (err) {
      setError("Product not found");
    } finally {
      setLoading(false);
    }
  };

  const addToCart = () => {
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

  if (loading) return <h2>Loading product...</h2>;
  if (error || !product) return <h2>{error || "Product not found"}</h2>;

  return (
    <div style={{ padding: "30px" }}>
      <h1>{product.name}</h1>
      <img
        src={
          product.images && product.images.length > 0
            ? product.images[0]
            : "/TechMart.png"
        }
        alt={product.name}
        style={{ width: "300px", borderRadius: "10px", marginBottom: "20px" }}
      />

      <h2>₦{product.price}</h2>
      <p>{product.description}</p>
      <p>
        <strong>Category:</strong> {product.category}
      </p>
      <p>
        <strong>Stock:</strong> {product.stock}
      </p>

      <button
        onClick={addToCart}
        style={{
          padding: "12px 20px",
          background: "black",
          color: "white",
          border: "none",
          borderRadius: "8px",
          cursor: "pointer",
          marginTop: "20px",
        }}
      >
        Add To Cart
      </button>
    </div>
  );
}
import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import axios from "axios";

const API = "https://techmart-backend-ecbi.onrender.com";

export default function ProductDetail() {
  const { id } = useParams();

  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchProduct();
  }, [id]);

  const fetchProduct = async () => {
    try {
      const res = await axios.get(`${API}/api/products/${id}`);

      console.log("PRODUCT:", res.data);

      setProduct(res.data);
    } catch (err) {
      console.error(err);
      setProduct(null);
    } finally {
      setLoading(false);
    }
  };

  const addToCart = () => {
    if (!product) return;

    let cart = JSON.parse(localStorage.getItem("cart")) || [];

    const existing = cart.find((item) => item._id === product._id);

    if (existing) {
      existing.quantity += 1;
    } else {
      cart.push({
        ...product,
        quantity: 1,
      });
    }

    localStorage.setItem("cart", JSON.stringify(cart));

    alert("✅ Added to cart");
  };

  if (loading) {
    return <h2 style={{ padding: "30px" }}>Loading...</h2>;
  }

  if (!product) {
    return <h2 style={{ padding: "30px" }}>Product not found</h2>;
  }

  return (
    <div style={{ padding: "30px" }}>
      <img
        src={
          product?.images?.[0] ||
          "https://via.placeholder.com/400x300?text=TechMart"
        }
        alt={product.name}
        style={{
          width: "400px",
          maxWidth: "100%",
          borderRadius: "10px",
        }}
      />

      <h1>{product.name}</h1>

      <h2>₦{product.price}</h2>

      <p>{product.description}</p>

      <button
        onClick={addToCart}
        style={{
          padding: "12px 20px",
          background: "black",
          color: "white",
          border: "none",
          borderRadius: "8px",
          cursor: "pointer",
        }}
      >
        Add To Cart
      </button>
    </div>
  );
}
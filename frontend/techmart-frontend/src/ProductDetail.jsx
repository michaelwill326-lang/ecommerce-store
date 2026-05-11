// src/pages/ProductDetail.jsx
import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import axios from "axios";
import { useCart } from "../context/CartContext.jsx";

export default function ProductDetail() {
  const { id } = useParams();
  const [product, setProduct] = useState(null);
  const { addToCart } = useCart();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchProduct = async () => {
      try {
        const res = await axios.get(`${import.meta.env.VITE_API_URL}/api/products`);
        const found = res.data.find((p) => p._id === id);
        setProduct(found || null);
      } catch (err) {
        console.error("Product fetch error:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchProduct();
  }, [id]);

  if (loading) return <p>Loading product...</p>;
  if (!product) return <p>Product not found</p>;

  return (
    <div style={{ padding: "20px" }}>
      <h1>{product.name}</h1>
      {product.images && product.images.length > 0 && (
        <img src={product.images[0]} alt={product.name} style={{ width: "300px" }} />
      )}
      <p>{product.description}</p>
      <p>₦{product.price}</p>
      <p>Stock: {product.stock}</p>
      <button onClick={() => addToCart(product)} disabled={product.stock === 0}>
        {product.stock === 0 ? "Out of Stock" : "Add to Cart"}
      </button>
    </div>
  );
}
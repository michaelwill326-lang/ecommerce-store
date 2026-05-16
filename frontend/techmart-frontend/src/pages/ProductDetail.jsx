import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import axios from "axios";

const API = "https://techmart-backend-ecbi.onrender.com";

export default function ProductDetail() {
  const { id } = useParams();
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const addToCart = () => {
    let cart = JSON.parse(localStorage.getItem("cart")) || [];
    const existing = cart.find((item) => item._id === product._id);

    if (existing) existing.quantity += 1;
    else cart.push({ ...product, quantity: 1 });

    localStorage.setItem("cart", JSON.stringify(cart));
    alert("✅ Added to cart");
  };

  useEffect(() => {
    const fetchProduct = async () => {
      try {
        setLoading(true);
        const res = await axios.get(`${API}/api/products/${id}`);
        setProduct(res.data);
      } catch (err) {
        console.error(err);
        setError("Product not found");
      } finally {
        setLoading(false);
      }
    };
    fetchProduct();
  }, [id]);

  if (loading) return <h2 style={{ padding: 30 }}>Loading product...</h2>;
  if (error || !product) return <h2 style={{ padding: 30 }}>{error || "Product not found"}</h2>;

  return (
    <div style={{ padding: 30 }}>
      <h1>{product.name}</h1>
      <img
        src={product.images?.[0] || "https://via.placeholder.com/300"}
        alt={product.name}
        style={{ width: 300, borderRadius: 10, marginBottom: 20 }}
      />
      <h2>₦{product.price}</h2>
      <p>{product.description}</p>
      <p><strong>Category:</strong> {product.category}</p>
      <p><strong>Stock:</strong> {product.stock}</p>
      <button onClick={addToCart} style={{ padding: 12, background: "black", color: "white", border: "none", borderRadius: 8, cursor: "pointer" }}>
        Add To Cart
      </button>
    </div>
  );
}
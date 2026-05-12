import { useEffect, useState, useContext } from "react";
import { useParams } from "react-router-dom";
import axios from "axios";
import { CartContext } from "../context/CartContext";

const API = "https://techmart-backend-ecbi.onrender.com";

export default function ProductDetail() {
  const { id } = useParams();
  const { cart, setCart } = useContext(CartContext);

  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [quantity, setQuantity] = useState(1);

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
      console.error(err);
      setError("Product not found");
    } finally {
      setLoading(false);
    }
  };

  const addToCart = () => {
    if (!product) return;

    let updatedCart = [...cart];
    const existing = updatedCart.find((item) => item._id === product._id);

    if (existing) {
      const newQty = existing.quantity + quantity;
      if (newQty > product.stock) {
        alert(`⚠ Only ${product.stock} items in stock`);
        return;
      }
      existing.quantity = newQty;
    } else {
      if (quantity > product.stock) {
        alert(`⚠ Only ${product.stock} items in stock`);
        return;
      }
      updatedCart.push({ ...product, quantity });
    }

    setCart(updatedCart);
    localStorage.setItem("cart", JSON.stringify(updatedCart));
    alert(`✅ Added ${quantity} item(s) to cart`);
  };

  if (loading) return <div style={{ padding: "30px" }}><h2>Loading product...</h2></div>;
  if (error || !product) return <div style={{ padding: "30px" }}><h2>{error}</h2></div>;

  return (
    <div style={{ padding: "30px", maxWidth: "600px", margin: "0 auto" }}>
      <h1>{product.name}</h1>

      <img
        src={product.images?.[0] || "https://via.placeholder.com/300"}
        alt={product.name}
        style={{ width: "100%", borderRadius: "10px", marginBottom: "20px" }}
      />

      <h2>₦{product.price}</h2>
      <p>{product.description}</p>
      <p><strong>Category:</strong> {product.category}</p>
      <p><strong>Stock:</strong> {product.stock}</p>

      <div style={{ display: "flex", alignItems: "center", gap: "10px", marginTop: "15px" }}>
        <label>Quantity:</label>
        <input
          type="number"
          value={quantity}
          min={1}
          max={product.stock}
          onChange={(e) => setQuantity(Number(e.target.value))}
          style={{ width: "60px", padding: "5px" }}
        />
      </div>

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
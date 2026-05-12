import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import axios from "axios";

export default function ProductDetails() {
  const { id } = useParams();

  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const API_URL =
    import.meta.env.VITE_API_URL ||
    "https://techmart-backend-ecbi.onrender.com";

  useEffect(() => {
    async function fetchProduct() {
      try {
        setLoading(true);

        const res = await axios.get(
          `${API_URL}/api/products/${id}`
        );

        setProduct(res.data);
        setError("");
      } catch (err) {
        console.error("Product fetch error:", err);

        setError("Product not found");
      } finally {
        setLoading(false);
      }
    }

    if (id) {
      fetchProduct();
    }
  }, [id]);

  if (loading) {
    return (
      <div
        style={{
          padding: "40px",
          color: "white",
          background: "#111",
          minHeight: "100vh",
        }}
      >
        Loading product...
      </div>
    );
  }

  if (error || !product) {
    return (
      <div
        style={{
          padding: "40px",
          color: "white",
          background: "#111",
          minHeight: "100vh",
        }}
      >
        <h1>{error}</h1>

        <Link
          to="/"
          style={{
            color: "#00bfff",
            textDecoration: "none",
          }}
        >
          ← Back Home
        </Link>
      </div>
    );
  }

  return (
    <div
      style={{
        padding: "40px",
        background: "#111",
        color: "white",
        minHeight: "100vh",
      }}
    >
      <Link
        to="/"
        style={{
          color: "#00bfff",
          textDecoration: "none",
        }}
      >
        ← Back Home
      </Link>

      <div
        style={{
          marginTop: "30px",
          display: "grid",
          gridTemplateColumns: "1fr 1fr",
          gap: "40px",
        }}
      >
        <div>
          <img
            src={
              product.images?.[0] ||
              "https://via.placeholder.com/500x500"
            }
            alt={product.name}
            style={{
              width: "100%",
              borderRadius: "12px",
            }}
          />
        </div>

        <div>
          <h1>{product.name}</h1>

          <h2 style={{ color: "#00ff99" }}>
            ₦{product.price}
          </h2>

          <p style={{ marginTop: "20px" }}>
            {product.description}
          </p>

          <p style={{ marginTop: "10px" }}>
            Stock: {product.stock}
          </p>

          <button
            style={{
              marginTop: "20px",
              padding: "14px 28px",
              border: "none",
              borderRadius: "8px",
              background: "#00bfff",
              color: "white",
              fontSize: "16px",
              cursor: "pointer",
            }}
            onClick={() => {
              const cart =
                JSON.parse(localStorage.getItem("cart")) || [];

              cart.push(product);

              localStorage.setItem(
                "cart",
                JSON.stringify(cart)
              );

              alert("Added to cart");
            }}
          >
            Add To Cart
          </button>
        </div>
      </div>
    </div>
  );
}
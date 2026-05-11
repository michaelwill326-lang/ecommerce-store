import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import axios from "axios";

export default function ProductDetail() {
  const { id } = useParams();

  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchProduct();
  }, []);

  async function fetchProduct() {
    try {
      const res = await axios.get(
        `${import.meta.env.VITE_API_URL}/api/products/${id}`
      );

      setProduct(res.data);
    } catch (err) {
      console.error("Product not found", err);
    } finally {
      setLoading(false);
    }
  }

  function addToCart() {
    let cart = JSON.parse(localStorage.getItem("cart")) || [];

    cart.push(product);

    localStorage.setItem("cart", JSON.stringify(cart));

    alert(`${product.name} added to cart`);
  }

  if (loading) {
    return (
      <div style={{ padding: "20px" }}>
        <h2>Loading product...</h2>
      </div>
    );
  }

  if (!product) {
    return (
      <div style={{ padding: "20px" }}>
        <h2>❌ Product not found</h2>

        <Link to="/">
          <button>Back Home</button>
        </Link>
      </div>
    );
  }

  return (
    <div style={{ padding: "20px" }}>
      <Link to="/">
        <button style={{ marginBottom: "20px" }}>
          ← Back To Store
        </button>
      </Link>

      <div
        style={{
          border: "1px solid #ddd",
          borderRadius: "10px",
          padding: "20px",
          maxWidth: "500px",
        }}
      >
        <h1>{product.name}</h1>

        <p
          style={{
            fontSize: "20px",
            fontWeight: "bold",
          }}
        >
          ₦{product.price}
        </p>

        <p>
          {product.description || "No description available."}
        </p>

        <p>
          Stock: {product.stock || 0}
        </p>

        <button
          onClick={addToCart}
          style={{
            padding: "10px 20px",
            cursor: "pointer",
            marginTop: "10px",
          }}
        >
          Add To Cart
        </button>

        <Link to="/cart">
          <button
            style={{
              padding: "10px 20px",
              marginLeft: "10px",
              cursor: "pointer",
            }}
          >
            Go To Cart
          </button>
        </Link>
      </div>
    </div>
  );
}
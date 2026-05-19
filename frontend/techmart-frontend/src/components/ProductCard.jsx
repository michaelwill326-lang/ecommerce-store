import { Link } from "react-router-dom";

export default function ProductCard({ product, onAddToCart }) {
  const handleAdd = () => {
    if (onAddToCart) onAddToCart(product);
  };

  return (
    <div
      style={{
        border: "1px solid #ddd",
        padding: "15px",
        borderRadius: "10px",
        width: "250px",
      }}
    >
      <img
        src={
          product.images && product.images.length > 0
            ? product.images[0]
            : "/TechMart.png" // default placeholder
        }
        alt={product.name || "Product"}
        style={{ width: "100%", borderRadius: "10px" }}
      />

      <h2>{product.name}</h2>
      <p>₦{product.price}</p>

      <div style={{ display: "flex", gap: "10px", marginTop: "10px" }}>
        <button
          onClick={handleAdd}
          style={{
            padding: "10px",
            background: "black",
            color: "white",
            border: "none",
            borderRadius: "5px",
            cursor: "pointer",
          }}
        >
          Add To Cart
        </button>

        <Link to={`/product/${product._id}`}>
          <button
            style={{
              padding: "10px",
              background: "green",
              color: "white",
              border: "none",
              borderRadius: "5px",
              cursor: "pointer",
            }}
          >
            View Product
          </button>
        </Link>
      </div>
    </div>
  );
}
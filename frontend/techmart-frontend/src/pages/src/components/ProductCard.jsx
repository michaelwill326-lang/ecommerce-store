import { Link } from "react-router-dom";

export default function ProductCard({ product }) {
  if (!product) return null;

  const image =
    product?.images?.[0] ||
    "https://via.placeholder.com/300x200?text=TechMart";

  return (
    <div
      style={{
        border: "1px solid #ddd",
        borderRadius: "10px",
        padding: "15px",
        background: "#fff",
      }}
    >
      <img
        src={image}
        alt={product.name}
        style={{
          width: "100%",
          height: "200px",
          objectFit: "cover",
          borderRadius: "10px",
        }}
      />

      <h2>{product.name || "No name"}</h2>

      <p>₦{product.price || 0}</p>

      <Link to={`/product/${product._id}`}>
        <button
          style={{
            padding: "10px 15px",
            background: "black",
            color: "white",
            border: "none",
            borderRadius: "8px",
            cursor: "pointer",
          }}
        >
          View Product
        </button>
      </Link>
    </div>
  );
}
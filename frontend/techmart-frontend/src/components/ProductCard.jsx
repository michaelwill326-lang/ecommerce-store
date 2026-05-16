import { Link } from "react-router-dom";

export default function ProductCard({ product, onAddToCart }) {
  return (
    <div
      style={{
        border: "1px solid #ddd",
        padding: "15px",
        borderRadius: "10px",
        width: "250px",
        textAlign: "center",
      }}
    >
      <img
        src={product.images?.[0] || "https://via.placeholder.com/250"}
        alt={product.name}
        style={{ width: "100%", borderRadius: "10px" }}
      />

      <h2>{product.name}</h2>
      <p>₦{product.price}</p>

      <div style={{ display: "flex", justifyContent: "space-around", marginTop: "10px" }}>
        <button
          onClick={() => onAddToCart(product)}
          style={{
            background: "black",
            color: "white",
            padding: "10px",
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
              background: "green",
              color: "white",
              padding: "10px",
              border: "none",
              borderRadius: "5px",
              cursor: "pointer",
            }}
          >
            View
          </button>
        </Link>
      </div>
    </div>
  );
}
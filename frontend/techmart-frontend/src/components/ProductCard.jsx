import { Link } from "react-router-dom";

export default function ProductCard({ product, onAddToCart }) {
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
          product.images?.[0]?.startsWith("/products/")
            ? product.images[0]
            : "/products/techmart.png"
        }
        alt={product.name}
        style={{
          width: "100%",
          borderRadius: "10px",
          height: "200px",
          objectFit: "cover",
        }}
      />

      <h2>{product.name}</h2>

      <p>₦{product.price}</p>

      <div
        style={{
          display: "flex",
          gap: "10px",
          marginTop: "10px",
        }}
      >
        <button
          onClick={() => onAddToCart(product)}
          style={{
            background: "black",
            color: "white",
            padding: "10px",
            border: "none",
            borderRadius: "5px",
            cursor: "pointer",
            flex: 1,
          }}
        >
          Add To Cart
        </button>

        <Link to={`/product/${product._id || ""}`}>
          <button
            style={{
              background: "green",
              color: "white",
              padding: "10px",
              border: "none",
              borderRadius: "5px",
              cursor: "pointer",
              flex: 1,
            }}
          >
            View Product
          </button>
        </Link>
      </div>
    </div>
  );
}
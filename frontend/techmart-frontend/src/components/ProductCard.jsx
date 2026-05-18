import { Link } from "react-router-dom";

export default function ProductCard({
  product,
  onAddToCart,
}) {

  return (
    <div
      style={{
        border: "1px solid #ddd",
        borderRadius: "12px",
        padding: "20px",
        width: "260px",
        background: "#fff",
        boxShadow: "0 2px 10px rgba(0,0,0,0.08)",
      }}
    >

      <img
        src={
          product.images?.[0] ||
          "/600x400.svg"
        }
        alt={product.name}
        style={{
          width: "100%",
          height: "220px",
          objectFit: "cover",
          borderRadius: "10px",
        }}
      />

      <h2
        style={{
          marginTop: "15px",
          fontSize: "20px",
        }}
      >
        {product.name}
      </h2>

      <p
        style={{
          color: "green",
          fontWeight: "bold",
          fontSize: "18px",
        }}
      >
        ₦{product.price}
      </p>

      <div
        style={{
          display: "flex",
          gap: "10px",
          marginTop: "15px",
        }}
      >

        <button
          onClick={() => onAddToCart(product)}
          style={{
            flex: 1,
            padding: "12px",
            background: "black",
            color: "white",
            border: "none",
            borderRadius: "8px",
            cursor: "pointer",
            fontWeight: "bold",
          }}
        >
          Add To Cart
        </button>

        <Link
          to={`/product/${product._id}`}
          style={{ flex: 1 }}
        >
          <button
            style={{
              width: "100%",
              padding: "12px",
              background: "green",
              color: "white",
              border: "none",
              borderRadius: "8px",
              cursor: "pointer",
              fontWeight: "bold",
            }}
          >
            View
          </button>
        </Link>

      </div>

    </div>
  );
}
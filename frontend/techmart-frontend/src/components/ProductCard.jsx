import { Link } from "react-router-dom";

export default function ProductCard({
  product,
  onAddToCart,
}) {

  if (!product) {
    return null;
  }

  const image =
    product?.images?.[0] ||
    "/600x400.svg";

  return (
    <div
      style={{
        border: "1px solid #ddd",
        borderRadius: "10px",
        padding: "20px",
        width: "250px",
        background: "#fff",
      }}
    >

      <img
        src={image}
        alt={product?.name || "Product"}
        style={{
          width: "100%",
          height: "220px",
          objectFit: "cover",
          borderRadius: "10px",
        }}
      />

      <h2>
        {product?.name || "No Name"}
      </h2>

      <p>
        ₦{product?.price || 0}
      </p>

      <div
        style={{
          display: "flex",
          gap: "10px",
          marginTop: "15px",
        }}
      >

        <button
          onClick={() =>
            onAddToCart &&
            onAddToCart(product)
          }
          style={{
            background: "black",
            color: "white",
            border: "none",
            padding: "10px",
            borderRadius: "6px",
            cursor: "pointer",
            flex: 1,
          }}
        >
          Add To Cart
        </button>

        <Link
          to={`/product/${product?._id}`}
          style={{ flex: 1 }}
        >
          <button
            style={{
              width: "100%",
              background: "green",
              color: "white",
              border: "none",
              padding: "10px",
              borderRadius: "6px",
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
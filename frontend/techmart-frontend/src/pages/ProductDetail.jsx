import { Link } from "react-router-dom";

export default function ProductCard({ product }) {

  const addToCart = () => {

    let cart =
      JSON.parse(localStorage.getItem("cart")) || [];

    const existing = cart.find(
      (item) => item._id === product._id
    );

    if (existing) {
      existing.quantity += 1;
    } else {
      cart.push({
        ...product,
        quantity: 1,
      });
    }

    localStorage.setItem(
      "cart",
      JSON.stringify(cart)
    );

    alert("✅ Added to cart");
  };

  return (
    <div
      style={{
        border: "1px solid #ddd",
        borderRadius: "12px",
        padding: "20px",
        background: "#fff",
        boxShadow: "0 2px 10px rgba(0,0,0,0.08)",
      }}
    >

      <img
        src={
          product.images &&
          product.images.length > 0
            ? product.images[0]
            : "/600x400.svg"
        }
        alt={product.name}
        style={{
          width: "100%",
          height: "220px",
          objectFit: "cover",
          borderRadius: "10px",
          marginBottom: "15px",
        }}
      />

      <h2
        style={{
          fontSize: "20px",
          marginBottom: "10px",
        }}
      >
        {product.name}
      </h2>

      <p
        style={{
          fontSize: "22px",
          fontWeight: "bold",
          color: "green",
          marginBottom: "15px",
        }}
      >
        ₦{product.price}
      </p>

      <div
        style={{
          display: "flex",
          gap: "10px",
          flexWrap: "wrap",
        }}
      >

        <button
          onClick={addToCart}
          style={{
            padding: "12px 18px",
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

        <Link to={`/product/${product._id}`}>
          <button
            style={{
              padding: "12px 18px",
              background: "green",
              color: "white",
              border: "none",
              borderRadius: "8px",
              cursor: "pointer",
              fontWeight: "bold",
            }}
          >
            View Product
          </button>
        </Link>

        <Link to="/cart">
          <button
            style={{
              padding: "12px 18px",
              background: "#2563eb",
              color: "white",
              border: "none",
              borderRadius: "8px",
              cursor: "pointer",
              fontWeight: "bold",
            }}
          >
            Go To Cart
          </button>
        </Link>

      </div>
    </div>
  );
}
import { Link } from "react-router-dom";

export default function ProductCard({ product }) {
  const addToCart = () => {
    let cart = JSON.parse(localStorage.getItem("cart")) || [];

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
        padding: "20px",
        borderRadius: "10px",
        marginBottom: "20px",
      }}
    >
      <img
        src={
          product.images?.[0] ||
          "https://via.placeholder.com/250"
        }
        alt={product.name}
        style={{
          width: "100%",
          maxWidth: "250px",
          borderRadius: "10px",
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
          onClick={addToCart}
          style={{
            padding: "10px",
            background: "black",
            color: "white",
            border: "none",
            borderRadius: "8px",
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
              borderRadius: "8px",
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
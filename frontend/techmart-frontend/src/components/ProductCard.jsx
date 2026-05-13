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
        padding: "15px",
        borderRadius: "10px",
        width: "250px",
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
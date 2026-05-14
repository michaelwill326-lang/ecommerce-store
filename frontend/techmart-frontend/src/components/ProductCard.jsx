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
        borderRadius: "10px",
        padding: "20px",
        width: "260px",
        background: "#fff",
      }}
    >

      <img
        src={
          product.images?.[0] ||
          "https://via.placeholder.com/400x300?text=TechMart"
        }
        alt={product.name}
        style={{
          width: "100%",
          height: "200px",
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
          flexWrap: "wrap",
          marginTop: "15px",
        }}
      >

        <button
          onClick={addToCart}
          style={{
            background: "black",
            color: "white",
            padding: "10px 15px",
            border: "none",
            borderRadius: "6px",
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
              padding: "10px 15px",
              border: "none",
              borderRadius: "6px",
              cursor: "pointer",
            }}
          >
            View Product
          </button>
        </Link>

        <Link to="/cart">
          <button
            style={{
              background: "orange",
              color: "white",
              padding: "10px 15px",
              border: "none",
              borderRadius: "6px",
              cursor: "pointer",
            }}
          >
            View Cart
          </button>
        </Link>

      </div>
    </div>
  );
}
import { Link } from "react-router-dom";
import { useEffect, useState } from "react";

export default function Cart() {
  const [cart, setCart] = useState([]);

  useEffect(() => {
    const stored =
      JSON.parse(localStorage.getItem("cart")) || [];

    setCart(stored);
  }, []);

  const total = cart.reduce(
    (sum, item) =>
      sum + item.price * item.quantity,
    0
  );

  return (
    <div style={{ padding: "30px" }}>
      <h1>🛒 Cart</h1>

      {cart.map((item) => (
        <div
          key={item._id}
          style={{
            border: "1px solid #ddd",
            padding: "15px",
            marginBottom: "15px",
          }}
        >
          <h3>{item.name}</h3>

          <p>₦{item.price}</p>

          <p>Qty: {item.quantity}</p>
        </div>
      ))}

      <h2>Total: ₦{total}</h2>

      <Link to="/checkout">
        <button
          style={{
            padding: "12px",
            background: "green",
            color: "white",
            border: "none",
            borderRadius: "8px",
          }}
        >
          Proceed To Checkout
        </button>
      </Link>
    </div>
  );
}
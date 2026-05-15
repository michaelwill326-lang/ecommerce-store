import { useEffect, useState } from "react";
import axios from "axios";

const API = "https://techmart-backend-ecbi.onrender.com";

export default function Checkout() {

  const [cart, setCart] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const storedCart =
      JSON.parse(localStorage.getItem("cart")) || [];

    setCart(storedCart);
  }, []);

  const total = cart.reduce(
    (sum, item) =>
      sum + item.price * item.quantity,
    0
  );

  const handlePayment = async () => {

    const token = localStorage.getItem("token");

    if (!token) {
      alert("Please login first");
      window.location.href = "/login";
      return;
    }

    try {

      setLoading(true);

      const user =
        JSON.parse(localStorage.getItem("user"));

      const response = await axios.post(
        `${API}/api/paystack/init`,
        {
          email: user.email,
          amount: total,
          cart,
        }
      );

      window.location.href = response.data.url;

    } catch (err) {
      console.error(err);

      alert("Payment initialization failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ padding: "30px" }}>

      <h1>💳 Checkout</h1>

      {cart.length === 0 ? (
        <h3>Your cart is empty</h3>
      ) : (
        <>
          {cart.map((item) => (
            <div
              key={item._id}
              style={{
                border: "1px solid #ddd",
                padding: "15px",
                marginBottom: "15px",
                borderRadius: "10px",
              }}
            >
              <h3>{item.name}</h3>

              <p>₦{item.price}</p>

              <p>Qty: {item.quantity}</p>
            </div>
          ))}

          <h2>Total: ₦{total}</h2>

          <button
            onClick={handlePayment}
            disabled={loading}
            style={{
              padding: "14px 20px",
              background: "green",
              color: "white",
              border: "none",
              borderRadius: "8px",
              cursor: "pointer",
              marginTop: "20px",
            }}
          >
            {loading
              ? "Processing..."
              : "Proceed To Payment"}
          </button>
        </>
      )}
    </div>
  );
}
import { useState } from "react";
import axios from "axios";

const API = "https://techmart-backend-ecbi.onrender.com";

export default function Checkout() {
  const [loading, setLoading] = useState(false);
  const cart = JSON.parse(localStorage.getItem("cart")) || [];

  const handlePay = async () => {
    if (!cart.length) return alert("Cart is empty");
    setLoading(true);
    try {
      const amount = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);
      const email = localStorage.getItem("userEmail"); // user must be logged in
      if (!email) return alert("Please login or signup first");

      const res = await axios.post(`${API}/api/paystack/init`, { email, amount, cart });
      window.location.href = res.data.url; // redirect to Paystack payment
    } catch (err) {
      console.error(err);
      alert("Payment initiation failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ padding: 30 }}>
      <h1>Checkout</h1>
      <button onClick={handlePay} disabled={loading} style={{ padding: 12, background: "blue", color: "white", border: "none", borderRadius: 8, cursor: "pointer" }}>
        {loading ? "Processing..." : "Pay Now"}
      </button>
    </div>
  );
}
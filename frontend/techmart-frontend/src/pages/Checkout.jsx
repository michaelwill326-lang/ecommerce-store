import { useEffect, useState } from "react";
import axios from "axios";

const API = import.meta.env.VITE_API_URL || "https://techmart-backend-ecbi.onrender.com";

export default function Checkout() {
  const [cart, setCart] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setCart(JSON.parse(localStorage.getItem("cart")) || []);
  }, []);

  const total = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);

  const handlePayment = async () => {
    const token = localStorage.getItem("token");
    if (!token) {
      alert("Please login first");
      window.location.href = "/login";
      return;
    }

    try {
      setLoading(true);
      const user = JSON.parse(localStorage.getItem("user"));
      const res = await axios.post(`${API}/api/paystack/init`, {
        email: user.email,
        amount: total,
        cart,
      });
      window.location.href = res.data.url;
    } catch (err) {
      console.error(err);
      alert("Payment failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ padding: "30px" }}>
      <h1>Checkout</h1>
      {cart.map(item => (
        <div key={item._id}>
          <h3>{item.name}</h3>
          <p>₦{item.price} x {item.quantity}</p>
        </div>
      ))}
      <h2>Total: ₦{total}</h2>
      <button onClick={handlePayment} disabled={loading}>
        {loading ? "Processing..." : "Proceed To Payment"}
      </button>
    </div>
  );
}
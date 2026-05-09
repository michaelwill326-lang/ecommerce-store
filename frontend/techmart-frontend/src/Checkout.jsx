import { useCart } from "../context/CartContext";
import { useState } from "react";

const API = import.meta.env.VITE_API_URL;

export default function Checkout() {
  const { cart, clearCart, total } = useCart();
  const [loading, setLoading] = useState(false);

  const handlePaystack = async () => {
    setLoading(true);

    try {
      const res = await fetch(`${API}/api/paystack/init`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: "customer@example.com", // Replace with real user email from auth
          amount: total,
          cart
        })
      });
      const data = await res.json();
      if (data.url) {
        window.location.href = data.url; // redirect to Paystack checkout
      }
    } catch (err) {
      console.error(err);
      alert("Payment initialization failed");
      setLoading(false);
    }
  };

  return (
    <div className="checkout-container">
      <div className="checkout-form">
        <h2>Order Summary</h2>
        {cart.length === 0 ? (
          <p>Cart is empty</p>
        ) : (
          cart.map((item, i) => (
            <div key={i}>
              <h4>{item.name}</h4>
              <p>₦{item.price}</p>
            </div>
          ))
        )}
        <h3>Total: ₦{total}</h3>
        <button className="pay-btn" onClick={handlePaystack} disabled={loading}>
          {loading ? "Processing..." : "Pay with Paystack"}
        </button>
      </div>
    </div>
  );
}
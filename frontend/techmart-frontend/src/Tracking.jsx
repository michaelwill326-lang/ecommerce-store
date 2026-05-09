import { useState } from "react";

const API = import.meta.env.VITE_API_URL;

export default function Tracking() {
  const [reference, setReference] = useState("");
  const [order, setOrder] = useState(null);

  const trackOrder = async () => {
    try {
      const res = await fetch(`${API}/api/paystack/verify/${reference}`);
      const data = await res.json();

      setOrder(data);
    } catch {
      alert("Tracking failed");
    }
  };

  return (
    <div className="container">
      <h1>Track Your Order</h1>

      <input
        type="text"
        placeholder="Enter payment reference"
        value={reference}
        onChange={(e) => setReference(e.target.value)}
      />

      <button onClick={trackOrder}>
        Track
      </button>

      {order && (
        <div className="product-card" style={{ marginTop: "20px" }}>
          <h3>Status: {order.status}</h3>
          <p>Reference: {order.reference}</p>
          <p>Amount: ₦{order.amount / 100}</p>
        </div>
      )}
    </div>
  );
}
import { Link } from "react-router-dom";

export default function Success() {
  return (
    <div
      style={{
        padding: "40px",
        textAlign: "center",
      }}
    >
      <h1>✅ Payment Successful</h1>

      <p>
        Thank you for shopping on TechMart.
      </p>

      <Link to="/">
        <button
          style={{
            marginTop: "20px",
            padding: "12px 20px",
            background: "green",
            color: "white",
            border: "none",
            borderRadius: "8px",
            cursor: "pointer",
          }}
        >
          Continue Shopping
        </button>
      </Link>
    </div>
  );
}
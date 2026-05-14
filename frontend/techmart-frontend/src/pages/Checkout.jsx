import { Link } from "react-router-dom";

export default function Checkout() {
  const token = localStorage.getItem("token");

  return (
    <div style={{ padding: "30px" }}>
      <h1>💳 Checkout</h1>

      {!token ? (
        <>
          <p>You must login first.</p>

          <Link to="/login">
            <button
              style={{
                padding: "12px",
                background: "black",
                color: "white",
                border: "none",
                borderRadius: "8px",
              }}
            >
              Login / Create Account
            </button>
          </Link>
        </>
      ) : (
        <button
          style={{
            padding: "12px",
            background: "green",
            color: "white",
            border: "none",
            borderRadius: "8px",
          }}
        >
          Proceed To Payment
        </button>
      )}
    </div>
  );
}
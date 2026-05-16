import { Link } from "react-router-dom";

export default function Checkout() {

  const token =
    localStorage.getItem("token");

  return (
    <div style={{ padding: "30px" }}>

      <h1>💳 Checkout</h1>

      {!token ? (
        <>
          <p>
            Please login or create account
            first.
          </p>

          <Link to="/login">
            <button
              style={{
                background: "black",
                color: "white",
                border: "none",
                padding: "14px 20px",
                borderRadius: "8px",
                cursor: "pointer",
              }}
            >
              Signup / Login
            </button>
          </Link>
        </>
      ) : (
        <button
          style={{
            background: "green",
            color: "white",
            border: "none",
            padding: "14px 20px",
            borderRadius: "8px",
            cursor: "pointer",
          }}
        >
          Proceed To Payment
        </button>
      )}
    </div>
  );
}
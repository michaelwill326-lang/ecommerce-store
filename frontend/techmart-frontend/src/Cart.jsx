import { useEffect, useState } from "react";
import { Link } from "react-router-dom";

export default function Cart() {

  const [cart, setCart] =
    useState([]);

  useEffect(() => {

    const stored =
      JSON.parse(
        localStorage.getItem("cart")
      ) || [];

    setCart(stored);

  }, []);

  const removeItem = (id) => {

    const updated =
      cart.filter(
        (item) => item._id !== id
      );

    setCart(updated);

    localStorage.setItem(
      "cart",
      JSON.stringify(updated)
    );
  };

  const total = cart.reduce(
    (sum, item) =>
      sum + item.price * item.quantity,
    0
  );

  return (
    <div style={{ padding: "30px" }}>

      <h1>🛒 Cart</h1>

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

              <p>
                Quantity:
                {item.quantity}
              </p>

              <button
                onClick={() =>
                  removeItem(item._id)
                }
                style={{
                  background: "red",
                  color: "white",
                  border: "none",
                  padding: "10px",
                  borderRadius: "6px",
                }}
              >
                Remove
              </button>

            </div>
          ))}

          <h2>
            Total: ₦{total}
          </h2>

          <Link to="/checkout">
            <button
              style={{
                padding: "12px 20px",
                background: "green",
                color: "white",
                border: "none",
                borderRadius: "8px",
              }}
            >
              Proceed To Checkout
            </button>
          </Link>
        </>
      )}

    </div>
  );
}
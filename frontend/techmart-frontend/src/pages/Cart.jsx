import { useEffect, useState } from "react";
import { Link } from "react-router-dom";

export default function Cart() {

  const [cart, setCart] = useState([]);

  useEffect(() => {

    const savedCart =
      JSON.parse(localStorage.getItem("cart")) || [];

    setCart(savedCart);

  }, []);

  const removeItem = (id) => {

    const updatedCart = cart.filter(
      (item) => item._id !== id
    );

    setCart(updatedCart);

    localStorage.setItem(
      "cart",
      JSON.stringify(updatedCart)
    );

    alert("❌ Item removed from cart");
  };

  const clearCart = () => {

    localStorage.removeItem("cart");

    setCart([]);

    alert("🗑️ Cart cleared");
  };

  const total = cart.reduce(
    (sum, item) =>
      sum + item.price * item.quantity,
    0
  );

  return (
    <div
      style={{
        padding: "30px",
        maxWidth: "1000px",
        margin: "auto",
      }}
    >

      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: "30px",
        }}
      >

        <h1>🛒 Shopping Cart</h1>

        <Link to="/">
          <button
            style={{
              padding: "10px 15px",
              background: "black",
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

      {cart.length === 0 ? (

        <div
          style={{
            textAlign: "center",
            padding: "50px",
          }}
        >
          <h2>Your cart is empty</h2>

          <Link to="/">
            <button
              style={{
                marginTop: "20px",
                padding: "14px 20px",
                background: "green",
                color: "white",
                border: "none",
                borderRadius: "8px",
                cursor: "pointer",
              }}
            >
              Shop Now
            </button>
          </Link>
        </div>

      ) : (

        <>
          {cart.map((item) => (

            <div
              key={item._id}
              style={{
                border: "1px solid #ddd",
                borderRadius: "10px",
                padding: "20px",
                marginBottom: "20px",
                display: "flex",
                gap: "20px",
                alignItems: "center",
                flexWrap: "wrap",
              }}
            >

              <img
                src={
                  item.images?.[0] ||
                  "/600x400.svg"
                }
                alt={item.name}
                style={{
                  width: "150px",
                  height: "150px",
                  objectFit: "cover",
                  borderRadius: "10px",
                }}
              />

              <div style={{ flex: 1 }}>

                <h2>{item.name}</h2>

                <p
                  style={{
                    color: "green",
                    fontWeight: "bold",
                    fontSize: "20px",
                  }}
                >
                  ₦{item.price}
                </p>

                <p>
                  Quantity: {item.quantity}
                </p>

              </div>

              <button
                onClick={() =>
                  removeItem(item._id)
                }
                style={{
                  padding: "12px 18px",
                  background: "red",
                  color: "white",
                  border: "none",
                  borderRadius: "8px",
                  cursor: "pointer",
                }}
              >
                Remove
              </button>

            </div>

          ))}

          <div
            style={{
              marginTop: "40px",
              padding: "30px",
              border: "1px solid #ddd",
              borderRadius: "10px",
              background: "#f9f9f9",
            }}
          >

            <h2>
              Total: ₦{total.toLocaleString()}
            </h2>

            <div
              style={{
                display: "flex",
                gap: "15px",
                marginTop: "20px",
                flexWrap: "wrap",
              }}
            >

              <button
                onClick={clearCart}
                style={{
                  padding: "14px 20px",
                  background: "black",
                  color: "white",
                  border: "none",
                  borderRadius: "8px",
                  cursor: "pointer",
                }}
              >
                Clear Cart
              </button>

              <Link to="/checkout">
                <button
                  style={{
                    padding: "14px 20px",
                    background: "green",
                    color: "white",
                    border: "none",
                    borderRadius: "8px",
                    cursor: "pointer",
                    fontWeight: "bold",
                  }}
                >
                  Proceed To Payment
                </button>
              </Link>

            </div>

          </div>
        </>
      )}
    </div>
  );
}
import React from "react";

function Cart({
  cart,
  removeFromCart,
  updateQuantity,
  clearCart
}) {

  const total = cart.reduce(
    (sum, item) => sum + item.price * item.quantity,
    0
  );

  return (
    <div style={{ padding: "20px" }}>
      <h2>🛒 Shopping Cart</h2>

      {cart.length === 0 ? (
        <p>Your cart is empty</p>
      ) : (
        <>
          {cart.map((item) => (
            <div
              key={item._id}
              style={{
                border: "1px solid #ddd",
                padding: "15px",
                marginBottom: "10px",
                borderRadius: "10px"
              }}
            >
              <h3>{item.name}</h3>

              <p>₦{item.price}</p>

              <div style={{ display: "flex", gap: "10px", alignItems: "center" }}>
                <button
                  onClick={() =>
                    updateQuantity(item._id, item.quantity - 1)
                  }
                >
                  -
                </button>

                <span>{item.quantity}</span>

                <button
                  onClick={() =>
                    updateQuantity(item._id, item.quantity + 1)
                  }
                >
                  +
                </button>
              </div>

              <button
                style={{
                  marginTop: "10px",
                  background: "red",
                  color: "white",
                  border: "none",
                  padding: "8px 12px",
                  borderRadius: "5px",
                  cursor: "pointer"
                }}
                onClick={() => removeFromCart(item._id)}
              >
                Remove
              </button>
            </div>
          ))}

          <h3>Total: ₦{total}</h3>

          <button
            onClick={clearCart}
            style={{
              background: "black",
              color: "white",
              padding: "10px 15px",
              border: "none",
              borderRadius: "5px",
              cursor: "pointer"
            }}
          >
            Clear Cart
          </button>
        </>
      )}
    </div>
  );
}

export default Cart;
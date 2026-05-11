// src/pages/Cart.jsx

import { useCart } from "../context/CartContext";

export default function Cart() {
  const {
    cart,
    removeFromCart,
    increaseQty,
    decreaseQty,
    totalPrice
  } = useCart();

  if (cart.length === 0) {
    return (
      <div style={{ padding: "20px" }}>
        <h1>Your cart is empty</h1>
      </div>
    );
  }

  return (
    <div style={{ padding: "20px" }}>
      <h1>🛒 Shopping Cart</h1>

      {cart.map((item) => (
        <div
          key={item._id}
          style={{
            border: "1px solid #ccc",
            marginBottom: "15px",
            padding: "15px",
            borderRadius: "8px"
          }}
        >
          <h2>{item.name}</h2>

          <p>₦{item.price}</p>

          <p>Quantity: {item.quantity}</p>

          <div style={{ display: "flex", gap: "10px" }}>
            <button onClick={() => increaseQty(item._id)}>
              +
            </button>

            <button onClick={() => decreaseQty(item._id)}>
              -
            </button>

            <button onClick={() => removeFromCart(item._id)}>
              Remove
            </button>
          </div>
        </div>
      ))}

      <h2>Total: ₦{totalPrice}</h2>

      <button
        style={{
          padding: "12px 20px",
          background: "black",
          color: "white",
          border: "none",
          borderRadius: "8px",
          cursor: "pointer"
        }}
      >
        Checkout
      </button>
    </div>
  );
}
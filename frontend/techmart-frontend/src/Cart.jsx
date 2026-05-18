import { useState, useEffect } from "react";
import { Link } from "react-router-dom";

export default function Cart() {
  const [cart, setCart] = useState([]);

  useEffect(() => {
    setCart(JSON.parse(localStorage.getItem("cart")) || []);
  }, []);

  const removeItem = (id) => {
    const newCart = cart.filter((item) => item._id !== id);
    setCart(newCart);
    localStorage.setItem("cart", JSON.stringify(newCart));
  };

  if (cart.length === 0) return <h2 style={{ padding: "30px" }}>Your cart is empty</h2>;

  const total = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);

  return (
    <div style={{ padding: "30px" }}>
      <h1>🛒 Cart</h1>
      {cart.map(item => (
        <div key={item._id} style={{ border: "1px solid #ddd", padding: "15px", marginBottom: "15px", borderRadius: "10px" }}>
          <h3>{item.name}</h3>
          <p>₦{item.price}</p>
          <p>Qty: {item.quantity}</p>
          <button onClick={() => removeItem(item._id)}>Remove</button>
        </div>
      ))}
      <h2>Total: ₦{total}</h2>
      <Link to="/checkout">
        <button style={{ padding: "12px 20px", background: "green", color: "#fff", borderRadius: "8px", border: "none" }}>
          Proceed To Checkout
        </button>
      </Link>
    </div>
  );
}
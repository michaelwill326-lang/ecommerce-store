import { useEffect, useState } from "react";
import { Link } from "react-router-dom";

export default function Cart() {
  const [cart, setCart] = useState([]);

  useEffect(() => {
    setCart(JSON.parse(localStorage.getItem("cart")) || []);
  }, []);

  const removeItem = (id) => {
    const updated = cart.filter(item => item._id !== id);
    setCart(updated);
    localStorage.setItem("cart", JSON.stringify(updated));
  };

  const total = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);

  return (
    <div style={{ padding: "30px" }}>
      <h1>Cart</h1>
      {cart.length === 0 ? <p>Your cart is empty</p> : null}
      {cart.map(item => (
        <div key={item._id}>
          <h3>{item.name}</h3>
          <p>₦{item.price} x {item.quantity}</p>
          <button onClick={() => removeItem(item._id)}>Remove</button>
        </div>
      ))}
      <h2>Total: ₦{total}</h2>
      {cart.length > 0 && <Link to="/checkout"><button>Proceed To Checkout</button></Link>}
    </div>
  );
}
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

export default function Cart() {
  const [cart, setCart] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    setCart(JSON.parse(localStorage.getItem("cart")) || []);
  }, []);

  const removeItem = (id) => {
    const newCart = cart.filter((item) => item._id !== id);
    setCart(newCart);
    localStorage.setItem("cart", JSON.stringify(newCart));
  };

  const total = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);

  return (
    <div style={{ padding: "30px" }}>
      <h1>🛒 Cart</h1>
      {cart.length === 0 ? (
        <h3>Your cart is empty</h3>
      ) : (
        <>
          {cart.map((item) => (
            <div key={item._id} style={{ border: "1px solid #ddd", padding: "15px", marginBottom: "10px", borderRadius: "10px" }}>
              <h3>{item.name}</h3>
              <p>₦{item.price}</p>
              <p>Qty: {item.quantity}</p>
              <button
                onClick={() => removeItem(item._id)}
                style={{ padding: "5px 10px", background: "red", color: "#fff", border: "none", borderRadius: "5px", cursor: "pointer" }}
              >
                Remove
              </button>
            </div>
          ))}
          <h2>Total: ₦{total}</h2>
          <button
            onClick={() => navigate("/checkout")}
            style={{ padding: "14px 20px", background: "green", color: "white", border: "none", borderRadius: "8px", cursor: "pointer", marginTop: "20px" }}
          >
            Proceed To Checkout
          </button>
        </>
      )}
    </div>
  );
}
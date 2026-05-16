import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

export default function Cart() {
  const [cart, setCart] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    setCart(JSON.parse(localStorage.getItem("cart")) || []);
  }, []);

  const removeItem = (id) => {
    const updated = cart.filter((item) => item._id !== id);
    setCart(updated);
    localStorage.setItem("cart", JSON.stringify(updated));
  };

  const proceedToCheckout = () => {
    navigate("/checkout");
  };

  if (!cart.length) return <h2 style={{ padding: 30 }}>Cart is empty</h2>;

  return (
    <div style={{ padding: 30 }}>
      {cart.map((item) => (
        <div key={item._id} style={{ display: "flex", justifyContent: "space-between", marginBottom: 15 }}>
          <span>{item.name} x {item.quantity}</span>
          <button onClick={() => removeItem(item._id)} style={{ background: "red", color: "#fff", border: "none", borderRadius: 5, padding: "5px 10px" }}>
            Remove
          </button>
        </div>
      ))}
      <button onClick={proceedToCheckout} style={{ padding: 12, background: "green", color: "white", border: "none", borderRadius: 8, cursor: "pointer", marginTop: 20 }}>
        Proceed to Checkout
      </button>
    </div>
  );
}
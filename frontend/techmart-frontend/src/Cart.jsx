import { useContext } from "react";
import { CartContext } from "../context/CartContext";

export default function Cart() {
  const { cart, setCart } = useContext(CartContext);

  const removeItem = (id) => {
    const updated = cart.filter(item => item._id !== id);
    setCart(updated);
    localStorage.setItem("cart", JSON.stringify(updated));
  };

  const changeQty = (id, qty) => {
    const updated = cart.map(item => item._id === id ? { ...item, quantity: qty } : item);
    setCart(updated);
    localStorage.setItem("cart", JSON.stringify(updated));
  };

  const total = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);

  if (cart.length === 0) return <div style={{ padding: "30px" }}><h2>Your cart is empty</h2></div>;

  return (
    <div style={{ padding: "30px" }}>
      <h1>Your Cart</h1>
      {cart.map(item => (
        <div key={item._id} style={{ borderBottom: "1px solid #ccc", padding: "10px 0" }}>
          <h3>{item.name}</h3>
          <p>₦{item.price} × 
            <input type="number" min="1" value={item.quantity} onChange={(e) => changeQty(item._id, parseInt(e.target.value))} style={{ width:"50px", marginLeft:"5px" }} />
          </p>
          <button onClick={() => removeItem(item._id)} style={{ padding:"5px 10px", background:"red", color:"#fff", border:"none", borderRadius:"5px" }}>Remove</button>
        </div>
      ))}
      <h2>Total: ₦{total}</h2>
    </div>
  );
}
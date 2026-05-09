import { useEffect, useState } from "react";

export default function Cart() {
  const [cart, setCart] = useState([]);

  useEffect(() => {
    const saved = JSON.parse(localStorage.getItem("cart")) || [];
    setCart(saved);
  }, []);

  function removeItem(i) {
    let updated = [...cart];
    updated.splice(i, 1);
    setCart(updated);
    localStorage.setItem("cart", JSON.stringify(updated));
  }

  const total = cart.reduce((sum, item) => sum + item.price, 0);

  return (
    <div>
      <h1>Cart</h1>

      {cart.map((item, i) => (
        <div key={i}>
          <p>{item.name} - ₦{item.price}</p>
          <button onClick={() => removeItem(i)}>Remove</button>
        </div>
      ))}

      <h2>Total: ₦{total}</h2>
    </div>
  );
}
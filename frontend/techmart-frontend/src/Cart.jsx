import { useCart } from "../context/CartContext";

export default function Cart() {
  const { cart, removeFromCart } = useCart();

  return (
    <div className="container">
      <h1>Your Cart</h1>
      {cart.length === 0 ? (
        <p>Cart is empty</p>
      ) : (
        cart.map((item, i) => (
          <div key={i} className="product-card">
            <h3>{item.name}</h3>
            <p>₦{item.price}</p>
            <button onClick={() => removeFromCart(i)}>Remove</button>
          </div>
        ))
      )}
    </div>
  );
}
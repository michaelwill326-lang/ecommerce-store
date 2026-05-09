import { useCart } from "../context/CartContext";

export default function Checkout() {
  const { cart, total } = useCart();

  const handlePay = async () => {
    const res = await fetch(`${import.meta.env.VITE_API_URL}/api/paystack/init`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        email: "customer@email.com",
        amount: total,
        cart
      })
    });

    const data = await res.json();

    if (data.url) {
      window.location.href = data.url;
    }
  };

  return (
    <div className="checkout-container">
      <h1>Checkout</h1>

      <div className="checkout-summary">
        <h2>Total: ₦{total}</h2>

        <button className="pay-btn" onClick={handlePay}>
          Pay with Paystack
        </button>
      </div>
    </div>
  );
}
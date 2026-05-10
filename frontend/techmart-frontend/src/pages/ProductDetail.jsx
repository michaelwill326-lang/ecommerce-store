import { useLocation } from "react-router-dom";
import { useCart } from "../context/CartContext";

export default function ProductDetail() {
  const { state } = useLocation();
  const { addToCart } = useCart();

  const product = state;

  if (!product) return <h2>Product not found</h2>;

  return (
    <div className="container">
      <img
        src={product.images?.[0]}
        alt={product.name}
        style={{ width: "300px" }}
      />

      <h1>{product.name}</h1>

      <p>{product.description}</p>

      <h2>₦{product.price}</h2>

      <button onClick={() => addToCart(product)}>
        Add To Cart
      </button>
    </div>
  );
}
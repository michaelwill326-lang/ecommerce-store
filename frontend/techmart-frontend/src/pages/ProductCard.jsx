import { Link } from "react-router-dom";

export default function ProductCard({ product }) {
  return (
    <div style={{ border: "1px solid #ccc", padding: "15px", width: "200px", borderRadius: "8px" }}>
      <Link to={`/product/${product._id}`}>
        <img src={product.images?.[0] || "https://via.placeholder.com/150"} alt={product.name} style={{ width: "100%" }} />
        <h3>{product.name}</h3>
        <p>₦{product.price}</p>
      </Link>
    </div>
  );
}
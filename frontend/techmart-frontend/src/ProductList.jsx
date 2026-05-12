import React from "react";
import { Link } from "react-router-dom";

const ProductList = ({ products }) => {
  if (!products || products.length === 0) return <p>No products available</p>;

  return (
    <div className="product-list" style={{ display: "flex", flexWrap: "wrap", gap: "20px" }}>
      {products.map((product) => (
        <div
          key={product._id}
          className="product-card"
          style={{ border: "1px solid #ccc", padding: "10px", width: "200px" }}
        >
          <Link to={`/product/${product._id}`}>
            <img
              src={product.images?.[0]}
              alt={product.name}
              style={{ width: "100%", height: "150px", objectFit: "cover" }}
            />
            <h3>{product.name}</h3>
          </Link>
          <p>₦{product.price}</p>
        </div>
      ))}
    </div>
  );
};

export default ProductList;
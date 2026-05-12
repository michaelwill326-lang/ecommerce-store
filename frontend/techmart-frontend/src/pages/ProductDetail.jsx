import React, { useEffect, useState, useContext } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axios from "axios";
import { CartContext } from "../context/CartContext";

const ProductDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { addToCart } = useContext(CartContext);

  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchProduct() {
      try {
        const res = await axios.get(`${import.meta.env.VITE_API_URL}/api/products/${id}`);
        setProduct(res.data);
      } catch (err) {
        console.error("Failed to fetch product:", err);
      } finally {
        setLoading(false);
      }
    }

    fetchProduct();
  }, [id]);

  if (loading) return <p>Loading product...</p>;
  if (!product) return <p>Product not found</p>;

  return (
    <div className="product-detail">
      <h1>{product.name}</h1>
      <img src={product.images?.[0]} alt={product.name} width={300} />
      <p>{product.description}</p>
      <p>Price: ₦{product.price}</p>
      <p>Stock: {product.stock}</p>

      <button
        onClick={() => {
          addToCart(product);
          navigate("/cart");
        }}
      >
        Add to Cart
      </button>
    </div>
  );
};

export default ProductDetail;
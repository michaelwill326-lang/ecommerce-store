import { useEffect, useState } from "react";
import { Link } from "react-router-dom";

export default function Recommendations({ currentProduct }) {
  const [products, setProducts] = useState([]);

  useEffect(() => {
    fetch(`${import.meta.env.VITE_API_URL || "https://techmart-backend-ecbi.onrender.com"}/api/products`)
      .then(res => res.json())
      .then(data => {

        const related = data
          .filter(p => p._id !== currentProduct._id)
          .filter(p =>
            p.name.toLowerCase().includes(
              currentProduct.name.split(" ")[0].toLowerCase()
            ) ||
            Math.abs(p.price - currentProduct.price) < 5000
          )
          .slice(0, 4);

        setProducts(related);
      });
  }, [currentProduct]);

  return (
    <div className="recommend">

      <h3>🧠 Customers also bought</h3>

      <div className="grid">
        {products.map(p => (
          <Link key={p._id} to={`/product/${p._id}`} className="card">
            <img src={p.images?.[0]} />
            <p>{p.name}</p>
            <p>₦{p.price}</p>
          </Link>
        ))}
      </div>

    </div>
  );
}
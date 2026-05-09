import { useEffect, useState } from "react";
import { Link } from "react-router-dom";

export default function Home() {
  const [products, setProducts] = useState([]);
  const [trending, setTrending] = useState([]);

  useEffect(() => {
    fetch(`${import.meta.env.VITE_API_URL}/api/products`)
      .then(res => res.json())
      .then(data => {
        setProducts(data);

        const sorted = data
          .sort((a, b) => (b.reviews?.length || 0) - (a.reviews?.length || 0))
          .slice(0, 6);

        setTrending(sorted);
      });
  }, []);

  const recent = JSON.parse(localStorage.getItem("recent")) || [];

  return (
    <div className="container">

      {/* 🔥 TRENDING */}
      <h2>🔥 Trending</h2>
      <div className="grid">
        {trending.map(p => (
          <Link key={p._id} to={`/product/${p._id}`} className="card">
            <img src={p.images?.[0]} />
            <p>{p.name}</p>
            <p>₦{p.price}</p>
          </Link>
        ))}
      </div>

      {/* 🛍 ALL PRODUCTS */}
      <h2>🛍 Products</h2>
      <div className="grid">
        {products.map(p => (
          <Link key={p._id} to={`/product/${p._id}`} className="card">
            <img src={p.images?.[0]} />
            <p>{p.name}</p>
            <p>₦{p.price}</p>
          </Link>
        ))}
      </div>

      {/* 👀 RECENTLY VIEWED */}
      {recent.length > 0 && (
        <>
          <h2>👀 Recently Viewed</h2>
          <div className="grid">
            {recent.map(p => (
              <Link key={p._id} to={`/product/${p._id}`} className="card">
                <img src={p.images?.[0]} />
                <p>{p.name}</p>
                <p>₦{p.price}</p>
              </Link>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
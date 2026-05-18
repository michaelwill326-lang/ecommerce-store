import { useEffect, useState } from "react";

export default function Dashboard() {
  const [products, setProducts] = useState([]);

  useEffect(() => {
    fetchProducts();
  }, []);

  const fetchProducts = async () => {
    try {
      const res = await axios.get(`${API}/api/products`);
      console.log("PRODUCTS:", res.data);
      setProducts(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div style={{ padding: "30px" }}>

      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: "30px",
        }}
      >
        <h1>🛒 TechMart</h1>

        <div style={{ display: "flex", gap: "10px" }}>
          <Link to="/cart">
            <button>
              Cart
            </button>
          </Link>

          <Link to="/login">
            <button>
              Login
            </button>
          </Link>

          <Link to="/signup">
            <button>
              Signup
            </button>
          </Link>
        </div>
      </div>

      <div
        style={{
          display: "grid",
          gridTemplateColumns:
            "repeat(auto-fit,minmax(250px,1fr))",
          gap: "20px",
        }}
      >
        {products.map((product) => (
          <ProductCard
            key={product._id}
            product={product}
          />
        ))}
      </div>
    </div>
  );
}
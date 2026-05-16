import { BrowserRouter, Routes, Route, Link } from "react-router-dom";

import Dashboard from "./pages/Dashboard";
import ProductDetail from "./pages/ProductDetail";
import Cart from "./pages/Cart";
import Checkout from "./pages/Checkout";
import Login from "./pages/Login";

export default function App() {
  const cart =
    JSON.parse(localStorage.getItem("cart")) || [];

  const user =
    JSON.parse(localStorage.getItem("user"));

  const totalItems = cart.reduce(
    (sum, item) => sum + item.quantity,
    0
  );

  const logout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");

    alert("Logged out");

    window.location.href = "/";
  };

  return (
    <BrowserRouter>

      {/* NAVBAR */}
      <nav
        style={{
          background: "#111",
          color: "#fff",
          padding: "15px 25px",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          flexWrap: "wrap",
        }}
      >
        <Link
          to="/"
          style={{
            color: "#fff",
            textDecoration: "none",
            fontSize: "24px",
            fontWeight: "bold",
          }}
        >
          🛒 TechMart
        </Link>

        <div
          style={{
            display: "flex",
            gap: "15px",
            alignItems: "center",
          }}
        >
          <Link
            to="/"
            style={{
              color: "#fff",
              textDecoration: "none",
            }}
          >
            Home
          </Link>

          <Link
            to="/cart"
            style={{
              color: "#fff",
              textDecoration: "none",
            }}
          >
            Cart ({totalItems})
          </Link>

          {user ? (
            <>
              <span>
                👋 {user.name}
              </span>

              <button
                onClick={logout}
                style={{
                  background: "red",
                  color: "#fff",
                  border: "none",
                  padding: "8px 12px",
                  borderRadius: "5px",
                  cursor: "pointer",
                }}
              >
                Logout
              </button>
            </>
          ) : (
            <Link
              to="/login"
              style={{
                color: "#fff",
                textDecoration: "none",
              }}
            >
              Login / Signup
            </Link>
          )}
        </div>
      </nav>

      {/* ROUTES */}
      <Routes>

        <Route
          path="/"
          element={<Dashboard />}
        />

        <Route
          path="/product/:id"
          element={<ProductDetail />}
        />

        <Route
          path="/cart"
          element={<Cart />}
        />

        <Route
          path="/checkout"
          element={<Checkout />}
        />

        <Route
          path="/login"
          element={<Login />}
        />

      </Routes>
    </BrowserRouter>
  );
}
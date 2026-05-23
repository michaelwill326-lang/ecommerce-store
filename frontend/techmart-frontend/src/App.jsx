import { BrowserRouter, Routes, Route } from "react-router-dom";
import { useState, useEffect } from "react";

import Dashboard from "./pages/Dashboard";
import ProductDetail from "./pages/ProductDetail";
import Cart from "./pages/Cart";
import Checkout from "./pages/Checkout";
import Login from "./pages/Login";
import Signup from "./pages/Signup";
import Success from "./pages/Success";

import Chatbot from "./components/Chatbot";
import Navbar from "./components/Navbar";

export default function App() {

  /* =========================
     🛒 CART STATE
  ========================= */
  const [cart, setCart] = useState(() => {
    const savedCart = localStorage.getItem("techmart-cart");
    return savedCart ? JSON.parse(savedCart) : [];
  });

  /* =========================
     💾 SAVE CART
  ========================= */
  useEffect(() => {
    localStorage.setItem("techmart-cart", JSON.stringify(cart));
  }, [cart]);

  /* =========================
     ➕ ADD TO CART
  ========================= */
  const addToCart = (product) => {
    setCart((prev) => {

      const existing = prev.find(
        (item) => item._id === product._id
      );

      if (existing) {
        return prev.map((item) =>
          item._id === product._id
            ? { ...item, quantity: item.quantity + 1 }
            : item
        );
      }

      return [...prev, { ...product, quantity: 1 }];
    });
  };

  /* =========================
     ❌ REMOVE ITEM
  ========================= */
  const removeFromCart = (id) => {
    setCart((prev) =>
      prev.filter((item) => item._id !== id)
    );
  };

  /* =========================
     🔢 UPDATE QUANTITY
  ========================= */
  const updateQuantity = (id, quantity) => {

    if (quantity <= 0) {
      removeFromCart(id);
      return;
    }

    setCart((prev) =>
      prev.map((item) =>
        item._id === id
          ? { ...item, quantity }
          : item
      )
    );
  };

  /* =========================
     🧹 CLEAR CART
  ========================= */
  const clearCart = () => {
    setCart([]);
  };

  return (
    <BrowserRouter>

      <Navbar cart={cart} />

      <Routes>

        <Route
          path="/"
          element={
            <Dashboard
              addToCart={addToCart}
            />
          }
        />

        <Route
          path="/product/:id"
          element={
            <ProductDetail
              addToCart={addToCart}
            />
          }
        />

        <Route
          path="/cart"
          element={
            <Cart
              cart={cart}
              removeFromCart={removeFromCart}
              updateQuantity={updateQuantity}
            />
          }
        />

        <Route
          path="/checkout"
          element={
            <Checkout
              cart={cart}
              clearCart={clearCart}
            />
          }
        />

        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<Signup />} />
        <Route path="/success" element={<Success />} />

      </Routes>

      <Chatbot />

    </BrowserRouter>
  );
}
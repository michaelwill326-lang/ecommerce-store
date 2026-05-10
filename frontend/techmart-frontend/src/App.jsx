// src/App.jsx
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { Suspense, lazy } from "react";

import Navbar from "./components/Navbar";
import LiveNotification from "./components/LiveNotification";

// Regular pages
import Home from "./pages/Home";
import Cart from "./pages/Cart";
import Checkout from "./pages/Checkout";
import Signup from "./pages/Signup";
import Verify from "./pages/Verify";
import Tracking from "./pages/Tracking";

// Lazy-loaded heavy pages
const Dashboard = lazy(() => import("./pages/Dashboard"));
const Admin = lazy(() => import("./pages/Admin"));
const ProductDetail = lazy(() => import("./pages/ProductDetail"));

export default function App() {
  return (
    <BrowserRouter>
      {/* Navbar and Live Notifications */}
      <Navbar />
      <LiveNotification />

      {/* Suspense wraps lazy-loaded pages */}
      <Suspense fallback={<div style={{ padding: 20 }}>Loading...</div>}>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/cart" element={<Cart />} />
          <Route path="/checkout" element={<Checkout />} />
          <Route path="/signup" element={<Signup />} />
          <Route path="/verify" element={<Verify />} />
          <Route path="/tracking" element={<Tracking />} />

          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/admin" element={<Admin />} />
          <Route path="/product/:id" element={<ProductDetail />} />

          {/* Optional: Catch-all 404 page */}
          <Route path="*" element={<div style={{ padding: 20 }}>Page Not Found</div>} />
        </Routes>
      </Suspense>
    </BrowserRouter>
  );
}
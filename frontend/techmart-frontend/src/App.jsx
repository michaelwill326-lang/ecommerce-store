// src/App.jsx
import { BrowserRouter, Routes, Route } from "react-router-dom";

// Contexts
import { CartProvider } from "./context/CartContext";
import { WishlistProvider } from "./context/WishlistContext";

// Pages
import Home from "./pages/Home";
import Cart from "./pages/Cart";
import Checkout from "./pages/Checkout";
import Verify from "./pages/Verify";
import Tracking from "./pages/Tracking";
import Signup from "./pages/Signup";
import Dashboard from "./pages/Dashboard";
import Admin from "./pages/Admin";
import ProductDetail from "./pages/ProductDetail";

// Components
import LiveNotification from "./components/LiveNotification";

export default function App() {
  return (
    <CartProvider>
      <WishlistProvider>
        <BrowserRouter>
          {/* Live notifications for orders */}
          <LiveNotification />

          <Routes>
            {/* Public pages */}
            <Route path="/" element={<Home />} />
            <Route path="/cart" element={<Cart />} />
            <Route path="/checkout" element={<Checkout />} />
            <Route path="/verify" element={<Verify />} />
            <Route path="/tracking" element={<Tracking />} />
            <Route path="/signup" element={<Signup />} />
            <Route path="/product/:id" element={<ProductDetail />} />

            {/* Admin & dashboard pages */}
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/admin" element={<Admin />} />
          </Routes>
        </BrowserRouter>
      </WishlistProvider>
    </CartProvider>
  );
}
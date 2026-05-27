import { Routes, Route } from "react-router-dom";
import Navbar from "./components/Navbar"; 
import Chatbot from "./components/Chatbot";

// Import your exact pages based on your directory listing
import Home from "./pages/Home";
import Login from "./pages/Login";
import Signup from "./pages/Signup";
import Cart from "./pages/Cart";
import Checkout from "./pages/Checkout";
import ProductDetail from "./pages/ProductDetail";
import Dashboard from "./pages/Dashboard";
import Admin from "./pages/Admin";
import Tracking from "./pages/Tracking";
import Verify from "./pages/Verify";
import Success from "./pages/Success";
import Wishlist from "./pages/Wishlist";
import Policy from "./pages/Policy";

export default function App() {
  return (
    <div style={styles.appContainer}>
      {/* Navigation Bar across all views */}
      <Navbar />

      {/* Main Routing Architecture */}
      <main style={styles.mainContent}>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<Signup />} />
          <Route path="/cart" element={<Cart />} />
          <Route path="/checkout" element={<Checkout />} />
          <Route path="/product/:id" element={<ProductDetail />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/admin" element={<Admin />} />
          <Route path="/tracking" element={<Tracking />} />
          <Route path="/verify" element={<Verify />} />
          <Route path="/success" element={<Success />} />
          <Route path="/wishlist" element={<Wishlist />} />
          <Route path="/policy" element={<Policy />} />
        </Routes>
      </main>

      {/* 🤖 GLOBAL AI CHATBOT SYSTEM */}
      <Chatbot />
    </div>
  );
}

const styles = {
  appContainer: {
    display: "flex",
    flexDirection: "column",
    minHeight: "100vh",
    backgroundColor: "#0a0a0a", 
    color: "#fff",
    fontFamily: "sans-serif",
  },
  mainContent: {
    flex: 1,
  },
};
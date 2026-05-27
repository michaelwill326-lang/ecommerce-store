import { Routes, Route } from "react-router-dom";
import Navbar from "./components/Navbar"; // Adjust paths if your folders are named differently
import Footer from "./components/Footer";
import Chatbot from "./components/Chatbot";

// Import your store pages
import Home from "./pages/Home";
import Products from "./pages/Products";
import ProductDetails from "./pages/ProductDetails";
import Cart from "./pages/Cart";
import Checkout from "./pages/Checkout";

export default function App() {
  return (
    <div style={styles.appContainer}>
      {/* Global Navigation Bar */}
      <Navbar />

      {/* Main Marketplace Content Views */}
      <main style={styles.mainContent}>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/products" element={<Products />} />
          <Route path="/product/:id" element={<ProductDetails />} />
          <Route path="/cart" element={<Cart />} />
          <Route path="/checkout" element={<Checkout />} />
        </Routes>
      </main>

      {/* Global Page Footer */}
      <Footer />

      {/* 🤖 FLOATING AI CHATBOT SYSTEM */}
      <Chatbot />
    </div>
  );
}

// Simple base styles to ensure footer sits at the bottom and layout stays crisp
const styles = {
  appContainer: {
    display: "flex",
    flexDirection: "column",
    minHeight: "100vh",
    backgroundColor: "#0a0a0a", // Matches your dark theme setup
    color: "#fff",
  },
  mainContent: {
    flex: 1,
  },
};
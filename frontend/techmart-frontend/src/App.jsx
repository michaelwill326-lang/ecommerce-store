import { Routes, Route } from "react-router-dom";
import { useEffect } from "react";
import Navbar from "./components/Navbar"; 
import Footer from "./components/Footer"; // Imported here
import Chatbot from "./components/Chatbot";

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
  useEffect(() => {
    let timer;
    const resetTimer = () => {
      clearTimeout(timer);
      timer = setTimeout(() => {
        localStorage.removeItem("token");
        localStorage.removeItem("user");
        window.location.href = "/login";
      }, 5 * 60 * 1000);
    };
    const events = ["mousemove", "keydown", "click", "scroll", "touchstart"];
    events.forEach((e) => window.addEventListener(e, resetTimer));
    resetTimer();
    return () => {
      clearTimeout(timer);
      events.forEach((e) => window.removeEventListener(e, resetTimer));
    };
  }, []);
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

      {/* Professional Legal Footer */}
      <Footer />

      {/* 🤖 GLOBAL AI CHATBOT SYSTEM */}
      <Chatbot />
    {/* 💬 WHATSAPP FLOATING BUTTON */}
    <a href="https://wa.me/2349032657217" target="_blank" rel="noopener noreferrer" title="Chat with us on WhatsApp" style={{position:"fixed",bottom:"90px",left:"24px",width:"56px",height:"56px",borderRadius:"50%",background:"#25D366",display:"flex",alignItems:"center",justifyContent:"center",boxShadow:"0 4px 20px rgba(37,211,102,0.5)",zIndex:9999,textDecoration:"none"}}>
      <img src="https://upload.wikimedia.org/wikipedia/commons/6/6b/WhatsApp.svg" alt="WhatsApp" style={{width:"32px",height:"32px"}} />
    </a>
    </div>
  );
}

const styles = {
  appContainer: {
    display: "flex",
    flexDirection: "column",
    minHeight: "100vh",
    backgroundColor: "#0a0a0a",
    overflowX: "hidden", 
    color: "#fff",
    fontFamily: "sans-serif",
  },
  mainContent: {
    flex: 1,
  },
};
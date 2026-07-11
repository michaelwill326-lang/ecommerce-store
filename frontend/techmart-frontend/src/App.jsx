import { Routes, Route } from "react-router-dom";
import { useEffect, Suspense, lazy, useState, createContext, useContext } from "react";

export const ToastContext = createContext(null);
export function useToast() { return useContext(ToastContext); }

// Register service worker
if ("serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    navigator.serviceWorker.register("/sw.js").then(() => {
      console.log("SW registered");
    }).catch(() => {});
  });
}
import Navbar from "./components/Navbar"; 
import Footer from "./components/Footer";
import Chatbot from "./components/Chatbot";

// Eagerly loaded (above the fold)
import Home from "./pages/Home";
import Login from "./pages/Login";
import Signup from "./pages/Signup";

// Lazy loaded (only when needed)
const Cart = lazy(() => import("./pages/Cart"));
const Checkout = lazy(() => import("./pages/Checkout"));
const ProductDetail = lazy(() => import("./pages/ProductDetail"));
const Dashboard = lazy(() => import("./pages/Dashboard"));
const Admin = lazy(() => import("./pages/Admin"));
const Tracking = lazy(() => import("./pages/Tracking"));
const Verify = lazy(() => import("./pages/Verify"));
const Success = lazy(() => import("./pages/Success"));
const Wishlist = lazy(() => import("./pages/Wishlist"));
const Policy = lazy(() => import("./pages/Policy"));
const ChatPage = lazy(() => import("./pages/ChatPage"));
const SellerApply = lazy(() => import("./pages/seller/SellerApply"));
const Account = lazy(() => import("./pages/Account"));
const AISearch = lazy(() => import("./pages/AISearch"));
const TechMartPay = lazy(() => import("./pages/TechMartPay"));
const SellerLogin = lazy(() => import("./pages/seller/SellerLogin"));
const SellerDashboard = lazy(() => import("./pages/seller/SellerDashboard"));

function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);
  const showToast = (msg, type = "success") => {
    const id = Date.now();
    setToasts(prev => [...prev, { id, msg, type }]);
    setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), 3000);
  };
  return (
    <ToastContext.Provider value={showToast}>
      {children}
      <div style={{ position: "fixed", bottom: "80px", left: "50%", transform: "translateX(-50%)", zIndex: 99999, display: "flex", flexDirection: "column", gap: "8px", alignItems: "center", pointerEvents: "none" }}>
        {toasts.map(t => (
          <div key={t.id} style={{ background: t.type === "error" ? "#dc2626" : t.type === "warning" ? "#f59e0b" : "#22c55e", color: "#fff", padding: "10px 20px", borderRadius: "10px", fontSize: "14px", fontWeight: "700", boxShadow: "0 4px 20px rgba(0,0,0,0.4)", animation: "slideUp 0.3s ease", whiteSpace: "nowrap" }}>
            {t.type === "success" ? "✓ " : t.type === "error" ? "✕ " : "⚠ "}{t.msg}
          </div>
        ))}
      </div>
      <style dangerouslySetInnerHTML={{__html: "@keyframes slideUp{from{opacity:0;transform:translateY(10px)}to{opacity:1;transform:translateY(0)}}"}} />
    </ToastContext.Provider>
  );
}

// Apply saved theme on load
const savedTheme = localStorage.getItem("techmart-theme") || "dark";
document.body.setAttribute("data-theme", savedTheme);

export default function App() {
  useEffect(() => {
    let timer;
    const resetTimer = () => {
      clearTimeout(timer);
      timer = setTimeout(() => {
        localStorage.removeItem("token");  window.dispatchEvent(new StorageEvent("storage", { key: "token", newValue: null }));
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
    <ToastProvider>
    <div style={styles.appContainer}>
      {/* Navigation Bar across all views */}
      <Navbar />

      {/* Main Routing Architecture */}
      <main style={styles.mainContent}>
        <Suspense fallback={<div style={{ minHeight: "60vh", display: "flex", alignItems: "center", justifyContent: "center", color: "#888" }}>Loading...</div>}>
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
          <Route path="/chat" element={<ChatPage />} />
          <Route path="/seller/apply" element={<SellerApply />} />
          <Route path="/account" element={<Account />} />
          <Route path="/ai-search" element={<AISearch />} />
          <Route path="/pay" element={<TechMartPay />} />
          <Route path="/seller/login" element={<SellerLogin />} />
          <Route path="/seller/dashboard" element={<SellerDashboard />} />
        </Routes>
        </Suspense>
      </main>

      {/* Professional Legal Footer */}
      <Footer />

      {/* 🤖 GLOBAL AI CHATBOT SYSTEM */}
      <Chatbot />
    {/* 💬 WHATSAPP FLOATING BUTTON */}
    <a href="https://wa.me/2349032657217" target="_blank" rel="noopener noreferrer" title="Chat with us on WhatsApp" style={{position:"fixed",bottom:"24px",left:"24px",width:"52px",height:"52px",borderRadius:"50%",background:"#25D366",display:"flex",alignItems:"center",justifyContent:"center",boxShadow:"0 4px 20px rgba(37,211,102,0.5)",zIndex:9997,textDecoration:"none"}}>
      <img src="https://upload.wikimedia.org/wikipedia/commons/6/6b/WhatsApp.svg" alt="WhatsApp" style={{width:"32px",height:"32px"}} />
    </a>
    </div>
    </ToastProvider>
  );
}

const styles = {
  appContainer: {
    display: "flex",
    flexDirection: "column",
    minHeight: "100vh",
    backgroundColor: "var(--bg-primary)",
    overflowX: "hidden", 
    color: "#fff",
    fontFamily: "sans-serif",
  },
  mainContent: {
    flex: 1,
  },
};
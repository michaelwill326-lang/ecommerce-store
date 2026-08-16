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
import ErrorBoundary from "./components/ErrorBoundary"; 
import Footer from "./components/Footer";
import Chatbot from "./components/Chatbot";
import BottomNav from "./components/BottomNav";
import CompareBar from "./components/CompareBar";
import Compare from "./pages/Compare";
import LiveNotification from "./components/LiveNotification";

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
const BuyerProtection = lazy(() => import("./pages/BuyerProtection"));
const ChatPage = lazy(() => import("./pages/ChatPage"));
const SellerApply = lazy(() => import("./pages/seller/SellerApply"));
const Account = lazy(() => import("./pages/Account"));
const AISearch = lazy(() => import("./pages/AISearch"));
const TechMartPay = lazy(() => import("./pages/TechMartPay"));
const PayProfile = lazy(() => import("./pages/PayProfile"));
const PayLink = lazy(() => import("./pages/PayLink"));
const Referral = lazy(() => import("./pages/Referral"));
const SellerLogin = lazy(() => import("./pages/seller/SellerLogin"));
const SellerDashboard = lazy(() => import("./pages/seller/SellerDashboard"));

function ToastProvider({ children }) {
  useInactivityLogout(20);
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



// Persistent 20-minute inactivity auto-logout
function useInactivityLogout(minutes = 20) {
  useEffect(() => {
    const INACTIVITY_MS = minutes * 60 * 1000;
    const LAST_ACTIVITY_KEY = "techmart_last_activity";

    let timer = null;

    const getToken = () => localStorage.getItem("token");

    const logoutForInactivity = () => {
      localStorage.removeItem("token");
      localStorage.removeItem("user");
      localStorage.removeItem("deviceToken");
      localStorage.removeItem(LAST_ACTIVITY_KEY);

      // Clear browser-visible cart and wishlist during automatic inactivity logout.
      window.dispatchEvent(
        new StorageEvent("storage", {
          key: "token",
          newValue: null,
        })
      );

      window.dispatchEvent(new Event("techmart-auth-change"));

      window.location.href = "/login?reason=inactive";
    };

    const checkInactivity = () => {
      const token = getToken();

      if (!token) {
        clearTimeout(timer);
        timer = null;
        return;
      }

      const lastActivity = Number(
        localStorage.getItem(LAST_ACTIVITY_KEY)
      );

      // Establish a timestamp for legacy sessions that don't have one.
      if (!lastActivity || Number.isNaN(lastActivity)) {
        const now = Date.now();
        localStorage.setItem(LAST_ACTIVITY_KEY, String(now));

        clearTimeout(timer);
        timer = setTimeout(checkInactivity, INACTIVITY_MS);
        return;
      }

      const elapsed = Date.now() - lastActivity;

      if (elapsed >= INACTIVITY_MS) {
        logoutForInactivity();
        return;
      }

      clearTimeout(timer);
      timer = setTimeout(
        checkInactivity,
        INACTIVITY_MS - elapsed
      );
    };

    const recordActivity = () => {
      if (!getToken()) return;

      const now = Date.now();
      localStorage.setItem(LAST_ACTIVITY_KEY, String(now));

      clearTimeout(timer);
      timer = setTimeout(checkInactivity, INACTIVITY_MS);
    };

    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible") {
        checkInactivity();
      }
    };

    const handlePageShow = () => {
      checkInactivity();
    };

    const events = [
      "mousedown",
      "mousemove",
      "keydown",
      "scroll",
      "touchstart",
      "click",
      "pointerdown",
    ];

    events.forEach((event) => {
      window.addEventListener(event, recordActivity, {
        passive: true,
      });
    });

    document.addEventListener(
      "visibilitychange",
      handleVisibilityChange
    );

    window.addEventListener("pageshow", handlePageShow);

    // Check immediately when TechMart loads.
    checkInactivity();

    return () => {
      clearTimeout(timer);

      events.forEach((event) => {
        window.removeEventListener(event, recordActivity);
      });

      document.removeEventListener(
        "visibilitychange",
        handleVisibilityChange
      );

      window.removeEventListener("pageshow", handlePageShow);
    };
  }, [minutes]);
}
function OfflineBanner() {
  const [offline, setOffline] = useState(false);
  const [slowConn, setSlowConn] = useState(false);
  useEffect(() => {
    const on = () => setOffline(true);
    const off = () => setOffline(false);
    window.addEventListener("offline", on);
    window.addEventListener("online", off);
    // Detect slow backend (cold start)
    const start = Date.now();
    const BACKEND = (typeof import.meta !== "undefined" && import.meta.env?.VITE_API_URL) || "https://techmart-backend-ecbi.onrender.com";
    const slowTimer = setTimeout(() => setSlowConn(true), 5000);
    fetch(`${BACKEND}/api/health`)
      .then(() => { clearTimeout(slowTimer); setSlowConn(false); })
      .catch(() => { clearTimeout(slowTimer); });
    return () => { window.removeEventListener("offline", on); window.removeEventListener("online", off); clearTimeout(slowTimer); };
  }, []);
  if (offline) return (
    <div style={{ position: "fixed", top: 0, left: 0, right: 0, background: "#dc2626", color: "#fff", textAlign: "center", padding: "8px", fontSize: "13px", fontWeight: "700", zIndex: 99999 }}>
      ⚠️ No internet connection. Please check your network.
    </div>
  );
  if (slowConn) return (
    <div style={{ position: "fixed", top: 0, left: 0, right: 0, background: "#f97316", color: "#fff", textAlign: "center", padding: "8px", fontSize: "13px", fontWeight: "700", zIndex: 99999 }}>
      ⏳ Server is waking up... Please wait a moment.
    </div>
  );
  return null;
}

export default function App() {
  useEffect(() => {
    // Apply saved theme safely after mount
    try {
      const savedTheme = localStorage.getItem("techmart-theme") || "dark";
      document.body.setAttribute("data-theme", savedTheme);
    } catch {}
  }, []);

  useEffect(() => {
    // Keep Render backend warm
    const BACKEND = import.meta.env.VITE_API_URL || "https://techmart-backend-ecbi.onrender.com";
    const keepAlive = setInterval(() => {
      fetch(`${BACKEND}/api/health`).catch(() => {});
    }, 10 * 60 * 1000);
    return () => clearInterval(keepAlive);
  }, []);

  return (
    <ToastProvider>
    <div style={styles.appContainer}>
      <OfflineBanner />
      {/* Navigation Bar across all views */}
      <Navbar />

      {/* Main Routing Architecture */}
      <main style={styles.mainContent}>
        <ErrorBoundary>
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
          <Route path="/buyer-protection" element={<BuyerProtection />} />
          <Route path="/chat" element={<ChatPage />} />
          <Route path="/seller/apply" element={<SellerApply />} />
          <Route path="/account" element={<Account />} />
          <Route path="/ai-search" element={<AISearch />} />
          <Route path="/pay" element={<TechMartPay />} />
          <Route path="/pay/user/:userId" element={<PayProfile />} />
          <Route path="/pay/link/:linkId" element={<PayLink />} />
          <Route path="/compare" element={<Compare />} />
          <Route path="/referral" element={<Referral />} />
          <Route path="/seller/login" element={<SellerLogin />} />
          <Route path="/seller/dashboard" element={<SellerDashboard />} />
          <Route path="*" element={<div style={{display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",minHeight:"60vh",gap:"16px"}}><p style={{fontSize:"48px",margin:0}}>404</p><p style={{color:"var(--text-muted)"}}>Page not found</p><a href="/" style={{padding:"10px 24px",background:"#f97316",color:"#fff",borderRadius:"8px",textDecoration:"none",fontWeight:"700"}}>Go Home</a></div>} />
        </Routes>
        </Suspense>
        </ErrorBoundary>
      </main>

      {/* Professional Legal Footer */}
      <Footer />

      {/* 🤖 GLOBAL AI CHATBOT SYSTEM */}
      <Chatbot />
      <BottomNav />
      <CompareBar />
      <LiveNotification />
    {/* 💬 WHATSAPP FLOATING BUTTON */}
    <a href="https://wa.me/2349032657217" target="_blank" rel="noopener noreferrer" title="Chat with us on WhatsApp" style={{position:"fixed",bottom:"24px",left:"24px",width:"52px",height:"52px",borderRadius:"50%",background:"#25D366",display:"flex",alignItems:"center",justifyContent:"center",boxShadow:"0 4px 20px rgba(37,211,102,0.5)",zIndex:9997,textDecoration:"none"}}>
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32" width="32" height="32" fill="#fff"><path d="M16 2C8.268 2 2 8.268 2 16c0 2.47.643 4.786 1.768 6.8L2 30l7.4-1.736A13.94 13.94 0 0 0 16 30c7.732 0 14-6.268 14-14S23.732 2 16 2zm0 25.5a11.44 11.44 0 0 1-5.833-1.594l-.418-.248-4.33 1.016 1.04-4.222-.272-.432A11.5 11.5 0 1 1 16 27.5zm6.29-8.617c-.344-.172-2.036-1.004-2.352-1.118-.316-.115-.546-.172-.776.172-.23.344-.892 1.118-1.094 1.348-.2.23-.402.258-.746.086-.344-.172-1.452-.535-2.766-1.707-1.022-.912-1.712-2.037-1.912-2.381-.2-.344-.022-.53.15-.701.155-.154.344-.402.516-.603.172-.2.23-.344.344-.574.115-.23.058-.43-.029-.602-.086-.172-.776-1.87-1.063-2.56-.28-.672-.564-.58-.776-.59l-.66-.012c-.23 0-.603.086-.918.43-.316.344-1.205 1.177-1.205 2.87s1.234 3.328 1.406 3.558c.172.23 2.428 3.708 5.882 5.2.822.355 1.464.567 1.964.726.825.263 1.577.226 2.17.137.662-.099 2.036-.832 2.323-1.635.287-.803.287-1.492.2-1.635-.086-.143-.316-.23-.66-.402z"/></svg>
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
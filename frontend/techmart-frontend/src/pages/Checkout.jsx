cat > src/pages/Checkout.jsx << 'ENDOFFILE'
import { useContext, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { CartContext } from "../context/CartContext";
import axios from "axios";

const API = import.meta.env.VITE_API_URL || "https://techmart-backend-ecbi.onrender.com";
const FALLBACK_IMG = "https://placehold.co/80x80?text=No+Image";

export default function Checkout() {
  const { cart, clearCart } = useContext(CartContext);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const navigate = useNavigate();

  const user = JSON.parse(localStorage.getItem("user"));
  const token = localStorage.getItem("token");

  const subtotal = cart.reduce((sum, item) => sum + item.price * (item.quantity || 1), 0);
  const total = subtotal;

  const handlePayment = async () => {
    setError("");
    if (!token || !user) { navigate("/login"); return; }
    if (cart.length === 0) { setError("Your cart is empty"); return; }
    try {
      setLoading(true);
      const response = await axios.post(
        API + "/api/paystack/init",
        { email: user.email, amount: total, cart },
        { headers: { Authorization: "Bearer " + token } }
      );
      window.location.href = response.data.url;
    } catch (err) {
      setError(err.response?.data?.error || "Payment failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  if (cart.length === 0) {
    return (
      <div style={styles.centered}>
        <span style={{ fontSize: "64px" }}>🛒</span>
        <h2 style={{ color: "#fff", marginTop: "16px" }}>Your cart is empty</h2>
        <Link to="/"><button style={styles.orangeBtn}>Shop Now</button></Link>
      </div>
    );
  }

  return (
    <div style={styles.page}>
      <div style={styles.header}>
        <h1 style={styles.title}>💳 Checkout</h1>
        <Link to="/cart"><button style={styles.backBtn}>Back to Cart</button></Link>
      </div>
      <div style={styles.layout}>
        <div style={styles.leftCol}>
          {user && (
            <div style={styles.userCard}>
              <h3 style={styles.sectionTitle}>👤 Customer Details</h3>
              <div style={styles.userRow}>
                <div style={styles.avatar}>{user.name?.charAt(0).toUpperCase()}</div>
                <div>
                  <p style={styles.userName}>{user.name}</p>
                  <p style={styles.userEmail}>{user.email}</p>
                </div>
              </div>
            </div>
          )}
          {!user && (
            <div style={styles.warningBox}>
              You are not logged in.
              <Link to="/login" style={{ color: "#f97316" }}> Login</Link> to complete your purchase.
            </div>
          )}
          <div style={styles.itemsCard}>
            <h3 style={styles.sectionTitle}>🛍️ Order Items ({cart.length})</h3>
            {cart.map((item) => (
              <div key={item._id} style={styles.itemRow}>
                <img
                  src={item.images?.[0] || FALLBACK_IMG}
                  alt={item.name}
                  onError={(e) => { e.target.src = FALLBACK_IMG; }}
                  style={styles.itemImg}
                />
                <div style={styles.itemDetails}>
                  <p style={styles.itemName}>{item.name}</p>
                  <p style={styles.itemQty}>Qty: {item.quantity || 1}</p>
                </div>
                <p style={styles.itemPrice}>₦{(item.price * (item.quantity || 1)).toLocaleString()}</p>
              </div>
            ))}
          </div>
        </div>
        <div style={styles.rightCol}>
          <div style={styles.summaryCard}>
            <h3 style={styles.sectionTitle}>🧾 Order Summary</h3>
            {cart.map((item) => (
              <div key={item._id} style={styles.summaryRow}>
                <span style={styles.summaryLabel}>{item.name} x {item.quantity || 1}</span>
                <span style={styles.summaryValue}>₦{(item.price * (item.quantity || 1)).toLocaleString()}</span>
              </div>
            ))}
            <div style={styles.divider} />
            <div style={styles.summaryRow}>
              <span style={styles.summaryLabel}>Delivery</span>
              <span style={{ color: "#22c55e" }}>Free</span>
            </div>
            <div style={styles.divider} />
            <div style={styles.summaryRow}>
              <span style={{ color: "#fff", fontWeight: "800", fontSize: "18px" }}>Total</span>
              <span style={{ color: "#f97316", fontWeight: "800", fontSize: "22px" }}>₦{total.toLocaleString()}</span>
            </div>
            {error && <div style={styles.errorBox}>{error}</div>}
            <button
              onClick={handlePayment}
              disabled={loading || !user}
              style={{ ...styles.payBtn, opacity: loading || !user ? 0.7 : 1 }}
            >
              {loading ? "Processing..." : "Pay ₦" + total.toLocaleString() + " →"}
            </button>
            <p style={styles.secureText}>🔒 Secured by Paystack</p>
          </div>
        </div>
      </div>
    </div>
  );
}

const styles = {
  page: { maxWidth: "1100px", margin: "0 auto", padding: "32px 16px", minHeight: "100vh" },
  centered: { display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", minHeight: "70vh", textAlign: "center" },
  header: { display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "32px", flexWrap: "wrap", gap: "12px" },
  title: { color: "#fff", fontSize: "28px", fontWeight: "800" },
  backBtn: { background: "#1a1a1a", border: "1px solid #333", color: "#fff", padding: "10px 18px", borderRadius: "8px", cursor: "pointer", fontSize: "14px" },
  orangeBtn: { padding: "14px 28px", background: "linear-gradient(135deg, #f97316, #dc2626)", color: "#fff", border: "none", borderRadius: "12px", cursor: "pointer", fontWeight: "700", fontSize: "16px", marginTop: "16px" },
  layout: { display: "grid", gridTemplateColumns: "1fr 380px", gap: "32px", alignItems: "start" },
  leftCol: { display: "flex", flexDirection: "column", gap: "20px" },
  userCard: { background: "#1a1a1a", border: "1px solid #2a2a2a", borderRadius: "16px", padding: "20px" },
  userRow: { display: "flex", alignItems: "center", gap: "16px", marginTop: "12px" },
  avatar: { width: "48px", height: "48px", borderRadius: "50%", background: "linear-gradient(135deg, #f97316, #dc2626)", color: "#fff", fontSize: "20px", fontWeight: "800", display: "flex", alignItems: "center", justifyContent: "center" },
  userName: { color: "#fff", fontWeight: "700", fontSize: "16px", margin: 0 },
  userEmail: { color: "#888", fontSize: "14px", margin: 0 },
  warningBox: { background: "#2a1a0a", border: "1px solid #f97316", color: "#fed7aa", padding: "14px 16px", borderRadius: "12px", fontSize: "14px" },
  itemsCard: { background: "#1a1a1a", border: "1px solid #2a2a2a", borderRadius: "16px", padding: "20px" },
  sectionTitle: { color: "#fff", fontSize: "16px", fontWeight: "700", marginBottom: "16px" },
  itemRow: { display: "flex", alignItems: "center", gap: "16px", paddingBottom: "16px", marginBottom: "16px", borderBottom: "1px solid #222" },
  itemImg: { width: "72px", height: "72px", objectFit: "cover", borderRadius: "10px", background: "#222", flexShrink: 0 },
  itemDetails: { flex: 1 },
  itemName: { color: "#fff", fontWeight: "600", fontSize: "15px", margin: "0 0 4px" },
  itemQty: { color: "#aaa", fontSize: "13px", margin: 0 },
  itemPrice: { color: "#f97316", fontWeight: "700", fontSize: "16px" },
  rightCol: { position: "sticky", top: "90px" },
  summaryCard: { background: "#1a1a1a", border: "1px solid #2a2a2a", borderRadius: "16px", padding: "24px" },
  summaryRow: { display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "12px" },
  summaryLabel: { color: "#888", fontSize: "14px" },
  summaryValue: { color: "#fff", fontSize: "15px", fontWeight: "600" },
  divider: { borderTop: "1px solid #2a2a2a", margin: "16px 0" },
  errorBox: { background: "#2a1010", border: "1px solid #dc2626", color: "#f87171", padding: "12px 16px", borderRadius: "10px", fontSize: "14px", marginBottom: "16px", marginTop: "8px" },
  payBtn: { width: "100%", padding: "16px", background: "linear-gradient(135deg, #f97316, #dc2626)", color: "#fff", border: "none", borderRadius: "12px", fontSize: "17px", fontWeight: "800", marginTop: "16px", cursor: "pointer" },
  secureText: { color: "#888", fontSize: "13px", textAlign: "center", marginTop: "12px" },
};
ENDOFFILE
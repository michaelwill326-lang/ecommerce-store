import { useContext, useState, useEffect, useRef } from "react";
import { useNavigate, Link } from "react-router-dom";
import { CartContext } from "../context/CartContext";
import axios from "axios";

const API = import.meta.env.VITE_API_URL || "https://techmart-backend-ecbi.onrender.com";
const FALLBACK_IMG = "https://placehold.co/80x80?text=No+Image";

export default function Checkout() {
  const { cart } = useContext(CartContext);
  const [loading, setLoading] = useState(false);
  const [address, setAddress] = useState("");
  const [phone, setPhone] = useState(JSON.parse(localStorage.getItem("user"))?.phone || "");
  const [error, setError] = useState("");
  const inputRef = useRef(null);
  const navigate = useNavigate();

  const user = JSON.parse(localStorage.getItem("user"));
  const token = localStorage.getItem("token");
  const total = cart.reduce((sum, item) => sum + item.price * (item.quantity || 1), 0);

  const [suggestions, setSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const debounceRef = useRef(null);

  const handleAddressChange = (e) => {
    const value = e.target.value;
    setAddress(value);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (value.length < 3) { setSuggestions([]); setShowSuggestions(false); return; }
    debounceRef.current = setTimeout(async () => {
      try {
        const res = await fetch(`https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(value + ", Nigeria")}&format=json&limit=5&countrycodes=ng`);
        const data = await res.json();
        setSuggestions(data);
        setShowSuggestions(true);
      } catch (err) {
        console.error("Address lookup failed", err);
      }
    }, 400);
  };

  const selectSuggestion = (display_name) => {
    setAddress(display_name);
    setSuggestions([]);
    setShowSuggestions(false);
  };

  const handlePayment = async () => {
    setError("");
    if (!token || !user) { navigate("/login"); return; }
    if (cart.length === 0) { setError("Your cart is empty"); return; }
    if (!address.trim()) { setError("Please enter your delivery address"); return; }
    if (!phone.trim()) { setError("Please enter your phone number"); return; }
    try {
      setLoading(true);
      const response = await axios.post(
        `${API}/api/paystack/init`,
        { email: user.email, amount: total, cart, deliveryAddress: address, phone },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      window.location.href = response.data.url;
    } catch (err) {
      setError(err.response?.data?.error || "Payment failed.");
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
        <Link to="/cart"><button style={styles.backBtn}>← Back to Cart</button></Link>
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
              ⚠️ Not logged in.{" "}
              <Link to="/login" style={{ color: "#f97316" }}>Login</Link>{" "}
              to complete purchase.
            </div>
          )}
          <div style={styles.addressCard}>
            <h3 style={styles.sectionTitle}>📍 Delivery Details</h3>
            <div style={styles.fieldWrap}>
              <label style={styles.label}>Delivery Address</label>
              <div style={{ position: "relative" }}>
                <input
                  ref={inputRef}
                  type="text"
                  placeholder="Start typing your address in Nigeria..."
                  value={address}
                  onChange={handleAddressChange}
                  style={styles.input}
                  autoComplete="off"
                />
                {showSuggestions && suggestions.length > 0 && (
                  <div style={styles.dropdown}>
                    {suggestions.map((s, i) => (
                      <div key={i} style={styles.dropdownItem} onClick={() => selectSuggestion(s.display_name)}>
                        📍 {s.display_name}
                      </div>
                    ))}
                  </div>
                )}
              </div>
              <p style={{color:"#888",fontSize:"12px",marginTop:"6px"}}>🔍 Google will suggest your address automatically</p>
            </div>
            <div style={styles.fieldWrap}>
              <label style={styles.label}>Phone Number</label>
              <input
                type="tel"
                placeholder="e.g. 08012345678"
                value={phone}
                onChange={e => setPhone(e.target.value)}
                style={styles.input}
              />
            </div>
          </div>
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
                <p style={styles.itemPrice}>
                  ₦{(item.price * (item.quantity || 1)).toLocaleString()}
                </p>
              </div>
            ))}
          </div>
        </div>
        <div style={styles.rightCol}>
          <div style={styles.summaryCard}>
            <h3 style={styles.sectionTitle}>🧾 Order Summary</h3>
            {cart.map((item) => (
              <div key={item._id} style={styles.summaryRow}>
                <span style={styles.summaryLabel}>
                  {item.name} × {item.quantity || 1}
                </span>
                <span style={styles.summaryValue}>
                  ₦{(item.price * (item.quantity || 1)).toLocaleString()}
                </span>
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
              <span style={{ color: "#f97316", fontWeight: "800", fontSize: "22px" }}>
                ₦{total.toLocaleString()}
              </span>
            </div>
            {error && <div style={styles.errorBox}>⚠️ {error}</div>}
            <button
              onClick={handlePayment}
              disabled={loading || !user}
              style={{ ...styles.payBtn, opacity: loading || !user ? 0.7 : 1 }}
            >
              {loading ? "Processing..." : `Pay ₦${total.toLocaleString()} →`}
            </button>
            <p style={styles.secureText}>🔒 Secured by Paystack</p>
            <div style={styles.guaranteeRow}>
              <span style={styles.guaranteeItem}>✅ Secure Payment</span>
              <span style={styles.guaranteeItem}>📦 Free Delivery</span>
              <span style={styles.guaranteeItem}>↩️ Easy Returns</span>
            </div>
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
  addressCard: { background: "#1a1a1a", border: "1px solid #2a2a2a", borderRadius: "16px", padding: "20px" },
  fieldWrap: { marginBottom: "16px" },
  label: { display: "block", color: "#aaa", fontSize: "13px", fontWeight: "600", marginBottom: "8px", textTransform: "uppercase", letterSpacing: "0.5px" },
  input: { width: "100%", padding: "12px 16px", background: "#111", border: "1px solid #333", borderRadius: "10px", color: "#fff", fontSize: "15px", outline: "none", boxSizing: "border-box" },
  summaryCard: { background: "#1a1a1a", border: "1px solid #2a2a2a", borderRadius: "16px", padding: "24px" },
  summaryRow: { display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "12px" },
  summaryLabel: { color: "#888", fontSize: "14px" },
  summaryValue: { color: "#fff", fontSize: "15px", fontWeight: "600" },
  divider: { borderTop: "1px solid #2a2a2a", margin: "16px 0" },
  errorBox: { background: "#2a1010", border: "1px solid #dc2626", color: "#f87171", padding: "12px 16px", borderRadius: "10px", fontSize: "14px", marginTop: "8px" },
  payBtn: { width: "100%", padding: "16px", background: "linear-gradient(135deg, #f97316, #dc2626)", color: "#fff", border: "none", borderRadius: "12px", fontSize: "17px", fontWeight: "800", marginTop: "16px", cursor: "pointer" },
  secureText: { color: "#888", fontSize: "13px", textAlign: "center", marginTop: "12px" },
  guaranteeRow: { display: "flex", justifyContent: "space-between", marginTop: "16px", flexWrap: "wrap", gap: "8px" },
  guaranteeItem: { color: "#888", fontSize: "12px" },
  dropdown: { position: "absolute", top: "100%", left: 0, right: 0, background: "#1a1a1a", border: "1px solid #444", borderRadius: "10px", zIndex: 1000, maxHeight: "200px", overflowY: "auto", marginTop: "4px" },
  dropdownItem: { padding: "12px 16px", color: "#fff", fontSize: "13px", cursor: "pointer", borderBottom: "1px solid #222", lineHeight: "1.4" },
};

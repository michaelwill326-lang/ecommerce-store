import { useContext, useState, useEffect, useRef } from "react";
import { useToast } from "../App";
import { useNavigate, Link } from "react-router-dom";
import { CartContext } from "../context/CartContext";
import axios from "axios";

const API = import.meta.env.VITE_API_URL || "https://techmart-backend-ecbi.onrender.com";
const FALLBACK_IMG = "https://placehold.co/80x80?text=No+Image";

export default function Checkout() {
  const showToast = useToast();
  const { cart, clearCart } = useContext(CartContext);
  const [loading, setLoading] = useState(false);
  const [address, setAddress] = useState("");
  const [phone, setPhone] = useState((() => { try { return JSON.parse(localStorage.getItem("user"))?.phone || ""; } catch { return ""; } })());
  const [error, setError] = useState("");
  const inputRef = useRef(null);
  const navigate = useNavigate();

  const user = (() => { try { return JSON.parse(localStorage.getItem("user")); } catch { return null; } })();
  const token = localStorage.getItem("token");
  const total = cart.reduce((sum, item) => sum + item.price * (item.quantity || 1), 0);
  const [couponCode, setCouponCode] = useState("");
  const [couponStatus, setCouponStatus] = useState(null);
  const [couponLoading, setCouponLoading] = useState(false);
  const [walletBalance, setWalletBalance] = useState(0);
  const [useWallet, setUseWallet] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState("online");
  const [podLoading, setPodLoading] = useState(false);
  const [podEligible, setPodEligible] = useState(false);
  const [podEligibilityChecked, setPodEligibilityChecked] = useState(false);
  const [deliveryFee, setDeliveryFee] = useState(0);
  const [deliveryZone, setDeliveryZone] = useState("");
  const [deliveryLoading, setDeliveryLoading] = useState(false);
  const [freeDelivery, setFreeDelivery] = useState(false);
  const couponDiscount = couponStatus?.discount || 0;
  const afterCoupon = total - couponDiscount;
  const walletApplied = useWallet ? Math.min(walletBalance, afterCoupon + deliveryFee) : 0;
  const finalTotal = Math.max(0, afterCoupon + deliveryFee - walletApplied);

  const [isMobile, setIsMobile] = useState(() => typeof window !== "undefined" ? window.innerWidth <= 768 : false);
  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth <= 768);
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);
  const [suggestions, setSuggestions] = useState([]);
  useEffect(() => {
    if (token) {
      axios.get(`${API}/api/pay/dashboard`, { headers: { Authorization: `Bearer ${token}` } })
        .then(res => setWalletBalance(res.data.balance || 0))
        .catch(() => {});
      axios.get(`${API}/api/orders/pod-eligibility`, { headers: { Authorization: `Bearer ${token}` } })
        .then(res => { setPodEligible(res.data.eligible); setPodEligibilityChecked(true); })
        .catch(() => setPodEligibilityChecked(true));
    }
  }, []);
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

  const selectSuggestion = async (display_name) => {
    setAddress(display_name);
    setSuggestions([]);
    setShowSuggestions(false);
    // Calculate delivery fee
    try {
      setDeliveryLoading(true);
      const res = await axios.post(`${API}/api/delivery-fee`, { address: display_name, orderTotal: total });
      setDeliveryFee(res.data.fee);
      setDeliveryZone(res.data.zone);
      setFreeDelivery(res.data.freeDelivery);
    } catch (err) {
      setDeliveryFee(0);
    } finally { setDeliveryLoading(false); }
  };

  const applyCoupon = async () => {
    if (!couponCode.trim()) return;
    setCouponLoading(true);
    setCouponStatus(null);
    try {
      const res = await axios.post(`${API}/api/coupons/validate`, { code: couponCode, orderTotal: total });
      setCouponStatus({ discount: res.data.discount, message: `Coupon applied! You save ₦${res.data.discount.toLocaleString()}` });
    } catch (err) {
      setCouponStatus({ error: err.response?.data?.error || "Invalid coupon code" });
    } finally {
      setCouponLoading(false);
    }
  };

  const handlePOD = async () => {
    setError("");
    if (!token || !user) { navigate("/login"); return; }
    if (cart.length === 0) { setError("Your cart is empty"); return; }
    if (!address.trim()) { setError("Please enter your delivery address"); return; }
    if (!phone.trim()) { setError("Please enter your phone number"); return; }
    if (!deliveryFee || deliveryFee === 0) { setError("Please select your delivery address to calculate delivery fee first"); return; }
    try {
      setPodLoading(true);
      const res = await axios.post(
        `${API}/api/orders/pod-deposit`,
        { cart, deliveryAddress: address, phone, couponCode: couponStatus?.discount ? couponCode : null, walletDebit: walletApplied, deliveryFee, deliveryZone },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      window.location.href = res.data.url;
    } catch (err) {
      setError(err.response?.data?.error || "Failed to place order.");
    } finally { setPodLoading(false); }
  };

  const handleEscrowCheckout = async () => {
    if (!address.trim()) return showToast("Please enter your delivery address", "warning");
    if (!phone.trim()) return showToast("Please enter your phone number", "warning");
    setLoading(true);
    try {
      const token = localStorage.getItem("token");
      const res = await axios.post(`${API}/api/orders/checkout-escrow`, {
        items: cart,
        amount: finalTotal,
        deliveryAddress: address,
        phone,
        couponCode: couponStatus?.discount ? couponCode : null,
        deliveryFee,
        deliveryZone
      }, { headers: { Authorization: `Bearer ${token}` } });
      if (res.data.success) {
        clearCart();
        navigate(`/tracking?ref=${res.data.order.reference}&escrow=true`);
      }
    } catch (err) {
      showToast(err.response?.data?.error || "Checkout failed", "error");
    } finally { setLoading(false); }
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
        { email: user.email, amount: finalTotal, cart, deliveryAddress: address, phone, couponCode: couponStatus?.discount ? couponCode : null, walletDebit: walletApplied, deliveryFee, deliveryZone },
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
        <h2 style={{ color: "var(--text-primary)", marginTop: "16px" }}>Your cart is empty</h2>
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
      <div style={isMobile ? styles.layoutMobile : styles.layout}>
        {isMobile && (
          <div style={styles.rightColMobile}>
            <div style={styles.summaryCard}>
              <h3 style={styles.sectionTitle}>Order Summary</h3>
              {cart.map((item) => (
                <div key={item._id} style={styles.summaryRow}>
                  <span style={styles.summaryLabel}>{item.name} x{item.quantity || 1}</span>
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
                <span style={{ color: "var(--text-primary)", fontWeight: "800", fontSize: "16px" }}>Total</span>
                <span style={{ color: "#f97316", fontWeight: "800", fontSize: "18px" }}>
                  {couponStatus?.discount ? (
                    <><span style={{ textDecoration: "line-through", color: "#999", fontSize: "13px" }}>₦{total.toLocaleString()}</span>{" "}₦{finalTotal.toLocaleString()}</>
                  ) : <>₦{total.toLocaleString()}</>}
                </span>
              </div>
            </div>
          </div>
        )}
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
                  onBlur={async () => {
                    if (address.trim().length > 5) {
                      try {
                        setDeliveryLoading(true);
                        const res = await axios.post(`${API}/api/delivery-fee`, { address, orderTotal: total });
                        setDeliveryFee(res.data.fee);
                        setDeliveryZone(res.data.zone);
                        setFreeDelivery(res.data.freeDelivery);
                      } catch (err) { setDeliveryFee(0); }
                      finally { setDeliveryLoading(false); }
                    }
                  }}
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
              <p style={{color:"var(--text-muted)",fontSize:"12px",marginTop:"6px"}}>🔍 Start typing — Nigerian addresses will auto-suggest</p>
              {deliveryZone && (
                <div style={{ marginTop: "8px", padding: "8px 12px", background: "#0a2a1a", border: "1px solid #22c55e", borderRadius: "8px" }}>
                  <p style={{ color: "#22c55e", fontSize: "13px", margin: 0 }}>
                    Zone: {deliveryZone} — {freeDelivery ? "Free Delivery!" : `₦${deliveryFee.toLocaleString()} delivery fee`}
                  </p>
                </div>
              )}
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
        <div style={isMobile ? styles.rightColMobile : styles.rightCol}>
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
              <span style={styles.summaryLabel}>Delivery {deliveryZone ? `(${deliveryZone})` : ""}</span>
              <span style={{ color: freeDelivery ? "#22c55e" : "#fff", fontWeight: "600" }}>
                {deliveryLoading ? "Calculating..." : freeDelivery ? "Free" : deliveryFee > 0 ? `₦${deliveryFee.toLocaleString()}` : "Enter address"}
              </span>
            </div>
            {freeDelivery && <p style={{ color: "#22c55e", fontSize: "12px", margin: "-8px 0 8px", textAlign: "right" }}>Free delivery on orders above ₦150,000!</p>}
            <div style={styles.divider} />
            <div style={styles.summaryRow}>
              <span style={{ color: "var(--text-primary)", fontWeight: "800", fontSize: "18px" }}>Total</span>
              <span style={{ color: "#f97316", fontWeight: "800", fontSize: "22px" }}>
                {(couponDiscount > 0 || walletApplied > 0) ? (
                  <>
                    <span style={{ textDecoration: "line-through", color: "#999", fontSize: "14px" }}>₦{total.toLocaleString()}</span>
                    {" "}₦{finalTotal.toLocaleString()}
                  </>
                ) : (
                  <>₦{total.toLocaleString()}</>
                )}
              </span>
            </div>
            {error && <div style={styles.errorBox}>⚠️ {error}</div>}
            {/* PAYMENT METHOD */}
            <div style={{ marginBottom: "16px" }}>
              <p style={{ color: "var(--text-primary)", fontWeight: "700", fontSize: "14px", margin: "0 0 10px" }}>Payment Method</p>
              <div style={{ display: "flex", gap: "10px" }}>
                <div onClick={() => setPaymentMethod("online")} style={{ flex: 1, padding: "12px", borderRadius: "10px", border: `2px solid ${paymentMethod === "online" ? "#f97316" : "#333"}`, background: paymentMethod === "online" ? "#1a0a00" : "#111", cursor: "pointer", textAlign: "center" }}>
                  <p style={{ margin: "0 0 2px", fontSize: "18px" }}>💳</p>
                  <p style={{ color: paymentMethod === "online" ? "#f97316" : "#fff", fontWeight: "700", fontSize: "13px", margin: 0 }}>Pay Online</p>
                  <p style={{ color: "var(--text-muted)", fontSize: "11px", margin: 0 }}>Card / Transfer</p>
                </div>
                <div onClick={() => podEligible && setPaymentMethod("pod")} style={{ flex: 1, padding: "12px", borderRadius: "10px", border: `2px solid ${paymentMethod === "pod" ? "#22c55e" : "#333"}`, background: paymentMethod === "pod" ? "#0a1a0a" : "#111", cursor: podEligible ? "pointer" : "not-allowed", textAlign: "center", opacity: podEligibilityChecked && !podEligible ? 0.5 : 1 }}>
                  <p style={{ margin: "0 0 2px", fontSize: "18px" }}>💵</p>
                  <p style={{ color: paymentMethod === "pod" ? "#22c55e" : "#fff", fontWeight: "700", fontSize: "13px", margin: 0 }}>Pay on Delivery</p>
                  <p style={{ color: "var(--text-muted)", fontSize: "11px", margin: 0 }}>{podEligible ? "Pay delivery fee now, rest on arrival" : "Complete 1 order to unlock"}</p>
                </div>
              </div>
              {walletBalance >= finalTotal && finalTotal > 0 && (
                <div onClick={() => setPaymentMethod("escrow")} style={{ marginTop: "10px", padding: "12px", borderRadius: "10px", border: `2px solid ${paymentMethod === "escrow" ? "#f97316" : "#333"}`, background: paymentMethod === "escrow" ? "#1a0a00" : "#111", cursor: "pointer", textAlign: "center" }}>
                  <p style={{ margin: "0 0 2px", fontSize: "18px" }}>🔐</p>
                  <p style={{ color: paymentMethod === "escrow" ? "#f97316" : "#fff", fontWeight: "700", fontSize: "13px", margin: 0 }}>Pay with Wallet (Escrow)</p>
                  <p style={{ color: "var(--text-muted)", fontSize: "11px", margin: 0 }}>Funds held safely until you confirm delivery</p>
                </div>
              )}
            </div>
            {/* WALLET */}
            {walletBalance > 0 && (
              <div style={{ background: "#0a2a1a", border: "1px solid #22c55e", borderRadius: "10px", padding: "12px 16px", marginBottom: "12px" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <div>
                    <p style={{ color: "#22c55e", fontWeight: "700", fontSize: "14px", margin: "0 0 2px" }}>TechMart Wallet</p>
                    <p style={{ color: "#86efac", fontSize: "13px", margin: 0 }}>Balance: ₦{walletBalance.toLocaleString()}</p>
                  </div>
                  <label style={{ display: "flex", alignItems: "center", gap: "8px", cursor: "pointer" }}>
                    <input type="checkbox" checked={useWallet} onChange={e => setUseWallet(e.target.checked)} style={{ width: "16px", height: "16px", cursor: "pointer" }} />
                    <span style={{ color: "#22c55e", fontSize: "13px", fontWeight: "600" }}>Use wallet</span>
                  </label>
                </div>
                {useWallet && walletApplied > 0 && (
                  <p style={{ color: "#86efac", fontSize: "13px", margin: "8px 0 0" }}>-₦{walletApplied.toLocaleString()} will be deducted from your wallet</p>
                )}
              </div>
            )}
            {/* COUPON CODE */}
            <div style={{ display: "flex", gap: "8px", marginBottom: "8px" }}>
              <input
                type="text"
                placeholder="Coupon code"
                value={couponCode}
                onChange={(e) => { setCouponCode(e.target.value.toUpperCase()); setCouponStatus(null); }}
                style={{ flex: 1, padding: "10px 12px", borderRadius: "8px", border: "1px solid var(--border-color)", background: "var(--bg-card)", color: "var(--text-primary)", fontSize: "14px" }}
              />
              <button
                onClick={applyCoupon}
                disabled={couponLoading || !couponCode.trim()}
                style={{ padding: "10px 16px", background: "#333", color: "var(--text-primary)", border: "none", borderRadius: "8px", cursor: "pointer", fontSize: "14px" }}
              >
                {couponLoading ? "..." : "Apply"}
              </button>
            </div>
            {couponStatus?.message && <p style={{ color: "#22c55e", fontSize: "13px", marginBottom: "8px" }}>{couponStatus.message}</p>}
            {couponStatus?.error && <p style={{ color: "#ef4444", fontSize: "13px", marginBottom: "8px" }}>{couponStatus.error}</p>}
            {paymentMethod === "escrow" && (
              <div>
                <div style={{ background: "#0a1a0a", border: "1px solid #22c55e", borderRadius: "10px", padding: "12px", marginBottom: "12px" }}>
                  <p style={{ color: "#22c55e", fontSize: "13px", margin: 0 }}>🔐 ₦{finalTotal.toLocaleString()} will be held in escrow until you confirm delivery. Funds are released to the seller only after you receive your order.</p>
                </div>
                <button onClick={handleEscrowCheckout} disabled={loading} style={{ ...styles.payBtn, background: "linear-gradient(135deg, #22c55e, #16a34a)", opacity: loading ? 0.7 : 1 }}>
                  {loading ? "Processing..." : `🔐 Pay ₦${finalTotal.toLocaleString()} with Escrow →`}
                </button>
              </div>
            )}
            {paymentMethod === "online" && (
              <button onClick={handlePayment} disabled={loading || !user} style={{ ...styles.payBtn, opacity: loading || !user ? 0.7 : 1 }}>
                {loading ? "Processing..." : `Pay ₦${finalTotal.toLocaleString()} Online →`}
              </button>
            )}
            {paymentMethod === "pod" && (
              <>
                <div style={{ background: "var(--bg-secondary)", border: "1px solid #22c55e", borderRadius: "10px", padding: "12px", marginBottom: "8px" }}>
                  <p style={{ color: "#22c55e", fontWeight: "700", fontSize: "13px", margin: "0 0 4px" }}>Delivery Deposit Required</p>
                  <p style={{ color: "var(--text-muted)", fontSize: "12px", margin: 0 }}>You will pay ₦{deliveryFee.toLocaleString()} now (delivery fee) and ₦{(finalTotal - deliveryFee).toLocaleString()} cash on delivery.</p>
                </div>
                <button onClick={handlePOD} disabled={podLoading || !user || !deliveryFee} style={{ ...styles.payBtn, background: "linear-gradient(135deg, #16a34a, #15803d)", opacity: podLoading || !user || !deliveryFee ? 0.7 : 1 }}>
                  {podLoading ? "Processing..." : `Pay ₦${deliveryFee.toLocaleString()} Delivery Deposit →`}
                </button>
              </>
            )}
            {/* TRUST BADGES */}
            <div style={{ background: "var(--bg-secondary)", border: "1px solid var(--border-light)", borderRadius: "12px", padding: "16px", marginTop: "16px" }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "8px", marginBottom: "12px" }}>
                <span style={{ fontSize: "18px" }}>🔒</span>
                <span style={{ color: "var(--text-primary)", fontWeight: "700", fontSize: "14px" }}>100% Secure Checkout</span>
              </div>
              <div style={{ display: "flex", justifyContent: "center", gap: "8px", flexWrap: "wrap", marginBottom: "12px" }}>
                <div style={{ background: "var(--bg-card)", border: "1px solid #00c3e3", borderRadius: "8px", padding: "6px 12px", display: "flex", alignItems: "center", gap: "6px" }}>
                  <span style={{ color: "#00c3e3", fontWeight: "800", fontSize: "13px" }}>Paystack</span>
                  <span style={{ color: "var(--text-muted)", fontSize: "11px" }}>Secured</span>
                </div>
                <div style={{ background: "var(--bg-card)", border: "1px solid #22c55e", borderRadius: "8px", padding: "6px 12px", display: "flex", alignItems: "center", gap: "6px" }}>
                  <span style={{ fontSize: "14px" }}>🔐</span>
                  <span style={{ color: "#22c55e", fontSize: "13px", fontWeight: "700" }}>SSL Encrypted</span>
                </div>
                <div style={{ background: "var(--bg-card)", border: "1px solid #f97316", borderRadius: "8px", padding: "6px 12px", display: "flex", alignItems: "center", gap: "6px" }}>
                  <span style={{ fontSize: "14px" }}>🇳🇬</span>
                  <span style={{ color: "#f97316", fontSize: "13px", fontWeight: "700" }}>Made in Nigeria</span>
                </div>
              </div>
              <div style={{ display: "flex", justifyContent: "space-around", borderTop: "1px solid var(--border-light)", paddingTop: "12px" }}>
                <div style={{ textAlign: "center" }}>
                  <div style={{ fontSize: "20px" }}>✅</div>
                  <div style={{ color: "var(--text-muted)", fontSize: "11px", marginTop: "4px" }}>Safe Payment</div>
                </div>
                <div style={{ textAlign: "center" }}>
                  <div style={{ fontSize: "20px" }}>📦</div>
                  <div style={{ color: "var(--text-muted)", fontSize: "11px", marginTop: "4px" }}>Free Delivery</div>
                </div>
                <div style={{ textAlign: "center" }}>
                  <div style={{ fontSize: "20px" }}>↩️</div>
                  <div style={{ color: "var(--text-muted)", fontSize: "11px", marginTop: "4px" }}>Easy Returns</div>
                </div>
                <div style={{ textAlign: "center" }}>
                  <div style={{ fontSize: "20px" }}>🎧</div>
                  <div style={{ color: "var(--text-muted)", fontSize: "11px", marginTop: "4px" }}>24/7 Support</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

const styles = {
  page: { maxWidth: "1100px", margin: "0 auto", padding: "16px", paddingBottom: "80px", minHeight: "100vh" },
  centered: { display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", minHeight: "70vh", textAlign: "center" },
  header: { display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px", flexWrap: "wrap", gap: "8px" },
  title: { color: "var(--text-primary)", fontSize: "22px", fontWeight: "800" },
  backBtn: { background: "var(--bg-card)", border: "1px solid var(--border-color)", color: "var(--text-primary)", padding: "10px 18px", borderRadius: "8px", cursor: "pointer", fontSize: "14px" },
  orangeBtn: { padding: "14px 28px", background: "linear-gradient(135deg, #f97316, #dc2626)", color: "var(--text-primary)", border: "none", borderRadius: "12px", cursor: "pointer", fontWeight: "700", fontSize: "16px", marginTop: "16px" },
  layout: { display: "grid", gridTemplateColumns: "1fr 380px", gap: "32px", alignItems: "start" }, layoutMobile: { display: "flex", flexDirection: "column", gap: "16px" },
  leftCol: { display: "flex", flexDirection: "column", gap: "20px" },
  userCard: { background: "var(--bg-card)", border: "1px solid #2a2a2a", borderRadius: "12px", padding: "16px" },
  userRow: { display: "flex", alignItems: "center", gap: "16px", marginTop: "12px" },
  avatar: { width: "48px", height: "48px", borderRadius: "50%", background: "linear-gradient(135deg, #f97316, #dc2626)", color: "var(--text-primary)", fontSize: "20px", fontWeight: "800", display: "flex", alignItems: "center", justifyContent: "center" },
  userName: { color: "var(--text-primary)", fontWeight: "700", fontSize: "16px", margin: 0 },
  userEmail: { color: "var(--text-muted)", fontSize: "14px", margin: 0 },
  warningBox: { background: "#2a1a0a", border: "1px solid #f97316", color: "#fed7aa", padding: "14px 16px", borderRadius: "12px", fontSize: "14px" },
  itemsCard: { background: "var(--bg-card)", border: "1px solid #2a2a2a", borderRadius: "12px", padding: "16px" },
  sectionTitle: { color: "var(--text-primary)", fontSize: "15px", fontWeight: "700", marginBottom: "12px" },
  itemRow: { display: "flex", alignItems: "center", gap: "16px", paddingBottom: "16px", marginBottom: "16px", borderBottom: "1px solid var(--border-light)" },
  itemImg: { width: "72px", height: "72px", objectFit: "cover", borderRadius: "10px", background: "var(--bg-input)", flexShrink: 0 },
  itemDetails: { flex: 1 },
  itemName: { color: "var(--text-primary)", fontWeight: "600", fontSize: "15px", margin: "0 0 4px" },
  itemQty: { color: "var(--text-secondary)", fontSize: "13px", margin: 0 },
  itemPrice: { color: "#f97316", fontWeight: "700", fontSize: "16px" },
  rightCol: { position: "sticky", top: "90px" }, rightColMobile: { position: "static" },
  addressCard: { background: "var(--bg-card)", border: "1px solid #2a2a2a", borderRadius: "12px", padding: "16px" },
  fieldWrap: { marginBottom: "16px" },
  label: { display: "block", color: "var(--text-secondary)", fontSize: "13px", fontWeight: "600", marginBottom: "8px", textTransform: "uppercase", letterSpacing: "0.5px" },
  input: { width: "100%", padding: "12px 16px", background: "var(--bg-secondary)", border: "1px solid var(--border-color)", borderRadius: "10px", color: "var(--text-primary)", fontSize: "15px", outline: "none", boxSizing: "border-box" },
  summaryCard: { background: "var(--bg-card)", border: "1px solid #2a2a2a", borderRadius: "12px", padding: "16px" },
  summaryRow: { display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "12px" },
  summaryLabel: { color: "var(--text-muted)", fontSize: "14px" },
  summaryValue: { color: "var(--text-primary)", fontSize: "15px", fontWeight: "600" },
  divider: { borderTop: "1px solid #2a2a2a", margin: "16px 0" },
  errorBox: { background: "#2a1010", border: "1px solid #dc2626", color: "#f87171", padding: "12px 16px", borderRadius: "10px", fontSize: "14px", marginTop: "8px" },
  payBtn: { width: "100%", padding: "16px", background: "linear-gradient(135deg, #f97316, #dc2626)", color: "var(--text-primary)", border: "none", borderRadius: "12px", fontSize: "16px", fontWeight: "800", marginTop: "16px", cursor: "pointer", marginBottom: "12px" },
  secureText: { color: "var(--text-muted)", fontSize: "13px", textAlign: "center", marginTop: "12px" },
  guaranteeRow: { display: "flex", justifyContent: "space-between", marginTop: "16px", flexWrap: "wrap", gap: "8px" },
  guaranteeItem: { color: "var(--text-muted)", fontSize: "12px" },
  dropdown: { position: "absolute", top: "100%", left: 0, right: 0, background: "var(--bg-card)", border: "1px solid #444", borderRadius: "10px", zIndex: 1000, maxHeight: "200px", overflowY: "auto", marginTop: "4px" },
  dropdownItem: { padding: "12px 16px", color: "var(--text-primary)", fontSize: "13px", cursor: "pointer", borderBottom: "1px solid var(--border-light)", lineHeight: "1.4" },
};

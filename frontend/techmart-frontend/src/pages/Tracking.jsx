import { useEffect, useState } from "react";
import usePullToRefresh from "../hooks/usePullToRefresh";
import { useToast } from "../App";
import { OrderCardSkeleton } from "../components/Skeleton";
import { io } from "socket.io-client";
import { Link } from "react-router-dom";
import axios from "axios";
import { useContext } from "react";
import { CartContext } from "../context/CartContext";

const API = import.meta.env.VITE_API_URL || "https://techmart-backend-ecbi.onrender.com";

const STEPS = [
  { label: "Pending", icon: "🕐", desc: "Order received" },
  { label: "Paid", icon: "💳", desc: "Payment confirmed" },
  { label: "Shipped", icon: "🚚", desc: "Order on the way" },
  { label: "Delivered", icon: "✅", desc: "Order delivered" },
];

export default function Tracking() {
  const showToast = useToast();
  const { addToCart } = useContext(CartContext);
  const [reference, setReference] = useState("");
  const [order, setOrder] = useState(null);
  const [myOrders, setMyOrders] = useState([]);
  const [bnplPlans, setBnplPlans] = useState([]);
  const [bnplLoading, setBnplLoading] = useState(false);
  const [showBnpl, setShowBnpl] = useState(false);
  const [loading, setLoading] = useState(false);
  const [myOrdersLoading, setMyOrdersLoading] = useState(false);
  const [error, setError] = useState("");
  const [tab, setTab] = useState("track");

  const token = sessionStorage.getItem("token");
  const user = (() => { try { return JSON.parse(sessionStorage.getItem("user")); } catch { return null; } })();

  useEffect(() => {
    if (token && user) {
      fetchMyOrders();
    }
  }, []);

  const fetchMyOrders = async () => {
    try {
      setMyOrdersLoading(true);
      const res = await axios.get(`${API}/api/orders/me`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setMyOrders(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setMyOrdersLoading(false);
    }
  };

  const trackOrder = async () => {
    if (!reference.trim()) {
      setError("Please enter a reference number");
      return;
    }
    try {
      setLoading(true);
      setError("");
      setOrder(null);
      const res = await axios.get(`${API}/api/orders/track/${reference.trim()}`);
      setOrder(res.data);
    } catch (err) {
      setError("Order not found. Please check your reference number.");
    } finally {
      setLoading(false);
    }
  };

  const getStatusIndex = (status) => {
    return STEPS.findIndex(s => s.label === status);
  };

  const getStatusColor = (status) => {
    if (status === "Delivered") return "#22c55e";
    if (status === "Shipped") return "#3b82f6";
    if (status === "Paid") return "#f97316";
    if (status === "Cancelled") return "#dc2626";
    return "#888";
  };

  return (
    <div style={styles.page}>
      {pullDistance > 0 && (
        <div style={{ textAlign: "center", padding: "10px", color: pulling ? "#f97316" : "var(--text-muted)", fontSize: "13px", fontWeight: "700" }}>
          {pulling ? "🔄 Release to refresh" : "⬇️ Pull to refresh"}
        </div>
      )}

      {/* HEADER */}
      <div style={styles.header}>
        <div>
          <h1 style={styles.title}>📦 Order Tracking</h1>
          <p style={styles.subtitle}>Track your TechMart orders in real time</p>
        </div>
        <Link to="/"><button style={styles.backBtn}>← Back to Store</button></Link>
      </div>

      {/* TABS */}
      {user && (
        <div style={styles.tabRow}>
          <button
            onClick={() => setTab("track")}
            style={{
              ...styles.tabBtn,
              background: tab === "track" ? "linear-gradient(135deg, #f97316, #dc2626)" : "#1a1a1a",
              color: tab === "track" ? "#fff" : "#888",
              border: tab === "track" ? "none" : "1px solid #333",
            }}
          >
            🔍 Track Order
          </button>
          <button
            onClick={() => setTab("my")}
            style={{
              ...styles.tabBtn,
              background: tab === "my" ? "linear-gradient(135deg, #f97316, #dc2626)" : "#1a1a1a",
              color: tab === "my" ? "#fff" : "#888",
              border: tab === "my" ? "none" : "1px solid #333",
            }}
          >
            📋 My Orders ({myOrders.length})
          </button>
        </div>
      )}

      {/* TRACK BY REFERENCE */}
      {tab === "track" && (
        <div style={styles.card}>
          <h2 style={styles.cardTitle}>🔍 Track by Reference Number</h2>
          <p style={styles.cardSubtitle}>
            Enter the reference number from your order confirmation email
          </p>

          <div style={styles.searchRow}>
            <input
              type="text"
              placeholder="e.g. TX-1779582238315"
              value={reference}
              onChange={(e) => setReference(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && trackOrder()}
              style={styles.input}
            />
            <button
              onClick={trackOrder}
              disabled={loading}
              style={{ ...styles.orangeBtn, opacity: loading ? 0.7 : 1 }}
            >
              {loading ? "Searching..." : "Track →"}
            </button>
          </div>

          {error && <div style={styles.errorBox}>⚠️ {error}</div>}

          {/* ORDER RESULT */}
          {order && (
            <div style={styles.orderResult}>

              {/* ORDER INFO */}
              <div style={styles.orderInfo}>
                <div style={styles.orderInfoRow}>
                  <span style={styles.infoLabel}>Reference</span>
                  <span style={styles.infoValue}>{order.reference}</span>
                </div>
                <div style={styles.orderInfoRow}>
                  <span style={styles.infoLabel}>Email</span>
                  <span style={styles.infoValue}>{order.email}</span>
                </div>
                <div style={styles.orderInfoRow}>
                  <span style={styles.infoLabel}>Amount</span>
                  <span style={{ ...styles.infoValue, color: "#f97316", fontWeight: "800" }}>
                    ₦{order.amount?.toLocaleString()}
                  </span>
                </div>
                <div style={styles.orderInfoRow}>
                  <span style={styles.infoLabel}>Date</span>
                  <span style={styles.infoValue}>
                    {new Date(order.createdAt).toLocaleDateString("en-NG", {
                      weekday: "long", year: "numeric", month: "long", day: "numeric"
                    })}
                  </span>
                </div>
                <div style={styles.orderInfoRow}>
                  <span style={styles.infoLabel}>Status</span>
                  <span style={{
                    ...styles.badge,
                    background: getStatusColor(order.status)
                  }}>
                    {order.status}
                  </span>
                </div>
                {order.trackingNumber && (
                  <div style={styles.orderInfoRow}>
                    <span style={styles.infoLabel}>Tracking #</span>
                    <span style={{ ...styles.infoValue, color: "#3b82f6", fontWeight: "700" }}>
                      {order.trackingNumber}
                    </span>
                  </div>
                )}
              </div>

              {/* TIMELINE */}
              {order.status !== "Cancelled" && (
                <div style={styles.timeline}>
                  <h3 style={styles.timelineTitle}>Order Progress</h3>
                  <div style={styles.steps}>
                    {STEPS.map((step, i) => {
                      const currentIndex = getStatusIndex(order.status);
                      const isCompleted = currentIndex >= i;
                      const isCurrent = currentIndex === i;
                      return (
                        <div key={step.label} style={styles.stepWrap}>
                          <div style={styles.stepLeft}>
                            <div style={{
                              ...styles.stepCircle,
                              background: isCompleted
                                ? "linear-gradient(135deg, #f97316, #dc2626)"
                                : "#222",
                              border: isCurrent
                                ? "2px solid #f97316"
                                : isCompleted
                                ? "none"
                                : "2px solid #333",
                              transform: isCurrent ? "scale(1.2)" : "scale(1)",
                            }}>
                              <span style={{ fontSize: "16px" }}>{step.icon}</span>
                            </div>
                            {i < STEPS.length - 1 && (
                              <div style={{
                                ...styles.stepLine,
                                background: currentIndex > i ? "#f97316" : "#222",
                              }} />
                            )}
                          </div>
                          <div style={styles.stepRight}>
                            <p style={{
                              ...styles.stepLabel,
                              color: isCompleted ? "#fff" : "#555",
                              fontWeight: isCurrent ? "800" : "600",
                            }}>
                              {step.label}
                              {isCurrent && (
                                <span style={styles.currentBadge}>Current</span>
                              )}
                            </p>
                            <p style={styles.stepDesc}>{step.desc}</p>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* CANCELLED */}
              {order.status === "Cancelled" && (
                <div style={styles.cancelledBox}>
                  ❌ This order has been cancelled.
                </div>
              )}

              {/* CANCEL ORDER BUTTON */}
              {(order.status === "Pending" || order.status === "Processing") && (
                <div style={{ marginTop: "16px" }}>
                  <button onClick={async () => {
                    const reason = window.prompt("Reason for cancellation (optional):");
                    if (reason === null) return;
                    try {
                      const token = sessionStorage.getItem("token");
                      const res = await fetch(`${API}/api/orders/${order._id}/cancel`, {
                        method: "POST",
                        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
                        body: JSON.stringify({ reason })
                      });
                      const data = await res.json();
                      if (data.success) {
                        showToast("Order cancelled. Refund added to your TechMart wallet.", "success");
                        window.location.reload();
                      } else {
                        showToast(data.error || "Could not cancel order", "error");
                      }
                    } catch { showToast("Failed to cancel order", "error"); }
                  }} style={{ width: "100%", padding: "12px", background: "#2a0a0a", border: "1px solid #dc2626", color: "#f87171", borderRadius: "10px", cursor: "pointer", fontWeight: "700", fontSize: "14px" }}>
                    ❌ Cancel Order & Get Refund
                  </button>
                </div>
              )}

              {/* REQUEST RETURN BUTTON */}
              {(order.status === "Delivered" || order.buyerConfirmed) && (
                <div style={{ marginTop: "16px" }}>
                  <button onClick={async () => {
                    const reason = prompt("Reason for return (e.g. wrong item, damaged, not as described):");
                    if (!reason) return;
                    const description = prompt("Additional details (optional):");
                    try {
                      const token = sessionStorage.getItem("token");
                      const res = await fetch(`${API}/api/returns`, {
                        method: "POST",
                        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
                        body: JSON.stringify({ orderId: order._id, reason, description })
                      });
                      const data = await res.json();
                      if (data.success) {
                        showToast("Return request submitted! We will review it within 24 hours.", "success");
                      } else {
                        showToast(data.error || "Could not submit return request", "error");
                      }
                    } catch { showToast("Failed to submit return request", "error"); }
                  }} style={{ width: "100%", padding: "12px", background: "#1a1a2a", border: "1px solid #3b82f6", color: "#60a5fa", borderRadius: "10px", cursor: "pointer", fontWeight: "700", fontSize: "14px" }}>
                    ↩️ Request Return / Refund
                  </button>
                </div>
              )}

              {/* CONFIRM DELIVERY BUTTON */}
              {order.status === "Shipped" && !order.buyerConfirmed && (
                <div style={{ marginTop: "16px" }}>
                  <button onClick={async () => {
                    if (!window.confirm("Confirm you have received this order? This will release payment to the seller.")) return;
                    try {
                      const token = sessionStorage.getItem("token");
                      const res = await fetch(`${API}/api/orders/${order._id}/confirm-delivery`, {
                        method: "POST",
                        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` }
                      });
                      const data = await res.json();
                      if (data.success) {
                        const msg = data.cashback > 0
                          ? `Delivery confirmed! 🎉 You earned ₦${data.cashback.toLocaleString()} cashback in your TechMart wallet!`
                          : "Delivery confirmed! Thank you for shopping on TechMart.";
                        showToast(msg, "success");
                        window.location.reload();
                      } else {
                        showToast(data.error || "Could not confirm delivery", "error");
                      }
                    } catch { showToast("Failed to confirm delivery", "error"); }
                  }} style={{ width: "100%", padding: "12px", background: "linear-gradient(135deg, #16a34a, #15803d)", border: "none", color: "var(--text-primary)", borderRadius: "10px", cursor: "pointer", fontWeight: "700", fontSize: "14px" }}>
                    ✅ Confirm Delivery & Release Payment
                  </button>
                  <p style={{ color: "var(--text-muted)", fontSize: "11px", textAlign: "center", marginTop: "6px" }}>Only confirm after you have received your order</p>
                </div>
              )}

              {/* ORDER ITEMS */}
              {order.items?.length > 0 && (
                <div style={styles.itemsSection}>
                  <h3 style={styles.timelineTitle}>Order Items</h3>
                  {order.items.map((item, i) => (
                    <div key={i} style={styles.itemRow}>
                      <img
                        src={item.images?.[0] || "https://placehold.co/60x60?text=No+Image"}
                        alt={item.name}
                        onError={(e) => { e.target.src = "https://placehold.co/60x60?text=No+Image"; }}
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
                  {/* Reorder Button */}
                  {order.status === "Delivered" && (
                    <button onClick={() => {
                      if (!sessionStorage.getItem("token")) {
                        showToast("Please log in to buy these items again.", "error");
                        return;
                      }

                      order.items.forEach(item => {
                        addToCart({
                          _id: item.productId || item._id,
                          name: item.name,
                          price: item.price,
                          images: item.images || [],
                          stock: item.stock ?? 1
                        });
                      });

                      showToast("Items added to cart!", "success");
                    }} style={{ width: "100%", marginTop: "12px", padding: "10px", background: "linear-gradient(135deg, #f97316, #dc2626)", color: "#fff", border: "none", borderRadius: "8px", cursor: "pointer", fontWeight: "700", fontSize: "13px" }}>
                      🔄 Buy Again
                    </button>
                  )}
                </div>
              )}

            </div>
          )}
        </div>
      )}

      {/* MY ORDERS */}
      {tab === "my" && (
        <div style={styles.card}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
            <h2 style={{ ...styles.cardTitle, margin: 0 }}>📋 My Orders</h2>
            <button onClick={() => { setShowBnpl(!showBnpl); if (!showBnpl && bnplPlans.length === 0) fetchBnplPlans(); }} style={{ padding: "8px 14px", background: showBnpl ? "linear-gradient(135deg, #3b82f6, #1d4ed8)" : "#1a1a1a", border: "1px solid #3b82f6", color: showBnpl ? "#fff" : "#3b82f6", borderRadius: "8px", cursor: "pointer", fontWeight: "700", fontSize: "12px" }}>
              🔄 BNPL Plans
            </button>
          </div>

          {/* BNPL PLANS */}
          {showBnpl && (
            <div style={{ marginBottom: "20px" }}>
              <h3 style={{ color: "#3b82f6", fontSize: "14px", marginBottom: "12px" }}>My Buy Now Pay Later Plans</h3>
              {bnplLoading ? (
                <p style={{ color: "var(--text-muted)" }}>Loading...</p>
              ) : bnplPlans.length === 0 ? (
                <div style={{ background: "var(--bg-card)", border: "1px solid #2a2a2a", borderRadius: "10px", padding: "20px", textAlign: "center" }}>
                  <p style={{ fontSize: "32px", margin: "0 0 8px" }}>🔄</p>
                  <p style={{ color: "var(--text-primary)", fontWeight: "700", margin: "0 0 4px" }}>No BNPL plans yet</p>
                  <p style={{ color: "var(--text-muted)", fontSize: "12px", margin: 0 }}>Complete 3 orders to unlock Buy Now Pay Later</p>
                </div>
              ) : bnplPlans.map((plan, i) => (
                <div key={i} style={{ background: "var(--bg-card)", border: `1px solid ${plan.status === "active" ? "#3b82f6" : plan.status === "completed" ? "#22c55e" : "#dc2626"}`, borderRadius: "12px", padding: "16px", marginBottom: "12px" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "10px" }}>
                    <p style={{ color: "var(--text-primary)", fontWeight: "700", fontSize: "14px", margin: 0 }}>₦{plan.totalAmount.toLocaleString()} — {plan.installments}x Plan</p>
                    <span style={{ background: plan.status === "active" ? "#1a1a3a" : plan.status === "completed" ? "#0a2a1a" : "#2a0a0a", color: plan.status === "active" ? "#3b82f6" : plan.status === "completed" ? "#22c55e" : "#dc2626", padding: "2px 10px", borderRadius: "20px", fontSize: "11px", fontWeight: "700" }}>{plan.status.toUpperCase()}</span>
                  </div>
                  <p style={{ color: "var(--text-muted)", fontSize: "12px", margin: "0 0 10px" }}>{plan.paidInstallments}/{plan.installments} installments paid</p>
                  <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                    {plan.payments.map((p, j) => (
                      <div key={j} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "8px 10px", background: "#111", borderRadius: "6px" }}>
                        <p style={{ color: "var(--text-muted)", fontSize: "12px", margin: 0 }}>Payment {j + 1} — {new Date(p.dueDate).toLocaleDateString("en-NG", { day: "numeric", month: "short", year: "numeric" })}</p>
                        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                          <p style={{ color: "var(--text-primary)", fontWeight: "700", fontSize: "12px", margin: 0 }}>₦{p.amount.toLocaleString()}</p>
                          <span style={{ background: p.status === "paid" ? "#0a2a1a" : p.status === "overdue" ? "#2a0a0a" : "#1a1a1a", color: p.status === "paid" ? "#22c55e" : p.status === "overdue" ? "#dc2626" : "#888", padding: "2px 8px", borderRadius: "10px", fontSize: "10px", fontWeight: "700" }}>{p.status.toUpperCase()}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}

          <h2 style={styles.cardTitle}>📋 My Orders</h2>

          {!user && (
            <div style={styles.errorBox}>
              ⚠️ Please <Link to="/login" style={{ color: "#f97316" }}>login</Link> to view your orders.
            </div>
          )}

          {myOrdersLoading && (
            <div style={styles.centered}>
              <div style={styles.spinner} />
              <p style={{ color: "var(--text-muted)", marginTop: "16px" }}>Loading orders...</p>
            </div>
          )}

          {!myOrdersLoading && myOrders.length === 0 && (
            <div style={styles.centered}>
              <span style={{ fontSize: "48px" }}>📦</span>
              <p style={{ color: "var(--text-muted)", marginTop: "16px" }}>No orders yet</p>
              <Link to="/">
                <button style={styles.orangeBtn}>Shop Now</button>
              </Link>
            </div>
          )}

          {myOrders.map((o) => (
            <div key={o._id} style={styles.myOrderCard}>
              <div style={styles.myOrderHeader}>
                <div>
                  <p style={styles.myOrderRef}>{o.reference}</p>
                  <p style={styles.myOrderDate}>
                    {new Date(o.createdAt).toLocaleDateString("en-NG", {
                      year: "numeric", month: "long", day: "numeric"
                    })}
                  </p>
                </div>
                <div style={styles.myOrderRight}>
                  <p style={styles.myOrderAmount}>₦{o.amount?.toLocaleString()}</p>
                  <span style={{
                    ...styles.badge,
                    background: getStatusColor(o.status)
                  }}>
                    {o.status}
                  </span>
                </div>
              </div>

              {/* MINI TIMELINE */}
              {o.status !== "Cancelled" && (
                <div style={styles.miniTimeline}>
                  {STEPS.map((step, i) => {
                    const currentIndex = getStatusIndex(o.status);
                    const isCompleted = currentIndex >= i;
                    return (
                      <div key={step.label} style={styles.miniStep}>
                        <div style={{
                          ...styles.miniDot,
                          background: isCompleted ? "#f97316" : "#222",
                          border: isCompleted ? "none" : "2px solid #333",
                        }} />
                        {i < STEPS.length - 1 && (
                          <div style={{
                            ...styles.miniLine,
                            background: currentIndex > i ? "#f97316" : "#222",
                          }} />
                        )}
                        <p style={{
                          ...styles.miniLabel,
                          color: isCompleted ? "#fff" : "#555",
                        }}>
                          {step.icon}
                        </p>
                      </div>
                    );
                  })}
                </div>
              )}

              <div style={{ display: "flex", gap: "10px", marginTop: "12px" }}>
                <button
                  onClick={() => {
                    setReference(o.reference);
                    setTab("track");
                    trackOrder();
                  }}
                  style={styles.viewBtn}
                >
                  View Details →
                </button>
                {o.trackingNumber && (
                  <p style={styles.trackingNum}>
                    🚚 {o.trackingNumber}
                  </p>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

    </div>
  );
}

const styles = {
  page: { maxWidth: "800px", margin: "0 auto", padding: "32px 16px", minHeight: "100vh" },
  header: { display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "32px", flexWrap: "wrap", gap: "16px" },
  title: { color: "var(--text-primary)", fontSize: "28px", fontWeight: "800", margin: 0 },
  subtitle: { color: "var(--text-muted)", fontSize: "14px", marginTop: "4px" },
  backBtn: { background: "var(--bg-card)", border: "1px solid var(--border-color)", color: "var(--text-primary)", padding: "10px 18px", borderRadius: "8px", cursor: "pointer", fontSize: "14px" },
  tabRow: { display: "flex", gap: "10px", marginBottom: "24px", flexWrap: "wrap" },
  tabBtn: { padding: "10px 20px", borderRadius: "10px", fontSize: "14px", fontWeight: "600", cursor: "pointer" },
  card: { background: "var(--bg-secondary)", border: "1px solid var(--border-light)", borderRadius: "20px", padding: "32px", marginBottom: "24px" },
  cardTitle: { color: "var(--text-primary)", fontSize: "20px", fontWeight: "700", marginBottom: "8px" },
  cardSubtitle: { color: "var(--text-muted)", fontSize: "14px", marginBottom: "24px" },
  searchRow: { display: "flex", gap: "12px", flexWrap: "wrap" },
  input: { flex: 1, minWidth: "0", padding: "12px 20px", borderRadius: "10px", border: "1px solid var(--border-color)", background: "var(--bg-card)", color: "var(--text-primary)", fontSize: "15px", outline: "none" },
  orangeBtn: { padding: "12px 24px", background: "linear-gradient(135deg, #f97316, #dc2626)", color: "var(--text-primary)", border: "none", borderRadius: "10px", cursor: "pointer", fontWeight: "700", fontSize: "15px" },
  errorBox: { background: "#2a1010", border: "1px solid #dc2626", color: "#f87171", padding: "12px 16px", borderRadius: "10px", fontSize: "14px", marginTop: "16px" },
  orderResult: { marginTop: "32px", display: "flex", flexDirection: "column", gap: "24px" },
  orderInfo: { background: "var(--bg-card)", border: "1px solid #2a2a2a", borderRadius: "16px", padding: "20px" },
  orderInfoRow: { display: "flex", justifyContent: "space-between", alignItems: "center", padding: "10px 0", borderBottom: "1px solid var(--border-light)" },
  infoLabel: { color: "var(--text-muted)", fontSize: "14px" },
  infoValue: { color: "var(--text-primary)", fontSize: "14px", fontWeight: "600" },
  badge: { color: "var(--text-primary)", padding: "4px 12px", borderRadius: "999px", fontSize: "12px", fontWeight: "700" },
  timeline: { background: "var(--bg-card)", border: "1px solid #2a2a2a", borderRadius: "16px", padding: "24px" },
  timelineTitle: { color: "var(--text-primary)", fontSize: "16px", fontWeight: "700", marginBottom: "24px" },
  steps: { display: "flex", flexDirection: "column", gap: "0" },
  stepWrap: { display: "flex", gap: "16px" },
  stepLeft: { display: "flex", flexDirection: "column", alignItems: "center" },
  stepCircle: { width: "44px", height: "44px", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, transition: "all 0.3s" },
  stepLine: { width: "2px", height: "40px", transition: "background 0.3s" },
  stepRight: { paddingBottom: "32px", flex: 1 },
  stepLabel: { fontSize: "15px", margin: "8px 0 4px", display: "flex", alignItems: "center", gap: "8px" },
  currentBadge: { background: "#f97316", color: "var(--text-primary)", fontSize: "10px", padding: "2px 8px", borderRadius: "999px", fontWeight: "700" },
  stepDesc: { color: "var(--text-muted)", fontSize: "13px", margin: 0 },
  cancelledBox: { background: "#2a1010", border: "1px solid #dc2626", color: "#f87171", padding: "16px", borderRadius: "12px", fontSize: "15px", textAlign: "center" },
  itemsSection: { background: "var(--bg-card)", border: "1px solid #2a2a2a", borderRadius: "16px", padding: "20px" },
  itemRow: { display: "flex", alignItems: "center", gap: "16px", paddingBottom: "16px", marginBottom: "16px", borderBottom: "1px solid var(--border-light)" },
  itemImg: { width: "60px", height: "60px", objectFit: "cover", borderRadius: "10px", background: "var(--bg-input)", flexShrink: 0 },
  itemDetails: { flex: 1 },
  itemName: { color: "var(--text-primary)", fontWeight: "600", fontSize: "14px", margin: "0 0 4px" },
  itemQty: { color: "var(--text-muted)", fontSize: "13px", margin: 0 },
  itemPrice: { color: "#f97316", fontWeight: "700", fontSize: "15px" },
  centered: { display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "40px 0", gap: "16px" },
  spinner: { width: "40px", height: "40px", border: "4px solid #333", borderTop: "4px solid #f97316", borderRadius: "50%", animation: "spin 0.8s linear infinite" },
  myOrderCard: { background: "var(--bg-card)", border: "1px solid #2a2a2a", borderRadius: "16px", padding: "20px", marginBottom: "16px" },
  myOrderHeader: { display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: "12px", marginBottom: "16px" },
  myOrderRef: { color: "var(--text-primary)", fontWeight: "700", fontSize: "15px", margin: "0 0 4px" },
  myOrderDate: { color: "var(--text-muted)", fontSize: "13px", margin: 0 },
  myOrderRight: { display: "flex", flexDirection: "column", alignItems: "flex-end", gap: "8px" },
  myOrderAmount: { color: "#f97316", fontWeight: "800", fontSize: "18px", margin: 0 },
  miniTimeline: { display: "flex", alignItems: "center" },
  miniStep: { display: "flex", alignItems: "center", flex: 1 },
  miniDot: { width: "16px", height: "16px", borderRadius: "50%", flexShrink: 0 },
  miniLine: { flex: 1, height: "2px" },
  miniLabel: { fontSize: "16px", margin: "0 0 0 4px" },
  viewBtn: { padding: "8px 16px", background: "transparent", border: "1px solid #f97316", color: "#f97316", borderRadius: "8px", cursor: "pointer", fontSize: "13px", fontWeight: "600" },
  trackingNum: { color: "#3b82f6", fontSize: "13px", fontWeight: "600", margin: "auto 0" },
};
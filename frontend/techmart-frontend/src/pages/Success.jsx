import { useEffect, useState } from "react";
import confetti from "canvas-confetti";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { useContext } from "react";
import { CartContext } from "../context/CartContext";

export default function Success() {
  const { clearCart } = useContext(CartContext);
  const navigate = useNavigate();
  const [countdown, setCountdown] = useState(10);
  const user = (() => { try { return JSON.parse(localStorage.getItem("user")); } catch { return null; } })();
  const [searchParams] = useSearchParams();
  const isPOD = searchParams.get("pod") === "true";
  const reference = searchParams.get("reference");

  useEffect(() => {
    // Clear cart on successful payment
    clearCart();

    // 🎉 Confetti celebration
    const duration = 3000;
    const end = Date.now() + duration;
    const frame = () => {
      confetti({
        particleCount: 3,
        angle: 60,
        spread: 55,
        origin: { x: 0 },
        colors: ["#f97316", "#dc2626", "#22c55e", "#3b82f6", "#ffffff"]
      });
      confetti({
        particleCount: 3,
        angle: 120,
        spread: 55,
        origin: { x: 1 },
        colors: ["#f97316", "#dc2626", "#22c55e", "#3b82f6", "#ffffff"]
      });
      if (Date.now() < end) requestAnimationFrame(frame);
    };
    frame();

    // Auto redirect countdown
    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          navigate("/");
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  return (
    <div style={styles.page}>
      <div style={styles.card}>

        {/* SUCCESS ICON */}
        <div style={styles.iconWrap}>
          <div style={styles.iconCircle}>
            <span style={{ fontSize: "48px" }}>✅</span>
          </div>
        </div>

        {/* TITLE */}
        <h1 style={styles.title}>{isPOD ? "Order Placed!" : "Payment Successful!"}</h1>
        <p style={styles.subtitle}>
          Thank you{user?.name ? `, ${user.name}` : ""}! {isPOD ? "Your order has been placed. Please have cash ready for delivery." : "Your order has been placed successfully."}
        </p>

        {/* ORDER DETAILS */}
        <div style={styles.detailsCard}>
          <div style={styles.detailRow}>
            <span style={styles.detailLabel}>Status</span>
            <span style={isPOD ? {...styles.successBadge, background: "#0a2a1a", color: "#22c55e", border: "1px solid #22c55e"} : styles.successBadge}>{isPOD ? "💵 Pay on Delivery" : "✅ Confirmed"}</span>
          </div>
          <div style={styles.detailRow}>
            <span style={styles.detailLabel}>Delivery</span>
            <span style={styles.detailValue}>2-5 business days</span>
          </div>
          {isPOD && (
            <div style={{ background: "rgba(34,197,94,0.08)", border: "1px solid #22c55e", borderRadius: "10px", padding: "12px", marginTop: "12px" }}>
              <p style={{ color: "#22c55e", fontWeight: "700", fontSize: "14px", margin: "0 0 4px" }}>Pay on Delivery Instructions</p>
              <p style={{ color: "#86efac", fontSize: "13px", margin: 0 }}>Please have the exact cash amount ready when our delivery agent arrives. Do not pay before inspecting your item.</p>
            </div>
          )}
          <div style={styles.detailRow}>
            <span style={styles.detailLabel}>Email</span>
            <span style={styles.detailValue}>{user?.email || "—"}</span>
          </div>
        </div>

        {/* WHAT'S NEXT */}
        <div style={styles.stepsCard}>
          <h3 style={styles.stepsTitle}>What happens next?</h3>
          <div style={styles.step}>
            <span style={styles.stepIcon}>📧</span>
            <div>
              <p style={styles.stepTitle}>Confirmation Email</p>
              <p style={styles.stepDesc}>You'll receive an order confirmation at your email.</p>
            </div>
          </div>
          <div style={styles.step}>
            <span style={styles.stepIcon}>📦</span>
            <div>
              <p style={styles.stepTitle}>Order Processing</p>
              <p style={styles.stepDesc}>We'll prepare your items within 24 hours.</p>
            </div>
          </div>
          <div style={styles.step}>
            <span style={styles.stepIcon}>🚚</span>
            <div>
              <p style={styles.stepTitle}>Delivery</p>
              <p style={styles.stepDesc}>Your order will arrive in 2-5 business days.</p>
            </div>
          </div>
        </div>

        {/* COUNTDOWN */}
        <p style={styles.countdownText}>
          Redirecting to home in{" "}
          <span style={{ color: "#f97316", fontWeight: "700" }}>{countdown}s</span>
        </p>

        {/* BUTTONS */}
        <div style={styles.btnRow}>
          <Link to="/" style={{ flex: 1 }}>
            <button style={styles.primaryBtn}>
              🛍️ Continue Shopping
            </button>
          </Link>
          <Link to="/tracking" style={{ flex: 1 }}>
            <button style={styles.secondaryBtn}>
              📦 View Orders
            </button>
          </Link>
        </div>

      </div>
    </div>
  );
}

const styles = {
  page: {
    minHeight: "100vh",
    background: "var(--bg-primary)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    padding: "24px",
  },
  card: {
    background: "var(--bg-secondary)",
    border: "1px solid var(--border-light)",
    borderRadius: "24px",
    padding: "48px 40px",
    maxWidth: "520px",
    width: "100%",
    textAlign: "center",
    boxShadow: "0 8px 40px rgba(0,0,0,0.6)",
  },
  iconWrap: {
    display: "flex",
    justifyContent: "center",
    marginBottom: "24px",
  },
  iconCircle: {
    width: "96px",
    height: "96px",
    borderRadius: "50%",
    background: "rgba(34,197,94,0.15)",
    border: "2px solid #22c55e",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  },
  title: {
    color: "var(--text-primary)",
    fontSize: "28px",
    fontWeight: "800",
    marginBottom: "10px",
  },
  subtitle: {
    color: "var(--text-muted)",
    fontSize: "15px",
    marginBottom: "28px",
    lineHeight: "1.6",
  },
  detailsCard: {
    background: "var(--bg-card)",
    border: "1px solid var(--border-color)",
    borderRadius: "14px",
    padding: "20px",
    marginBottom: "20px",
    textAlign: "left",
  },
  detailRow: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    padding: "10px 0",
    borderBottom: "1px solid var(--border-light)",
  },
  detailLabel: {
    color: "var(--text-muted)",
    fontSize: "14px",
  },
  detailValue: {
    color: "var(--text-primary)",
    fontSize: "14px",
    fontWeight: "600",
  },
  successBadge: {
    background: "#14532d",
    border: "1px solid #22c55e",
    color: "#22c55e",
    padding: "4px 12px",
    borderRadius: "999px",
    fontSize: "13px",
    fontWeight: "600",
  },
  stepsCard: {
    background: "var(--bg-card)",
    border: "1px solid var(--border-color)",
    borderRadius: "14px",
    padding: "20px",
    marginBottom: "24px",
    textAlign: "left",
  },
  stepsTitle: {
    color: "var(--text-primary)",
    fontSize: "15px",
    fontWeight: "700",
    marginBottom: "16px",
  },
  step: {
    display: "flex",
    alignItems: "flex-start",
    gap: "14px",
    marginBottom: "16px",
  },
  stepIcon: {
    fontSize: "24px",
    flexShrink: 0,
  },
  stepTitle: {
    color: "var(--text-primary)",
    fontSize: "14px",
    fontWeight: "600",
    margin: "0 0 4px",
  },
  stepDesc: {
    color: "var(--text-muted)",
    fontSize: "13px",
    margin: 0,
    lineHeight: "1.5",
  },
  countdownText: {
    color: "#555",
    fontSize: "13px",
    marginBottom: "20px",
  },
  btnRow: {
    display: "flex",
    gap: "12px",
  },
  primaryBtn: {
    width: "100%",
    padding: "14px",
    background: "linear-gradient(135deg, #f97316, #dc2626)",
    color: "var(--text-primary)",
    border: "none",
    borderRadius: "12px",
    fontSize: "15px",
    fontWeight: "700",
    cursor: "pointer",
  },
  secondaryBtn: {
    width: "100%",
    padding: "14px",
    background: "transparent",
    color: "var(--text-primary)",
    border: "1px solid var(--border-color)",
    borderRadius: "12px",
    fontSize: "15px",
    fontWeight: "600",
    cursor: "pointer",
  },
};
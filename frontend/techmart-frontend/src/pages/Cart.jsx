import { useState } from "react";
import { Link } from "react-router-dom";
import { useContext } from "react";
import { CartContext } from "../context/CartContext";

const FALLBACK_IMG = "https://placehold.co/150x150?text=No+Image";

export default function Cart() {
  const { cart, removeFromCart, clearCart, updateQuantity } = useContext(CartContext);

  const total = cart.reduce(
    (sum, item) => sum + item.price * (item.quantity || 1),
    0
  );

  if (cart.length === 0) {
    return (
      <div style={styles.emptyWrap}>
        <span style={{ fontSize: "64px" }}>🛒</span>
        <h2 style={{ color: "#fff", marginTop: "16px" }}>Your cart is empty</h2>
        <p style={{ color: "#888", marginBottom: "24px" }}>Looks like you haven't added anything yet.</p>
        <Link to="/">
          <button style={styles.greenBtn}>Shop Now</button>
        </Link>
      </div>
    );
  }

  return (
    <div style={styles.container}>

      {/* HEADER */}
      <div style={styles.header}>
        <h1 style={styles.title}>🛒 Shopping Cart
          <span style={styles.badge}>{cart.length} item{cart.length !== 1 ? "s" : ""}</span>
        </h1>
        <Link to="/">
          <button style={styles.blackBtn}>← Continue Shopping</button>
        </Link>
      </div>

      <div style={styles.layout}>

        {/* CART ITEMS */}
        <div style={styles.itemsCol}>
          {cart.map((item) => (
            <div key={item._id} style={styles.card}>

              {/* IMAGE */}
              <img
                src={item.images?.[0] || FALLBACK_IMG}
                alt={item.name}
                onError={(e) => { e.target.src = FALLBACK_IMG; }}
                style={styles.img}
              />

              {/* DETAILS */}
              <div style={styles.details}>
                <h3 style={styles.itemName}>{item.name}</h3>
                <p style={styles.itemCategory}>{item.category}</p>
                <p style={styles.itemPrice}>₦{(item.price * (item.quantity || 1)).toLocaleString()}</p>
                <p style={{ color: "#888", fontSize: "13px" }}>
                  ₦{item.price?.toLocaleString()} each
                </p>

                {/* QUANTITY CONTROLS */}
                <div style={styles.qtyRow}>
                  <button
                    onClick={() => updateQuantity(item._id, (item.quantity || 1) - 1)}
                    style={styles.qtyBtn}
                  >
                    −
                  </button>
                  <span style={styles.qtyNum}>{item.quantity || 1}</span>
                  <button
                    onClick={() => updateQuantity(item._id, (item.quantity || 1) + 1)}
                    style={styles.qtyBtn}
                  >
                    +
                  </button>
                </div>
              </div>

              {/* REMOVE */}
              <button
                onClick={() => removeFromCart(item._id)}
                style={styles.removeBtn}
                title="Remove item"
              >
                🗑️
              </button>

            </div>
          ))}

          {/* CLEAR CART */}
          <button onClick={clearCart} style={styles.clearBtn}>
            🗑️ Clear Cart
          </button>
        </div>

        {/* ORDER SUMMARY */}
        <div style={styles.summary}>
          <h2 style={styles.summaryTitle}>Order Summary</h2>

          <div style={styles.summaryRow}>
            <span style={{ color: "#888" }}>Subtotal ({cart.length} items)</span>
            <span style={{ color: "#fff" }}>₦{total.toLocaleString()}</span>
          </div>

          <div style={styles.summaryRow}>
            <span style={{ color: "#888" }}>Delivery</span>
            <span style={{ color: "#86efac" }}>Free</span>
          </div>

          <div style={styles.divider} />

          <div style={styles.summaryRow}>
            <span style={{ color: "#fff", fontWeight: "700", fontSize: "18px" }}>Total</span>
            <span style={{ color: "#f97316", fontWeight: "800", fontSize: "20px" }}>
              ₦{total.toLocaleString()}
            </span>
          </div>

          <Link to="/checkout" style={{ display: "block", marginTop: "24px" }}>
            <button style={styles.checkoutBtn}>
              Proceed to Payment →
            </button>
          </Link>

          <Link to="/" style={{ display: "block", marginTop: "12px", textAlign: "center" }}>
            <span style={{ color: "#888", fontSize: "13px" }}>or continue shopping</span>
          </Link>
        </div>

      </div>
    </div>
  );
}

const styles = {
  container: {
    maxWidth: "1100px",
    margin: "0 auto",
    padding: "32px 16px",
    minHeight: "100vh",
  },
  header: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: "32px",
    flexWrap: "wrap",
    gap: "12px",
  },
  title: {
    color: "#fff",
    fontSize: "28px",
    fontWeight: "800",
    display: "flex",
    alignItems: "center",
    gap: "12px",
  },
  badge: {
    background: "#f97316",
    color: "#fff",
    fontSize: "13px",
    fontWeight: "600",
    padding: "4px 10px",
    borderRadius: "999px",
  },
  layout: {
    display: "grid",
    gridTemplateColumns: "1fr 340px",
    gap: "32px",
    alignItems: "start",
  },
  itemsCol: {
    display: "flex",
    flexDirection: "column",
    gap: "16px",
  },
  card: {
    background: "#1a1a1a",
    border: "1px solid #2a2a2a",
    borderRadius: "16px",
    padding: "20px",
    display: "flex",
    gap: "20px",
    alignItems: "center",
    flexWrap: "wrap",
  },
  img: {
    width: "120px",
    height: "120px",
    objectFit: "cover",
    borderRadius: "12px",
    background: "#222",
    flexShrink: 0,
  },
  details: {
    flex: 1,
    minWidth: "180px",
  },
  itemName: {
    color: "#fff",
    fontSize: "16px",
    fontWeight: "700",
    marginBottom: "4px",
  },
  itemCategory: {
    color: "#888",
    fontSize: "12px",
    marginBottom: "8px",
    textTransform: "uppercase",
    letterSpacing: "1px",
  },
  itemPrice: {
    color: "#f97316",
    fontSize: "18px",
    fontWeight: "800",
    marginBottom: "4px",
  },
  qtyRow: {
    display: "flex",
    alignItems: "center",
    gap: "12px",
    marginTop: "12px",
  },
  qtyBtn: {
    width: "32px",
    height: "32px",
    borderRadius: "8px",
    border: "1px solid #333",
    background: "#222",
    color: "#fff",
    fontSize: "18px",
    cursor: "pointer",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  },
  qtyNum: {
    color: "#fff",
    fontSize: "16px",
    fontWeight: "700",
    minWidth: "24px",
    textAlign: "center",
  },
  removeBtn: {
    background: "transparent",
    border: "1px solid #333",
    borderRadius: "8px",
    padding: "8px 12px",
    fontSize: "18px",
    cursor: "pointer",
    color: "#fff",
    transition: "background 0.2s",
  },
  clearBtn: {
    background: "transparent",
    border: "1px solid #333",
    color: "#888",
    padding: "12px 20px",
    borderRadius: "10px",
    cursor: "pointer",
    fontSize: "14px",
    alignSelf: "flex-start",
    marginTop: "8px",
  },
  summary: {
    background: "#1a1a1a",
    border: "1px solid #2a2a2a",
    borderRadius: "16px",
    padding: "24px",
    position: "sticky",
    top: "90px",
  },
  summaryTitle: {
    color: "#fff",
    fontSize: "18px",
    fontWeight: "700",
    marginBottom: "20px",
  },
  summaryRow: {
    display: "flex",
    justifyContent: "space-between",
    marginBottom: "12px",
    fontSize: "15px",
  },
  divider: {
    borderTop: "1px solid #2a2a2a",
    margin: "16px 0",
  },
  checkoutBtn: {
    width: "100%",
    padding: "14px",
    background: "linear-gradient(135deg, #f97316, #dc2626)",
    color: "#fff",
    border: "none",
    borderRadius: "12px",
    fontSize: "16px",
    fontWeight: "700",
    cursor: "pointer",
  },
  emptyWrap: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    minHeight: "70vh",
    textAlign: "center",
  },
  blackBtn: {
    padding: "10px 18px",
    background: "#1a1a1a",
    color: "#fff",
    border: "1px solid #333",
    borderRadius: "8px",
    cursor: "pointer",
    fontSize: "14px",
  },
  greenBtn: {
    padding: "14px 28px",
    background: "linear-gradient(135deg, #f97316, #dc2626)",
    color: "#fff",
    border: "none",
    borderRadius: "12px",
    cursor: "pointer",
    fontWeight: "700",
    fontSize: "16px",
  },
};
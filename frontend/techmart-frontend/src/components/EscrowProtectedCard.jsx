import React from "react";

const styles = {
  card: {
    background: "var(--bg-card)",
    border: "1px solid rgba(34, 197, 94, 0.35)",
    borderRadius: "16px",
    padding: "20px",
    boxShadow: "0 8px 30px rgba(0,0,0,0.12)",
  },
  header: {
    display: "flex",
    alignItems: "flex-start",
    gap: "12px",
    marginBottom: "16px",
  },
  icon: {
    width: "42px",
    height: "42px",
    borderRadius: "12px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    background: "rgba(34, 197, 94, 0.12)",
    fontSize: "21px",
    flexShrink: 0,
  },
  title: {
    margin: 0,
    color: "var(--text-primary)",
    fontSize: "16px",
    fontWeight: "800",
  },
  subtitle: {
    margin: "4px 0 0",
    color: "var(--text-muted)",
    fontSize: "12px",
    lineHeight: 1.5,
  },
  status: {
    marginLeft: "auto",
    padding: "5px 9px",
    borderRadius: "999px",
    fontSize: "10px",
    fontWeight: "800",
    whiteSpace: "nowrap",
  },
  steps: {
    display: "flex",
    flexDirection: "column",
    gap: "0",
  },
  step: {
    display: "flex",
    gap: "12px",
    minHeight: "52px",
  },
  left: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    flexShrink: 0,
  },
  dot: {
    width: "28px",
    height: "28px",
    borderRadius: "50%",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: "12px",
    fontWeight: "800",
    zIndex: 1,
  },
  line: {
    width: "2px",
    flex: 1,
    minHeight: "24px",
  },
  content: {
    paddingBottom: "14px",
    flex: 1,
  },
  label: {
    margin: "3px 0 3px",
    color: "var(--text-primary)",
    fontSize: "13px",
    fontWeight: "700",
  },
  desc: {
    margin: 0,
    color: "var(--text-muted)",
    fontSize: "11px",
    lineHeight: 1.45,
  },
  footer: {
    marginTop: "8px",
    padding: "11px 12px",
    borderRadius: "10px",
    background: "rgba(34, 197, 94, 0.07)",
    border: "1px solid rgba(34, 197, 94, 0.18)",
    color: "var(--text-muted)",
    fontSize: "11px",
    lineHeight: 1.5,
  },
};

export default function EscrowProtectedCard({ order }) {
  if (!order) return null;

  const released =
    order.escrowStatus === "released" ||
    Boolean(order.escrowReleasedAt);

  const cancelled = order.status === "Cancelled";

  const delivered =
    order.status === "Delivered" ||
    Boolean(order.buyerConfirmed);

  const shipped =
    order.status === "Shipped" ||
    delivered;

  const paid =
    ["Paid", "Shipped", "Delivered"].includes(order.status) ||
    delivered ||
    Boolean(order.paymentStatus === "success");

  const steps = [
    {
      label: "Payment secured",
      desc: "Your payment is protected while the order is being fulfilled.",
      done: paid,
      icon: "💳",
    },
    {
      label: "Seller fulfillment",
      desc: shipped
        ? "The seller has moved the order into delivery."
        : "Funds remain protected while the seller prepares your order.",
      done: shipped,
      icon: "📦",
    },
    {
      label: "Delivery confirmed",
      desc: delivered
        ? "Delivery has been confirmed."
        : "Confirm delivery after you physically receive your order.",
      done: delivered,
      icon: "🚚",
    },
    {
      label: "Escrow released",
      desc: released
        ? "Escrow has been released according to the order's protection flow."
        : "Seller funds remain protected until the required confirmation.",
      done: released,
      icon: "🔓",
    },
  ];

  if (cancelled) {
    return (
      <div style={styles.card}>
        <div style={styles.header}>
          <div style={styles.icon}>🛡️</div>
          <div>
            <h3 style={styles.title}>TechMart Escrow Protection</h3>
            <p style={styles.subtitle}>
              This order is cancelled and is no longer progressing through
              the normal delivery flow.
            </p>
          </div>
          <span
            style={{
              ...styles.status,
              background: "rgba(220,38,38,0.12)",
              color: "#f87171",
            }}
          >
            CANCELLED
          </span>
        </div>
      </div>
    );
  }

  const statusText = released
    ? "RELEASED"
    : delivered
    ? "DELIVERY CONFIRMED"
    : "PROTECTED";

  const statusStyle = released
    ? {
        background: "rgba(34,197,94,0.12)",
        color: "#22c55e",
      }
    : {
        background: "rgba(59,130,246,0.12)",
        color: "#60a5fa",
      };

  return (
    <div style={styles.card}>
      <div style={styles.header}>
        <div style={styles.icon}>🔐</div>

        <div>
          <h3 style={styles.title}>TechMart Escrow Protection</h3>
          <p style={styles.subtitle}>
            Your payment is protected while this order moves through delivery.
          </p>
        </div>

        <span style={{ ...styles.status, ...statusStyle }}>
          {statusText}
        </span>
      </div>

      <div style={styles.steps}>
        {steps.map((step, index) => (
          <div key={step.label} style={styles.step}>
            <div style={styles.left}>
              <div
                style={{
                  ...styles.dot,
                  background: step.done
                    ? "linear-gradient(135deg, #16a34a, #22c55e)"
                    : "var(--bg-secondary)",
                  border: step.done
                    ? "none"
                    : "2px solid var(--border-color)",
                  color: step.done ? "#fff" : "var(--text-muted)",
                }}
              >
                {step.done ? "✓" : step.icon}
              </div>

              {index < steps.length - 1 && (
                <div
                  style={{
                    ...styles.line,
                    background: steps[index + 1].done
                      ? "#22c55e"
                      : "var(--border-color)",
                  }}
                />
              )}
            </div>

            <div style={styles.content}>
              <p style={styles.label}>{step.label}</p>
              <p style={styles.desc}>{step.desc}</p>
            </div>
          </div>
        ))}
      </div>

      <div style={styles.footer}>
        🛡️ <strong>Buyer protection:</strong>{" "}
        Only confirm delivery after you have actually received the order.
        The order's escrow state is controlled by the TechMart backend.
      </div>
    </div>
  );
}

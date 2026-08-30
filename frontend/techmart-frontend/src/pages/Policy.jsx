import React from "react";

const styles = {
  container: {
    padding: "24px 16px 80px",
    backgroundColor: "var(--bg-primary)",
    minHeight: "100vh",
    boxSizing: "border-box",
  },
  card: {
    backgroundColor: "#121212",
    borderRadius: "12px",
    padding: "24px 20px",
    width: "100%",
    maxWidth: "800px",
    margin: "0 auto",
    border: "1px solid var(--border-color)",
    boxSizing: "border-box",
  },
  mainTitle: {
    fontSize: "24px",
    fontWeight: "bold",
    color: "var(--text-primary)",
    margin: "0 0 8px 0",
    textAlign: "center",
  },
  subtitle: {
    fontSize: "14px",
    color: "var(--text-muted)",
    margin: "0 0 20px 0",
    textAlign: "center",
  },
  divider: {
    border: "0",
    height: "1px",
    backgroundColor: "#222",
    marginBottom: "24px",
  },
  section: {
    marginBottom: "28px",
  },
  sectionTitle: {
    fontSize: "18px",
    fontWeight: "600",
    color: "#3b82f6", // Clean modern marketplace blue Accent
    margin: "0 0 12px 0",
  },
  text: {
    fontSize: "15px",
    lineHeight: "1.6",
    color: "#ccc",
    margin: "0 0 12px 0",
  },
  bulletBox: {
    backgroundColor: "#1a1a1a",
    padding: "16px",
    borderRadius: "8px",
    borderLeft: "4px solid #3b82f6",
    marginTop: "12px",
  },
  bulletItem: {
    fontSize: "14px",
    lineHeight: "1.5",
    color: "#ddd",
    margin: "0 0 10px 0",
  },
};

export default function Policy() {
  return (
    <div style={styles.container}>
      <div style={styles.card}>
        <h1 style={styles.mainTitle}>TechMart Legal Policy</h1>
        <p style={styles.subtitle}>Last updated: May 2026</p>
        
        <hr style={styles.divider} />

        {/* 1. Privacy Policy Section */}
        <section style={styles.section}>
          <h2 style={styles.sectionTitle}>1. Privacy Policy</h2>
          <p style={styles.text}>
            At TechMart, your privacy is our priority. We collect essential information 
            required to process your orders, manage your marketplace interactions, and 
            provide tailored AI recommendations. Your data is encrypted and secure. 
            We do not sell, trade, or share your personal profile details with third-party marketers.
          </p>
        </section>

        {/* 2. Refund Policy Section */}
        <section style={styles.section}>
          <h2 style={styles.sectionTitle}>2. 7-Days Refund Policy</h2>
          <p style={styles.text}>
            We stand behind every piece of hardware and consumer electronic listed on our marketplace. 
            If you are not completely satisfied with your purchase, you are eligible for a full 
            refund or replacement within <strong>7 days</strong> of delivery.
          </p>
          <div style={styles.bulletBox}>
            <p style={styles.bulletItem}>📦 <strong>Condition:</strong> Items must be returned in their original packaging with all included accessories.</p>
            <p style={styles.bulletItem}>🚚 <strong>Fulfillment:</strong> Our official, full-time TechMart delivery riders will come directly to your location to pick up and process verified return requests securely.</p>
            <p style={styles.bulletItem}>💳 <strong>Reimbursement:</strong> Once processed, refunds are credited back instantly to your account via our secure payment gateway infrastructure.</p>
          </div>
        </section>

        {/* 3. Terms of Service */}
        <section style={styles.section}>
          <h2 style={styles.sectionTitle}>3. Terms of Service</h2>
          <p style={styles.text}>
            By utilizing the TechMart platform, you agree to our marketplace terms. 
            All listings are subject to local merchant verification rules, and real-time tracking 
            status updates will be dynamically delivered via automated SMS and WhatsApp alerts.
          </p>
        </section>
      </div>
    </div>
  );
}

// Mobile-first, stable css-in-js styles
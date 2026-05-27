import { useState } from "react";
import { Link } from "react-router-dom";

const SECTIONS = ["Terms of Service", "Privacy Policy", "Refund Policy", "Shipping Policy"];

export default function Policy() {
  const [active, setActive] = useState("Terms of Service");

  return (
    <div style={styles.page}>

      {/* HEADER */}
      <div style={styles.header}>
        <div>
          <h1 style={styles.title}>📋 Legal & Policies</h1>
          <p style={styles.subtitle}>Last updated: May 2025</p>
        </div>
        <Link to="/"><button style={styles.backBtn}>← Back to Store</button></Link>
      </div>

      {/* NAV TABS */}
      <div style={styles.sidebar}>
        {SECTIONS.map(s => (
          <button
            key={s}
            onClick={() => setActive(s)}
            style={{
              ...styles.sideBtn,
              background: active === s ? "linear-gradient(135deg, #f97316, #dc2626)" : "#1a1a1a",
              color: active === s ? "#fff" : "#888",
              border: active === s ? "none" : "1px solid #333",
            }}
          >
            {s === "Terms of Service" && "📜 "}
            {s === "Privacy Policy" && "🔒 "}
            {s === "Refund Policy" && "↩️ "}
            {s === "Shipping Policy" && "🚚 "}
            {s}
          </button>
        ))}
      </div>

      {/* TRUST BADGES */}
      <div style={styles.trustCard}>
        <p style={styles.trustTitle}>🛡️ Our Guarantees</p>
        {[
          { icon: "↩️", text: "7-Day Refund" },
          { icon: "🔒", text: "Secure Payments" },
          { icon: "📦", text: "Free Delivery" },
          { icon: "✅", text: "Verified Products" },
          { icon: "🤖", text: "24/7 AI Support" },
        ].map(b => (
          <div key={b.text} style={styles.trustItem}>
            <span style={{ fontSize: "16px" }}>{b.icon}</span>
            <span style={{ color: "#aaa", fontSize: "13px" }}>{b.text}</span>
          </div>
        ))}
      </div>

      {/* CONTENT */}
      <div style={styles.content}>

        {/* TERMS OF SERVICE */}
        {active === "Terms of Service" && (
          <div>
            <h2 style={styles.sectionTitle}>📜 Terms of Service</h2>
            <p style={styles.intro}>
              Welcome to TechMart. By accessing or using our platform, you agree to be bound by these Terms of Service. Please read them carefully.
            </p>
            {[
              { title: "1. Acceptance of Terms", content: "By creating an account or making a purchase on TechMart, you agree to these terms. If you do not agree, please do not use our services." },
              { title: "2. Account Responsibility", content: "You are responsible for maintaining the confidentiality of your account credentials. You agree to notify us immediately of any unauthorized use of your account. TechMart will not be liable for any loss resulting from unauthorized account use." },
              { title: "3. Product Listings", content: "TechMart strives to provide accurate product descriptions, images, and pricing. However, we reserve the right to correct errors and update information at any time. Product availability is subject to change without notice." },
              { title: "4. Ordering & Payment", content: "All orders are subject to acceptance and availability. Payments are processed securely through Paystack. By placing an order, you confirm that you are authorized to use the payment method provided. Prices are listed in Nigerian Naira (₦)." },
              { title: "5. Intellectual Property", content: "All content on TechMart including logos, images, and text is the property of TechMart and protected by applicable intellectual property laws. You may not reproduce or distribute our content without written permission." },
              { title: "6. Limitation of Liability", content: "TechMart shall not be liable for any indirect, incidental, or consequential damages arising from your use of our platform. Our total liability shall not exceed the amount paid for the specific product in question." },
              { title: "7. Changes to Terms", content: "TechMart reserves the right to modify these terms at any time. Continued use of our platform after changes constitutes acceptance of the new terms. We will notify users of significant changes via email." },
              { title: "8. Governing Law", content: "These terms are governed by the laws of the Federal Republic of Nigeria. Any disputes shall be resolved in Nigerian courts." },
            ].map(item => (
              <div key={item.title} style={styles.policyItem}>
                <h3 style={styles.policyTitle}>{item.title}</h3>
                <p style={styles.policyText}>{item.content}</p>
              </div>
            ))}
          </div>
        )}

        {/* PRIVACY POLICY */}
        {active === "Privacy Policy" && (
          <div>
            <h2 style={styles.sectionTitle}>🔒 Privacy Policy</h2>
            <p style={styles.intro}>
              At TechMart, we take your privacy seriously. This policy explains how we collect, use, and protect your personal information.
            </p>
            {[
              { title: "1. Information We Collect", content: "We collect information you provide when creating an account (name, email, password), making purchases (payment details processed by Paystack), and interacting with our platform (browsing history, reviews, wishlist)." },
              { title: "2. How We Use Your Information", content: "We use your information to process orders and payments, send order confirmations and shipping updates, personalize your shopping experience, improve our AI recommendations, and communicate important updates about your account." },
              { title: "3. Data Security", content: "We implement industry-standard security measures including SSL encryption, secure password hashing, and JWT authentication to protect your data. Payment information is processed securely by Paystack and never stored on our servers." },
              { title: "4. Data Sharing", content: "We do not sell your personal data to third parties. We may share data with service providers (Paystack for payments, Brevo for emails) solely to operate our platform. These providers are bound by strict confidentiality agreements." },
              { title: "5. Cookies & Local Storage", content: "We use local storage to maintain your session, cart, and recently viewed products. This improves your shopping experience and is essential for platform functionality." },
              { title: "6. Your Rights", content: "You have the right to access, correct, or delete your personal data at any time. You can update your account information or contact us to request data deletion. We will respond to all requests within 30 days." },
              { title: "7. Contact Us", content: "For privacy-related inquiries, please contact us at michaelwill326@gmail.com. We are committed to addressing your concerns promptly." },
            ].map(item => (
              <div key={item.title} style={styles.policyItem}>
                <h3 style={styles.policyTitle}>{item.title}</h3>
                <p style={styles.policyText}>{item.content}</p>
              </div>
            ))}
          </div>
        )}

        {/* REFUND POLICY */}
        {active === "Refund Policy" && (
          <div>
            <h2 style={styles.sectionTitle}>↩️ Refund Policy</h2>

            <div style={styles.highlightBox}>
              <span style={{ fontSize: "32px" }}>↩️</span>
              <div>
                <h3 style={{ color: "#fff", fontSize: "18px", fontWeight: "800", margin: "0 0 4px" }}>
                  7-Day Money Back Guarantee
                </h3>
                <p style={{ color: "#86efac", fontSize: "14px", margin: 0 }}>
                  Not satisfied? Get a full refund within 7 days of delivery — no questions asked.
                </p>
              </div>
            </div>

            {[
              { title: "✅ Eligible for Refund", content: "Items that are defective or damaged on arrival, products that do not match the description, items that were not delivered within 14 business days, and wrong items received." },
              { title: "❌ Not Eligible for Refund", content: "Items returned after 7 days of delivery, products that have been used or damaged by the customer, items without original packaging, and digital products once downloaded." },
              { title: "📋 How to Request a Refund", content: "1. Contact us at michaelwill326@gmail.com within 7 days of delivery. 2. Provide your order reference number and reason for return. 3. We will review your request within 24 hours. 4. If approved, return the item in original condition. 5. Refund will be processed within 5-7 business days." },
              { title: "💰 Refund Method", content: "Refunds will be issued to the original payment method used for the purchase. Processing time is 5-7 business days after we receive the returned item. You will receive an email confirmation once the refund is processed." },
              { title: "🚚 Return Shipping", content: "For defective or wrong items, TechMart will cover the return shipping cost. For change of mind returns, the customer is responsible for return shipping costs." },
              { title: "📞 Contact for Refunds", content: "Email: michaelwill326@gmail.com. Please include your order reference number, full name, and reason for return. Our team will respond within 24 hours." },
            ].map(item => (
              <div key={item.title} style={styles.policyItem}>
                <h3 style={styles.policyTitle}>{item.title}</h3>
                <p style={styles.policyText}>{item.content}</p>
              </div>
            ))}
          </div>
        )}

        {/* SHIPPING POLICY */}
        {active === "Shipping Policy" && (
          <div>
            <h2 style={styles.sectionTitle}>🚚 Shipping Policy</h2>

            <div style={styles.highlightBox}>
              <span style={{ fontSize: "32px" }}>📦</span>
              <div>
                <h3 style={{ color: "#fff", fontSize: "18px", fontWeight: "800", margin: "0 0 4px" }}>
                  Free Delivery on All Orders
                </h3>
                <p style={{ color: "#86efac", fontSize: "14px", margin: 0 }}>
                  We offer free delivery across Nigeria on all orders.
                </p>
              </div>
            </div>

            {[
              { title: "📍 Delivery Coverage", content: "We currently deliver across all 36 states in Nigeria including FCT Abuja. We are working on expanding our delivery network to serve you better." },
              { title: "⏱️ Delivery Timeline", content: "Lagos: 1-2 business days. Other major cities (Abuja, Port Harcourt, Kano, Ibadan): 2-3 business days. Other locations: 3-5 business days. Remote areas: 5-7 business days." },
              { title: "📦 Order Processing", content: "Orders are processed within 24 hours of payment confirmation. You will receive an email notification when your order is shipped along with your tracking information." },
              { title: "🔍 Order Tracking", content: "Once your order is shipped, you can track it in real time on our Order Tracking page using your order reference number. You will also receive shipping updates via email." },
              { title: "⚠️ Delivery Issues", content: "If your order has not arrived within the expected timeframe, please contact us at michaelwill326@gmail.com with your order reference number. We will investigate and resolve the issue within 48 hours." },
              { title: "📦 Packaging", content: "All items are carefully packaged to ensure they arrive in perfect condition. Fragile items receive additional protective packaging at no extra cost." },
            ].map(item => (
              <div key={item.title} style={styles.policyItem}>
                <h3 style={styles.policyTitle}>{item.title}</h3>
                <p style={styles.policyText}>{item.content}</p>
              </div>
            ))}
          </div>
        )}

      </div>
    </div>
  );
}

const styles = {
  page: { maxWidth: "900px", margin: "0 auto", padding: "24px 16px", minHeight: "100vh" },
  header: { display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "24px", flexWrap: "wrap", gap: "12px" },
  title: { color: "#fff", fontSize: "24px", fontWeight: "800", margin: 0 },
  subtitle: { color: "#888", fontSize: "13px", marginTop: "4px" },
  backBtn: { background: "#1a1a1a", border: "1px solid #333", color: "#fff", padding: "10px 18px", borderRadius: "8px", cursor: "pointer", fontSize: "14px", whiteSpace: "nowrap" },
  sidebar: { display: "flex", flexDirection: "row", flexWrap: "wrap", gap: "8px", marginBottom: "16px" },
  sideBtn: { padding: "10px 16px", borderRadius: "999px", fontSize: "13px", fontWeight: "600", cursor: "pointer", textAlign: "center", transition: "all 0.2s", whiteSpace: "nowrap" },
  trustCard: { background: "#1a1a1a", border: "1px solid #2a2a2a", borderRadius: "16px", padding: "16px", display: "flex", flexWrap: "wrap", gap: "10px", alignItems: "center", marginBottom: "24px" },
  trustTitle: { color: "#fff", fontSize: "13px", fontWeight: "700", width: "100%", margin: 0 },
  trustItem: { display: "flex", alignItems: "center", gap: "6px", background: "#111", padding: "6px 12px", borderRadius: "999px" },
  content: { background: "#111", border: "1px solid #222", borderRadius: "20px", padding: "24px" },
  sectionTitle: { color: "#fff", fontSize: "20px", fontWeight: "800", marginBottom: "8px" },
  intro: { color: "#888", fontSize: "14px", lineHeight: "1.7", marginBottom: "24px", paddingBottom: "24px", borderBottom: "1px solid #222" },
  highlightBox: { background: "linear-gradient(135deg, rgba(34,197,94,0.1), rgba(22,163,74,0.1))", border: "1px solid #22c55e", borderRadius: "16px", padding: "16px", display: "flex", alignItems: "flex-start", gap: "12px", marginBottom: "24px", flexWrap: "wrap" },
  policyItem: { marginBottom: "20px", paddingBottom: "20px", borderBottom: "1px solid #1a1a1a" },
  policyTitle: { color: "#f97316", fontSize: "14px", fontWeight: "700", marginBottom: "8px" },
  policyText: { color: "#aaa", fontSize: "14px", lineHeight: "1.8", margin: 0 },
};
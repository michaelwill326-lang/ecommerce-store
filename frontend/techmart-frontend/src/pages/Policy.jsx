import React, { useState } from "react";

const styles = {
  container: {
    padding: "24px 16px 80px",
    backgroundColor: "var(--bg-primary)",
    minHeight: "100vh",
    boxSizing: "border-box",
    fontFamily: "system-ui, -apple-system, sans-serif",
  },
  card: {
    backgroundColor: "#111",
    borderRadius: "16px",
    padding: "32px 24px",
    width: "100%",
    maxWidth: "820px",
    margin: "0 auto",
    border: "1px solid #1f1f1f",
    boxSizing: "border-box",
  },
  header: {
    textAlign: "center",
    marginBottom: "32px",
  },
  badge: {
    display: "inline-block",
    background: "rgba(99,102,241,0.12)",
    border: "1px solid rgba(99,102,241,0.3)",
    borderRadius: "20px",
    padding: "4px 14px",
    fontSize: "12px",
    color: "#a5b4fc",
    fontWeight: "600",
    letterSpacing: "1px",
    textTransform: "uppercase",
    marginBottom: "12px",
  },
  mainTitle: {
    fontSize: "28px",
    fontWeight: "800",
    color: "#fff",
    margin: "0 0 8px",
  },
  subtitle: {
    fontSize: "14px",
    color: "#6b7280",
    margin: 0,
  },
  divider: {
    border: "0",
    height: "1px",
    backgroundColor: "#1f1f1f",
    margin: "28px 0",
  },
  tabRow: {
    display: "flex",
    gap: "8px",
    marginBottom: "32px",
    flexWrap: "wrap",
  },
  section: {
    marginBottom: "32px",
  },
  sectionTitle: {
    fontSize: "17px",
    fontWeight: "700",
    color: "#fff",
    margin: "0 0 12px",
    display: "flex",
    alignItems: "center",
    gap: "8px",
  },
  text: {
    fontSize: "14px",
    lineHeight: "1.8",
    color: "#9ca3af",
    margin: "0 0 12px",
  },
  bulletBox: {
    backgroundColor: "#1a1a1a",
    padding: "16px 20px",
    borderRadius: "10px",
    borderLeft: "3px solid #6366f1",
    marginTop: "12px",
  },
  bulletItem: {
    fontSize: "14px",
    lineHeight: "1.7",
    color: "#d1d5db",
    margin: "0 0 10px",
    paddingLeft: "4px",
  },
  highlightBox: {
    background: "rgba(99,102,241,0.06)",
    border: "1px solid rgba(99,102,241,0.2)",
    borderRadius: "10px",
    padding: "16px 20px",
    marginTop: "12px",
  },
  warnBox: {
    background: "rgba(245,158,11,0.06)",
    border: "1px solid rgba(245,158,11,0.2)",
    borderRadius: "10px",
    padding: "16px 20px",
    marginTop: "12px",
  },
  contactBox: {
    background: "#1a1a1a",
    borderRadius: "12px",
    padding: "20px",
    marginTop: "12px",
    display: "flex",
    flexDirection: "column",
    gap: "8px",
  },
  contactItem: {
    fontSize: "14px",
    color: "#d1d5db",
    display: "flex",
    gap: "10px",
    alignItems: "flex-start",
  },
};

const TABS = ["Privacy Policy", "Terms of Service", "Refund Policy", "TechMart Pay"];

export default function Policy() {
  const [tab, setTab] = useState("Privacy Policy");

  return (
    <div style={styles.container}>
      <div style={styles.card}>

        <div style={styles.header}>
          <div style={styles.badge}>Legal</div>
          <h1 style={styles.mainTitle}>TechMart Legal Policies</h1>
          <p style={styles.subtitle}>Last updated: September 2026 · Effective immediately</p>
        </div>

        <div style={styles.tabRow}>
          {TABS.map(t => (
            <button key={t} onClick={() => setTab(t)} style={{
              padding: "9px 16px",
              borderRadius: "10px",
              border: "none",
              cursor: "pointer",
              fontWeight: "600",
              fontSize: "13px",
              background: tab === t ? "linear-gradient(135deg,#6366f1,#4f46e5)" : "#1a1a1a",
              color: tab === t ? "#fff" : "#6b7280",
              transition: "all 0.2s",
            }}>
              {t}
            </button>
          ))}
        </div>

        <hr style={styles.divider} />

        {tab === "Privacy Policy" && (
          <div>
            <section style={styles.section}>
              <h2 style={styles.sectionTitle}>🔒 Information We Collect</h2>
              <p style={styles.text}>When you use TechMart, we collect the following information to operate the platform and serve you better:</p>
              <div style={styles.bulletBox}>
                <p style={styles.bulletItem}>• <strong>Account information:</strong> Name, email address, phone number, and password (hashed and encrypted)</p>
                <p style={styles.bulletItem}>• <strong>Transaction data:</strong> Order history, wallet transactions, payment references, and escrow activity</p>
                <p style={styles.bulletItem}>• <strong>Device & usage data:</strong> Browser type, pages visited, search queries, and interaction events used to improve recommendations</p>
                <p style={styles.bulletItem}>• <strong>Identity data:</strong> BVN or NIN only when you voluntarily submit for verification — never stored in plain text</p>
                <p style={styles.bulletItem}>• <strong>Uploaded content:</strong> Product images, profile photos, and phone check photos stored securely on Cloudinary</p>
              </div>
            </section>
            <section style={styles.section}>
              <h2 style={styles.sectionTitle}>🛡️ How We Use Your Data</h2>
              <div style={styles.bulletBox}>
                <p style={styles.bulletItem}>• Process orders, payments, and wallet transactions</p>
                <p style={styles.bulletItem}>• Send transactional emails (order confirmations, OTP, receipts)</p>
                <p style={styles.bulletItem}>• Power AI recommendations and the TechMart AI assistant</p>
                <p style={styles.bulletItem}>• Detect fraud and protect your account</p>
                <p style={styles.bulletItem}>• Improve platform features through anonymised analytics</p>
              </div>
            </section>
            <section style={styles.section}>
              <h2 style={styles.sectionTitle}>🚫 What We Never Do</h2>
              <div style={styles.highlightBox}>
                <p style={styles.bulletItem}>• We <strong>never sell</strong> your personal data to third parties or advertisers</p>
                <p style={styles.bulletItem}>• We <strong>never share</strong> your financial details with other users or sellers</p>
                <p style={styles.bulletItem}>• We <strong>never store</strong> your card details — all payments are handled by Paystack (PCI-DSS compliant)</p>
                <p style={styles.bulletItem}>• We <strong>never send</strong> unsolicited marketing SMS without your consent</p>
              </div>
            </section>
            <section style={styles.section}>
              <h2 style={styles.sectionTitle}>🍪 Cookies & Sessions</h2>
              <p style={styles.text}>TechMart uses session storage (not cookies) to keep you logged in. Your session expires automatically when you close your browser, keeping your account secure on shared devices.</p>
            </section>
            <section style={styles.section}>
              <h2 style={styles.sectionTitle}>📧 Your Rights</h2>
              <div style={styles.bulletBox}>
                <p style={styles.bulletItem}>• Request a copy of your personal data at any time</p>
                <p style={styles.bulletItem}>• Request deletion of your account and associated data</p>
                <p style={styles.bulletItem}>• Opt out of non-transactional emails via your account settings</p>
                <p style={styles.bulletItem}>• Contact us at <strong>support@techmart.ng</strong> for any privacy concerns</p>
              </div>
            </section>
          </div>
        )}

        {tab === "Terms of Service" && (
          <div>
            <section style={styles.section}>
              <h2 style={styles.sectionTitle}>📋 Acceptance of Terms</h2>
              <p style={styles.text}>By creating an account or using TechMart in any capacity — as a buyer, seller, or visitor — you agree to these Terms of Service. If you do not agree, please do not use the platform.</p>
            </section>
            <section style={styles.section}>
              <h2 style={styles.sectionTitle}>🛍️ Buyer Responsibilities</h2>
              <div style={styles.bulletBox}>
                <p style={styles.bulletItem}>• Buyers must provide accurate delivery information at checkout</p>
                <p style={styles.bulletItem}>• Buyers must confirm delivery within 48 hours of receiving an order to release escrow funds to the seller</p>
                <p style={styles.bulletItem}>• Buyers must not attempt chargebacks for completed and confirmed orders</p>
                <p style={styles.bulletItem}>• Buyers are responsible for inspecting items upon delivery before confirming</p>
                <p style={styles.bulletItem}>• Misuse of the dispute system to unlawfully withhold seller funds may result in account suspension</p>
              </div>
            </section>
            <section style={styles.section}>
              <h2 style={styles.sectionTitle}>🏪 Seller Responsibilities</h2>
              <div style={styles.bulletBox}>
                <p style={styles.bulletItem}>• Sellers must list only items they own and are legally permitted to sell</p>
                <p style={styles.bulletItem}>• Product descriptions, photos, and condition must be accurate and honest</p>
                <p style={styles.bulletItem}>• Sellers must dispatch orders within 48 hours of payment confirmation</p>
                <p style={styles.bulletItem}>• Sellers must not list stolen, blacklisted, cloned, or counterfeit devices</p>
                <p style={styles.bulletItem}>• Sellers found listing fraudulent products will be permanently banned and funds withheld pending investigation</p>
                <p style={styles.bulletItem}>• Sellers must provide valid bank account details for payouts</p>
              </div>
            </section>
            <section style={styles.section}>
              <h2 style={styles.sectionTitle}>⚖️ Prohibited Activities</h2>
              <div style={styles.warnBox}>
                <p style={styles.bulletItem}>🚫 Selling stolen, blacklisted, or cloned devices</p>
                <p style={styles.bulletItem}>🚫 Creating fake accounts or reviews</p>
                <p style={styles.bulletItem}>🚫 Attempting to move transactions off-platform to avoid escrow</p>
                <p style={styles.bulletItem}>🚫 Harassment of other users, buyers, or sellers</p>
                <p style={styles.bulletItem}>🚫 Exploiting bugs or vulnerabilities in the platform</p>
                <p style={styles.bulletItem}>🚫 Using TechMart Pay for money laundering or fraudulent activity</p>
              </div>
            </section>
            <section style={styles.section}>
              <h2 style={styles.sectionTitle}>⚙️ Platform Rights</h2>
              <p style={styles.text}>TechMart reserves the right to suspend or terminate accounts that violate these terms, withhold funds under investigation, modify platform features with notice, and update these terms at any time. Continued use after updates constitutes acceptance.</p>
            </section>
            <section style={styles.section}>
              <h2 style={styles.sectionTitle}>🇳🇬 Governing Law</h2>
              <p style={styles.text}>These terms are governed by the laws of the Federal Republic of Nigeria. Any disputes shall be resolved under Nigerian jurisdiction.</p>
            </section>
          </div>
        )}

        {tab === "Refund Policy" && (
          <div>
            <section style={styles.section}>
              <h2 style={styles.sectionTitle}>↩️ 7-Day Return Window</h2>
              <p style={styles.text}>TechMart offers a <strong>7-day return policy</strong> from the date of confirmed delivery. If you receive an item that is not as described, damaged, or defective, you are entitled to a return and full refund.</p>
            </section>
            <section style={styles.section}>
              <h2 style={styles.sectionTitle}>✅ Eligible Returns</h2>
              <div style={styles.bulletBox}>
                <p style={styles.bulletItem}>• Item received is significantly different from the listing description</p>
                <p style={styles.bulletItem}>• Item is physically damaged or defective on arrival</p>
                <p style={styles.bulletItem}>• Wrong item was delivered</p>
                <p style={styles.bulletItem}>• Item is counterfeit or not as advertised</p>
                <p style={styles.bulletItem}>• IMEI does not match what was listed</p>
              </div>
            </section>
            <section style={styles.section}>
              <h2 style={styles.sectionTitle}>❌ Non-Eligible Returns</h2>
              <div style={styles.warnBox}>
                <p style={styles.bulletItem}>• Buyer's remorse — changed your mind after delivery</p>
                <p style={styles.bulletItem}>• Item damaged by buyer after delivery</p>
                <p style={styles.bulletItem}>• Return requested after 7 days of confirmed delivery</p>
                <p style={styles.bulletItem}>• Accessories or consumables that have been opened and used</p>
              </div>
            </section>
            <section style={styles.section}>
              <h2 style={styles.sectionTitle}>�� How to Return</h2>
              <div style={styles.bulletBox}>
                <p style={styles.bulletItem}>1. Go to <strong>My Orders</strong> → Select the order → Tap <strong>Request Return</strong></p>
                <p style={styles.bulletItem}>2. Select a reason and upload photo evidence of the issue</p>
                <p style={styles.bulletItem}>3. TechMart reviews the request within <strong>24 hours</strong></p>
                <p style={styles.bulletItem}>4. If approved, coordinate return with the seller</p>
                <p style={styles.bulletItem}>5. Refund is credited to your <strong>TechMart wallet</strong> within 24 hours of return confirmation</p>
              </div>
            </section>
            <section style={styles.section}>
              <h2 style={styles.sectionTitle}>💳 Refund Method</h2>
              <p style={styles.text}>All approved refunds are credited to your TechMart wallet instantly. You can use the balance for future purchases or transfer it to another wallet. Refunds are never reversed once approved.</p>
            </section>
          </div>
        )}

        {tab === "TechMart Pay" && (
          <div>
            <section style={styles.section}>
              <h2 style={styles.sectionTitle}>💳 What is TechMart Pay?</h2>
              <p style={styles.text}>TechMart Pay is TechMart's embedded fintech wallet. It allows you to fund your account, pay for orders, send money to other TechMart users, save towards goals, and access financial tools — all within the TechMart app.</p>
            </section>
            <section style={styles.section}>
              <h2 style={styles.sectionTitle}>💰 Wallet Funding</h2>
              <div style={styles.bulletBox}>
                <p style={styles.bulletItem}>• Fund your wallet via Paystack using any Nigerian debit card or bank transfer</p>
                <p style={styles.bulletItem}>• Funds reflect instantly upon payment confirmation</p>
                <p style={styles.bulletItem}>• Missed credits are automatically reconciled daily</p>
                <p style={styles.bulletItem}>• Minimum top-up: ₦100</p>
              </div>
            </section>
            <section style={styles.section}>
              <h2 style={styles.sectionTitle}>🔁 Transfers</h2>
              <div style={styles.bulletBox}>
                <p style={styles.bulletItem}>• Send wallet balance to any TechMart user instantly using their email</p>
                <p style={styles.bulletItem}>• All transfers require PIN confirmation for security</p>
                <p style={styles.bulletItem}>• Transfers are instant and irreversible — verify recipient before sending</p>
              </div>
            </section>
            <section style={styles.section}>
              <h2 style={styles.sectionTitle}>🏦 Savings Vault</h2>
              <p style={styles.text}>Lock funds in your Savings Vault to earn interest over a set period. Locked funds cannot be spent until the lock period expires, helping you save towards a goal.</p>
            </section>
            <section style={styles.section}>
              <h2 style={styles.sectionTitle}>📦 Buy Now Pay Later</h2>
              <p style={styles.text}>Eligible buyers can split purchases into installments. Installments are automatically deducted from your wallet on the due date. Maintain sufficient wallet balance to avoid overdue status.</p>
            </section>
            <section style={styles.section}>
              <h2 style={styles.sectionTitle}>⚠️ Withdrawal Policy</h2>
              <div style={styles.warnBox}>
                <p style={styles.bulletItem}>• TechMart Pay does not currently support cash withdrawals to bank accounts</p>
                <p style={styles.bulletItem}>• Wallet balance can be used for purchases, transfers, and BNPL payments within TechMart</p>
                <p style={styles.bulletItem}>• This restriction is in place to comply with CBN regulations for non-licensed fintech operators</p>
              </div>
            </section>
            <section style={styles.section}>
              <h2 style={styles.sectionTitle}>🔐 Security</h2>
              <div style={styles.bulletBox}>
                <p style={styles.bulletItem}>• All wallet actions require PIN confirmation</p>
                <p style={styles.bulletItem}>• 2FA via email OTP protects your login</p>
                <p style={styles.bulletItem}>• Sessions expire automatically on browser close</p>
                <p style={styles.bulletItem}>• Suspicious activity triggers automatic account review</p>
              </div>
            </section>
          </div>
        )}

        <hr style={styles.divider} />

        <section style={styles.section}>
          <h2 style={styles.sectionTitle}>📬 Contact Us</h2>
          <p style={styles.text}>For any questions about these policies, reach us at:</p>
          <div style={styles.contactBox}>
            <div style={styles.contactItem}><span>📧</span><span>support@techmart.ng</span></div>
            <div style={styles.contactItem}><span>🌐</span><span>techmart-frontend.onrender.com</span></div>
            <div style={styles.contactItem}><span>📍</span><span>Lagos, Nigeria</span></div>
          </div>
        </section>

        <p style={{ ...styles.text, textAlign: "center", fontSize: "12px", marginTop: "24px" }}>
          © {new Date().getFullYear()} TechMart. All rights reserved. Nigeria's Trusted Tech Marketplace.
        </p>

      </div>
    </div>
  );
}

import { Link } from "react-router-dom";

export default function BuyerProtection() {
  const protections = [
    { icon: "🔐", title: "Escrow Payment Protection", desc: "Your payment is held securely by TechMart and only released to the seller after you confirm delivery. Your money is never at risk." },
    { icon: "↩️", title: "7-Day Return Policy", desc: "Not satisfied? Return any item within 7 days of delivery in its original condition for a full refund to your TechMart wallet." },
    { icon: "🛡️", title: "Buyer Guarantee", desc: "If your item doesn't arrive or doesn't match the description, we'll refund you 100%. No questions asked." },
    { icon: "✅", title: "Verified Sellers", desc: "All sellers on TechMart are vetted. Verified sellers have a blue badge and are held to higher standards of service." },
    { icon: "🤖", title: "AI Fraud Detection", desc: "Our AI monitors every transaction 24/7 to detect suspicious activity and protect your account from fraud." },
    { icon: "💬", title: "24/7 Support", desc: "Our support team is always available via WhatsApp to resolve any issues with your orders quickly." },
  ];

  const steps = [
    { step: "1", title: "Place Your Order", desc: "Pay securely via card, wallet, or BNPL. Funds are held in escrow." },
    { step: "2", title: "Seller Ships", desc: "Seller dispatches your order. You get real-time tracking updates." },
    { step: "3", title: "Receive & Confirm", desc: "Inspect your order. Confirm delivery to release payment to seller." },
    { step: "4", title: "Issue? We've Got You", desc: "Open a dispute within 7 days. We'll mediate and refund if needed." },
  ];

  return (
    <div style={{ background: "var(--bg-primary)", minHeight: "100vh", padding: "0 0 100px" }}>
      {/* Hero */}
      <div style={{ background: "linear-gradient(135deg, #0d1117, #111827)", borderBottom: "1px solid rgba(249,115,22,0.2)", padding: "48px 24px", textAlign: "center" }}>
        <p style={{ color: "#fb923c", fontWeight: "800", fontSize: "12px", letterSpacing: "2px", margin: "0 0 12px", textTransform: "uppercase" }}>🛡️ TechMart Buyer Protection</p>
        <h1 style={{ color: "#fff", fontSize: "clamp(24px, 5vw, 36px)", fontWeight: "900", margin: "0 0 12px" }}>Shop with 100% Confidence</h1>
        <p style={{ color: "rgba(255,255,255,0.65)", fontSize: "15px", margin: "0 0 24px", maxWidth: "500px", marginLeft: "auto", marginRight: "auto" }}>Every purchase on TechMart is protected by our escrow system, return policy, and buyer guarantee.</p>
        <Link to="/home" style={{ display: "inline-block", padding: "14px 28px", background: "linear-gradient(135deg, #f97316, #dc2626)", color: "#fff", textDecoration: "none", borderRadius: "12px", fontWeight: "800", fontSize: "15px" }}>Shop Now →</Link>
      </div>

      <div style={{ maxWidth: "800px", margin: "0 auto", padding: "40px 20px" }}>
        {/* Protections Grid */}
        <h2 style={{ color: "var(--text-primary)", fontSize: "20px", fontWeight: "800", margin: "0 0 20px", textAlign: "center" }}>What We Protect You From</h2>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(240px, 1fr))", gap: "16px", marginBottom: "40px" }}>
          {protections.map((p, i) => (
            <div key={i} style={{ background: "var(--bg-card)", border: "1px solid #2a2a2a", borderRadius: "14px", padding: "20px" }}>
              <p style={{ fontSize: "28px", margin: "0 0 10px" }}>{p.icon}</p>
              <p style={{ color: "var(--text-primary)", fontWeight: "700", fontSize: "14px", margin: "0 0 6px" }}>{p.title}</p>
              <p style={{ color: "var(--text-muted)", fontSize: "13px", margin: 0, lineHeight: 1.6 }}>{p.desc}</p>
            </div>
          ))}
        </div>

        {/* How it works */}
        <h2 style={{ color: "var(--text-primary)", fontSize: "20px", fontWeight: "800", margin: "0 0 20px", textAlign: "center" }}>How It Works</h2>
        <div style={{ display: "flex", flexDirection: "column", gap: "12px", marginBottom: "40px" }}>
          {steps.map((s, i) => (
            <div key={i} style={{ background: "var(--bg-card)", border: "1px solid #2a2a2a", borderRadius: "12px", padding: "16px 20px", display: "flex", gap: "16px", alignItems: "flex-start" }}>
              <div style={{ width: "36px", height: "36px", borderRadius: "50%", background: "linear-gradient(135deg, #f97316, #dc2626)", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: "900", color: "#fff", fontSize: "14px", flexShrink: 0 }}>{s.step}</div>
              <div>
                <p style={{ color: "var(--text-primary)", fontWeight: "700", fontSize: "14px", margin: "0 0 4px" }}>{s.title}</p>
                <p style={{ color: "var(--text-muted)", fontSize: "13px", margin: 0 }}>{s.desc}</p>
              </div>
            </div>
          ))}
        </div>

        {/* CTA */}
        <div style={{ background: "linear-gradient(135deg, #0a1a0a, #0d2b1c)", border: "1px solid rgba(249,115,22,0.2)", borderRadius: "16px", padding: "28px", textAlign: "center" }}>
          <p style={{ color: "#fb923c", fontWeight: "800", fontSize: "13px", margin: "0 0 8px" }}>Still have questions?</p>
          <p style={{ color: "#fff", fontWeight: "700", fontSize: "16px", margin: "0 0 16px" }}>Our support team is available 24/7</p>
          <a href="https://wa.me/2349032657217" target="_blank" rel="noopener noreferrer" style={{ display: "inline-block", padding: "12px 24px", background: "#25d366", color: "#fff", textDecoration: "none", borderRadius: "10px", fontWeight: "700", fontSize: "14px" }}>💬 Chat on WhatsApp</a>
        </div>
      </div>
    </div>
  );
}

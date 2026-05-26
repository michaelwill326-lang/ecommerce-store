import React from "react";

export default function Policy() {
  return (
    <div style={{ maxWidth: "800px", margin: "40px auto", padding: "20px", fontFamily: "sans-serif", color: "#333", lineHeight: "1.6" }}>
      <h1 style={{ borderBottom: "2px solid #eee", paddingBottom: "10px", color: "#222" }}>TechMart Store Policies</h1>
      
      <section style={{ marginBottom: "25px" }}>
        <h2 style={{ color: "#007bff", fontSize: "20px" }}>1. Secure Escrow Payments</h2>
        <p>All online payments are securely processed via Paystack. Funds are kept secure and are only released upon successful delivery verification by our internal distribution team.</p>
      </section>

      <section style={{ marginBottom: "25px" }}>
        <h2 style={{ color: "#007bff", fontSize: "20px" }}>2. Proprietary Fulfillment & Delivery Guarantee</h2>
        <p>We do not use random gig-economy riders. All deliveries are executed by full-time, trained TechMart logistics personnel. We provide real-time updates via SMS and WhatsApp as your package leaves our fulfillment hubs.</p>
      </section>

      <section style={{ marginBottom: "25px" }}>
        <h2 style={{ color: "#007bff", fontSize: "20px" }}>3. Return & Refund Window</h2>
        <p>Electronics and devices are backed by a verified return window if the item arrives defective or does not match the specifications on our catalog layout. Inspect items upon collection from our delivery agents.</p>
      </section>
    </div>
  );
}

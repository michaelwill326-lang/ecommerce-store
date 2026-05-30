require("dotenv").config();
const mongoose = require("mongoose");
const axios = require("axios");
const nodemailer = require("nodemailer");
const { Worker } = require("bullmq");
const IORedis = require("ioredis");

/* ===========================
   🔗 REDIS CONNECTION
=========================== */
const connection = new IORedis(process.env.REDIS_URL, {
  maxRetriesPerRequest: null,
  enableReadyCheck: false,
  tls: {},
  retryStrategy(times) {
    return Math.min(times * 1000, 5000);
  },
});

/* ===========================
   🧠 MONGODB
=========================== */
mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log("✅ Worker MongoDB Connected"))
  .catch((err) => console.log("❌ Mongo Error:", err.message));

// Minimal Schema to check status
const Order = mongoose.model("Order", new mongoose.Schema({
  email: String,
  amount: Number,
  status: { type: String, default: "Pending" },
  reference: String,
}), "orders"); // Ensure this matches your collection name

/* ===========================
   📧 EMAIL SETUP
=========================== */
const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

/* ===========================
   ⚙️ WORKER PROCESSOR
=========================== */
const worker = new Worker("orderQueue", async (job) => {
  const { orderId } = job.data;
  console.log("📦 Processing job for order:", orderId);

  const order = await Order.findById(orderId);
  
  if (!order) throw new Error("Order not found");

  // --- CRITICAL FIX: ONLY PROCEED IF PAID ---
  if (order.status !== "Paid") {
    console.log(`⚠️ Skipping email: Order ${orderId} is still ${order.status}`);
    return; // Do nothing if not paid
  }

  // Send Email
  try {
    await transporter.sendMail({
      from: `TechMart <${process.env.EMAIL_USER}>`,
      to: order.email,
      subject: "🛒 Order Confirmation",
      html: `
        <h2>Order Confirmed</h2>
        <p>Your payment was successful and your order is confirmed.</p>
        <p><strong>Reference:</strong> ${order.reference}</p>
        <p><strong>Amount:</strong> ₦${order.amount}</p>
        <p>Thank you for shopping with TechMart 🚀</p>
      `,
    });
    console.log("✅ Confirmation email sent for paid order");
  } catch (emailErr) {
    console.error("❌ Email Error:", emailErr.message);
  }

  // AI Service logic (optional)
  if (process.env.AI_SERVICE_URL) {
    try {
      await axios.post(process.env.AI_SERVICE_URL, order);
      console.log("🤖 AI processed order");
    } catch (aiErr) {
      console.log("⚠️ AI service skipped");
    }
  }
}, { 
  connection,
  concurrency: 5 
});

worker.on("error", (err) => console.log("🚨 Worker error:", err.message));
console.log("🚀 Worker running with payment-check enabled...");
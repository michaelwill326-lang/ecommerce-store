require("dotenv").config();

const express = require("express");
const cors = require("cors");
const mongoose = require("mongoose");
const jwt = require("jsonwebtoken");
const xss = require("xss");
const tokenBlacklist = new Set(); // In-memory JWT blacklist

// Sanitize user input to prevent XSS
const sanitize = (str) => {
  if (typeof str !== "string") return str;
  return xss(str.trim(), { whiteList: {}, stripIgnoreTag: true, stripIgnoreTagBody: ["script"] });
};
const bcrypt = require("bcryptjs");
const axios = require("axios");
const http = require("http");
const helmet = require("helmet");
const rateLimit = require("express-rate-limit");
const { Server } = require("socket.io");
const Groq = require("groq-sdk");
const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

const { sendOrderConfirmation, sendWelcomeEmail, sendShippingUpdate, sendPasswordResetEmail, sendAdminOrderNotification, sendLowStockAlert, sendOTPEmail, sendAbandonedCartEmail } = require("./utils/email");
const cron = require("node-cron");
const cloudinary = require("cloudinary").v2;
const multer = require("multer");

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// Multer memory storage
const storage = multer.memoryStorage();
const upload = multer({ storage });

// Strong password security rule
function isStrongPassword(password) {
  return /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*]).{8,}$/.test(password);
}

const app = express();
app.set("trust proxy", 1);

/* ===========================
   🔒 SECURITY
=========================== */
app.use(helmet());
// Skip JSON parsing for the Paystack webhook path — it needs the raw,
// unparsed body to verify the HMAC signature. Runs before rate limiters
// so req.body is available to the auth rate limiter's keyGenerator on
// every other route.
app.use((req, res, next) => {
  if (req.originalUrl === "/api/paystack/webhook") return next();
  express.json({ limit: "10mb" })(req, res, next);
});

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 300,
  message: { error: "Too many requests, try again later." }
});

app.use(limiter);

// Request timeout middleware (30 seconds)
app.use((req, res, next) => {
  res.setTimeout(30000, () => {
    res.status(408).json({ error: "Request timeout. Please try again." });
  });
  next();
});

const { ipKeyGenerator } = require("express-rate-limit");
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  message: { error: "Too many attempts, please try again in 15 minutes." },
  keyGenerator: (req) => {
    // Key on submitted email (when present), so repeated guesses against the
    // same account are tracked together even if requests land on different
    // processes/instances behind the proxy. Falls back to a safe IP key
    // (IPv6-aware) when no email is present on the request.
    const email = (req.body && req.body.email) ? String(req.body.email).toLowerCase().trim() : "";
    return email ? `email:${email}` : ipKeyGenerator(req);
  }
});
app.use("/api/auth/login", authLimiter);
app.use("/api/auth/signup", authLimiter);
app.use("/api/auth/forgot-password", authLimiter);

/* ===========================
   🌐 CORS CONFIG
=========================== */
const allowedOrigins = [
  "http://localhost:3000",
  "http://localhost:5173",
  "http://localhost:5174",
  "https://techmart-store-ppri.onrender.com",
  "https://techmart-frontend.onrender.com"
];

app.use(cors({
  origin: function (origin, callback) {
    if (!origin) return callback(null, true);
    if (allowedOrigins.includes(origin)) return callback(null, true);
    return callback(new Error("CORS blocked: " + origin));
  },
  credentials: true,
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"]
}));

app.options("*", cors());

/* ===========================
   📦 BODY PARSER
=========================== */


/* ===========================
   🤖 AI ROUTES
=========================== */

/* ===========================
   🧠 DATABASE
=========================== */
mongoose
  .connect(process.env.MONGO_URI, {
    serverSelectionTimeoutMS: 10000,
    socketTimeoutMS: 45000,
    connectTimeoutMS: 10000,
    maxPoolSize: 10,
  })
  .then(() => console.log("✅ MongoDB Connected"))
  .catch((err) => console.error("❌ MongoDB Error:", err));

// Reconnect on disconnect
mongoose.connection.on("disconnected", () => {
  console.warn("⚠️ MongoDB disconnected. Attempting reconnect...");
});

/* ===========================
   👤 MODELS
=========================== */
const User = mongoose.model(
  "User",
  new mongoose.Schema({
    name: String,
    email: { type: String, unique: true, lowercase: true, trim: true },
    password: String,
    phone: { type: String, default: "" },
    role: { type: String, default: "customer" },
    referralCode: { type: String, unique: true, sparse: true },
    referredBy: { type: String, default: null },
    referralCount: { type: Number, default: 0 },
    referralCredits: { type: Number, default: 0 },
    resetPasswordToken: { type: String, default: null },
    resetPasswordExpires: { type: Date, default: null },
    walletBalance: { type: Number, default: 0 },
    walletTransactions: [{
      type: { type: String, enum: ["credit", "debit"] },
      amount: Number,
      description: String,
      reference: String,
      createdAt: { type: Date, default: Date.now }
    }],
    virtualAccountNumber: { type: String, default: null },
    virtualAccountBank: { type: String, default: null },
    paystackCustomerCode: { type: String, default: null },
    walletPin: { type: String, default: null },
    walletPinSet: { type: Boolean, default: false },
    walletPinResetOtp: { type: String, default: null },
    walletPinResetExpires: { type: Date, default: null },
    otpCode: { type: String, default: null },
    otpExpires: { type: Date, default: null },
    twoFactorEnabled: { type: Boolean, default: false },
    deviceTokens: { type: [String], default: [] },
    aiPreferences: { type: Object, default: {} },
    savedCart: { type: Array, default: [] },
    cartUpdatedAt: { type: Date, default: null },
    cartReminderSent: { type: Boolean, default: false },
    fraudScore: { type: Number, default: 0 },
    isFlagged: { type: Boolean, default: false },
    fraudFlags: [{
      reason: String,
      severity: { type: String, enum: ["low", "medium", "high"] },
      details: String,
      createdAt: { type: Date, default: Date.now }
    }],
    loginAttempts: { type: Number, default: 0 },
    lastLoginAt: { type: Date, default: null },
    lastLoginIP: { type: String, default: null },
    bvnVerified: { type: Boolean, default: false },
    ninVerified: { type: Boolean, default: false },
    bvnLastAttempt: { type: Date, default: null },
    dailyFundingTotal: { type: Number, default: 0 },
    dailyFundingDate: { type: String, default: null },
    dailyTransferTotal: { type: Number, default: 0 },
    dailyTransferDate: { type: String, default: null },
    createdAt: { type: Date, default: Date.now }
  })
);
const Product = mongoose.model(
  "Product",
  new mongoose.Schema({
    name: String,
    price: Number,
    images: [String],
    description: String,
    stock: Number,
    vendorId: String,
    vendorName: String,
    category: String,
    condition: { type: String, default: "New" },
    variants: [{
      name: String,
      color: { type: String, default: "" },
      size: { type: String, default: "" },
      storage: { type: String, default: "" },
      condition: { type: String, default: "New" },
      price: {
        type: Number,
        default: 0
      },
      stock: { type: Number, default: 0 }
    }],
    rating: { type: Number, default: 0 },
    reviews: [
      {
        user: String,
        email: String,
        comment: String,
        stars: Number,
        verified: { type: Boolean, default: false },
        approved: { type: Boolean, default: false },
        flagged: { type: Boolean, default: false },
        sentiment: { type: String, default: "neutral" },
        createdAt: { type: Date, default: Date.now }
      }
    ],
    createdAt: { type: Date, default: Date.now }
  })
);

const Order = mongoose.model(
  "Order",
  new mongoose.Schema({
    email: String,
    items: Array,
    amount: Number,
    status: { type: String, default: "Pending" },
    reference: String,
    trackingNumber: String,
    deliveryAddress: { type: String, default: "" },
    phone: { type: String, default: "" },
    deliveryFee: { type: Number, default: 0 },
    deliveryZone: { type: String, default: "" },
    paymentMethod: { type: String, default: "Paystack" },
    depositPaid: { type: Number, default: 0 },
    depositReference: { type: String, default: "" },
    podPaymentReference: { type: String, default: "" },
    originalAmount: Number,
    couponCode: String,
    escrow: { type: Boolean, default: false },
    escrowStatus: { type: String, enum: ["holding", "released", "refunded", "none"], default: "none" },
    escrowReleasedAt: { type: Date, default: null },
    cancelledAt: { type: Date, default: null },
    cancelReason: { type: String, default: "" },
    buyerConfirmed: { type: Boolean, default: false },
    createdAt: { type: Date, default: Date.now }
  })
);

// Return Model
const ReturnSchema = new mongoose.Schema({
  orderId: { type: mongoose.Schema.Types.ObjectId, ref: "Order", required: true },
  buyerEmail: { type: String, required: true },
  buyerName: { type: String },
  reason: { type: String, required: true },
  description: { type: String },
  status: { type: String, enum: ["pending", "approved", "rejected", "completed"], default: "pending" },
  refundAmount: { type: Number, default: 0 },
  adminNote: { type: String, default: "" },
  createdAt: { type: Date, default: Date.now }
});
const Return = mongoose.model("Return", ReturnSchema);

// Coupon Model
const CouponSchema = new mongoose.Schema({
  code: { type: String, required: true, unique: true, uppercase: true, trim: true },
  type: { type: String, enum: ["percent", "fixed"], default: "percent" },
  value: { type: Number, required: true },
  minOrder: { type: Number, default: 0 },
  expiresAt: { type: Date, default: null },
  active: { type: Boolean, default: true }
}, { timestamps: true });
const Coupon = mongoose.model("Coupon", CouponSchema);

/* ===========================
   🎁 REFERRAL CODE GENERATOR
=========================== */
function generateReferralCode(name) {
  const clean = name.replace(/\s+/g, "").toUpperCase().slice(0, 5);
  const random = Math.random().toString(36).substring(2, 6).toUpperCase();
  return `${clean}${random}`;
}
/* ===========================
   🔐 AUTH MIDDLEWARE
=========================== */
function auth(req, res, next) {
  const token = req.headers.authorization?.split(" ")[1];
  if (token && tokenBlacklist.has(token)) return res.status(401).json({ error: "Token has been invalidated. Please log in again." });
  if (!token) return res.status(401).json({ error: "No token" });
  try {
    req.user = jwt.verify(token, process.env.JWT_SECRET);
    next();
  } catch {
    return res.status(401).json({ error: "Invalid token" });
  }
}

async function adminOnly(req, res, next) {
  const token = req.headers.authorization?.split(" ")[1];
  if (!token) return res.status(401).json({ error: "No token" });
  if (tokenBlacklist.has(token)) return res.status(401).json({ error: "Token has been invalidated" });
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    if (decoded.role !== "admin") return res.status(403).json({ error: "Admin only" });
    // Verify role in DB to prevent stale JWT attacks
    const user = await User.findById(decoded.id).select("role").lean();
    if (!user || user.role !== "admin") return res.status(403).json({ error: "Admin access revoked" });
    req.user = decoded;
    next();
  } catch {
    return res.status(401).json({ error: "Invalid token" });
  }
}

/* ===========================
   🏠 ROOT
=========================== */
app.get("/", (req, res) => {
  res.json({ status: "TechMart Enterprise API 🚀" });
});

/* ===========================
   🔐 AUTH ROUTES
=========================== */

/* SIGNUP */
app.post("/api/auth/signup", async (req, res) => {
  try {
    const { name, password } = req.body;
    const email = req.body.email ? String(req.body.email).toLowerCase().trim() : req.body.email;
    if (!name || !email || !password || !req.body.phone) return res.status(400).json({ error: "Name, email, password, and phone number are required" });
    const { referralCode } = req.body;
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) return res.status(400).json({ error: "Invalid email address" });
    if (!isStrongPassword(password)) {
      return res.status(400).json({
        error:"Password must be 8+ characters with uppercase, lowercase, number and special character."
      });
    }
    if (name.trim().length < 2) return res.status(400).json({ error: "Name must be at least 2 characters" });
    const existingUser = await User.findOne({ email });
    if (existingUser) return res.status(400).json({ error: "User already exists" });
    const hashedPassword = await bcrypt.hash(password, 10);
    const crypto = require("crypto");
    const newReferralCode = crypto.randomBytes(4).toString("hex").toUpperCase();
    const user = await User.create({ name, email, password: hashedPassword, phone: req.body.phone || "", referralCode: newReferralCode });
    const token = jwt.sign(
      { id: user._id, email: user.email, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: "7d" }
    );

    // 📧 SEND WELCOME EMAIL
    try {
      // Process referral if code provided
    if (referralCode) {
      const referrer = await User.findOne({ referralCode: referralCode.toUpperCase() });
      if (referrer && referrer._id.toString() !== user._id.toString()) {
        await User.findByIdAndUpdate(user._id, { referredBy: referralCode.toUpperCase() });
        await User.findByIdAndUpdate(referrer._id, {
          $inc: { referralCount: 1, referralCredits: 500, walletBalance: 500 },
          $push: { walletTransactions: { type: "credit", amount: 500, description: `Referral bonus — ${name} signed up`, createdAt: new Date() } }
        });
      }
    }
    await sendWelcomeEmail(user);
    } catch (e) {
      console.log("Welcome email failed:", e.message);
    }

    const safeUser = {
      id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      referralCode: user.referralCode,
      walletBalance: user.walletBalance || 0,
      walletPinSet: user.walletPinSet || false,
      twoFactorEnabled: user.twoFactorEnabled || false
    };

    res.status(201).json({ success: true, token, user: safeUser });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Signup failed" });
  }
});

/* LOGIN */
app.post("/api/auth/login", async (req, res) => {
  try {
    const { password } = req.body;
    const email = req.body.email ? String(req.body.email).toLowerCase().trim() : req.body.email;
    const user = await User.findOne({ email });
    if (!user) return res.status(400).json({ error: "User not found" });
    const match = await bcrypt.compare(password, user.password);
    if (!match) return res.status(400).json({ error: "Wrong password" });
    analyzeFraud(user, "login", { email: user.email, accountAge: Math.floor((Date.now() - new Date(user.createdAt)) / 86400000) + " days" }).catch(() => {});
    const { deviceToken } = req.body;
    const isKnownDevice = deviceToken && user.deviceTokens && user.deviceTokens.includes(deviceToken);
    // Skip OTP only if device is known
    if (isKnownDevice) {
      const token = jwt.sign(
        { id: user._id, email: user.email, role: user.role },
        process.env.JWT_SECRET,
        { expiresIn: "7d" }
      );
      return res.json({ success: true, token, requireOtp: false, user: { id: user._id, name: user.name, email: user.email, role: user.role, walletBalance: user.walletBalance, walletPinSet: user.walletPinSet, twoFactorEnabled: user.twoFactorEnabled } });
    }
    // Unknown device — require OTP regardless of 2FA setting
    res.json({ success: true, requireOtp: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Login failed" });
  }
});

/* FORGOT PASSWORD */
app.post("/api/auth/forgot-password", async (req, res) => {
  try {
    const email = req.body.email ? String(req.body.email).toLowerCase().trim() : req.body.email;
    if (!email) return res.status(400).json({ error: "Email is required" });

    const user = await User.findOne({ email });
    if (!user) {
      // Prevent user enumeration by acting successful
      return res.json({ success: true, message: "If that email exists in our system, a recovery token has been generated." });
    }

    // Generate secure 6-digit pin or token string
    const resetToken = Math.floor(100000 + Math.random() * 900000).toString();
    user.resetPasswordToken = resetToken;
    user.resetPasswordExpires = Date.now() + 3600000; // 1 hour expiration window
    await user.save();

    console.log(`🔑 Reset Token Generated for ${user.email}: ${resetToken}`);

    // 📧 SEND RESET EMAIL
    try {
      if (typeof sendPasswordResetEmail === "function") {
        await sendPasswordResetEmail(user.email, resetToken);
      }
    } catch (e) {
      // If your mailing configuration errors out on Render, log it here but DO NOT crash the request
      console.error("⚠️ Reset email dispatch failed:", e.message);
    }

    // Always send a success JSON response back to the browser frontend
    return res.json({ success: true, message: "If that email exists in our system, a recovery token has been generated." });
    
  } catch (err) {
    console.error("❌ CRITICAL FORGOT PASSWORD ERROR:", err);
    return res.status(500).json({ error: "Forgot password routine failed" });
  }
});

/* RESET PASSWORD */
app.post("/api/auth/reset-password", async (req, res) => {
  try {
    const { token, newPassword } = req.body;
    if (!token || !newPassword) return res.status(400).json({ error: "Token and new password are required" });

    if (!isStrongPassword(newPassword)) {
      return res.status(400).json({
        error:"Password must be 8+ characters with uppercase, lowercase, number and special character."
      });
    }

    const user = await User.findOne({
      resetPasswordToken: token.trim(),
      resetPasswordExpires: { $gt: Date.now() } // Checks if token is still valid
    });

    if (!user) return res.status(400).json({ error: "Invalid or expired recovery token" });

    // Update and hash password securely
    const bcrypt = require("bcrypt"); // Ensuring bcrypt is accessible
    user.password = await bcrypt.hash(newPassword, 10);
    user.resetPasswordToken = undefined;
    user.resetPasswordExpires = undefined;
    await user.save();

    return res.json({ success: true, message: "Your TechMart account password has been updated successfully!" });
  } catch (err) {
    console.error("❌ CRITICAL RESET PASSWORD ERROR:", err);
    return res.status(500).json({ error: "Reset password routine failed" });
  }
});
/* ===========================
   🚪 LOGOUT
=========================== */
app.post("/api/auth/logout", auth, (req, res) => {
  const token = req.headers.authorization?.split(" ")[1];
  if (token) {
    tokenBlacklist.add(token);
    // Auto-clean after 7 days (token expiry)
    setTimeout(() => tokenBlacklist.delete(token), 7 * 24 * 60 * 60 * 1000);
  }
  res.json({ success: true, message: "Logged out successfully" });
});

/* ===========================
   �� HEALTH
=========================== */
app.get("/api/health", (req, res) => {
  res.json({ status: "ok", service: "TechMart API", timestamp: new Date().toISOString() });
});

/* ===========================
   👤 USER PROFILE
=========================== */
app.get("/api/users/me", auth, async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select("-password -walletPin -otpCode -resetPasswordToken -fraudFlags -loginAttempts -lastLoginIP");
    if (!user) return res.status(404).json({ error: "User not found" });
    res.json({ success: true, user });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to fetch profile" });
  }
});

/* ===========================
   🛍 PRODUCTS
=========================== */
app.get("/api/products", async (req, res) => {
  try {
    const { search, category, minPrice, maxPrice } = req.query;
    const filter = {};
    if (search) filter.name = { $regex: search, $options: "i" };
    if (category) filter.category = { $regex: category, $options: "i" };
    if (minPrice || maxPrice) {
      filter.price = {};
      if (minPrice) filter.price.$gte = Number(minPrice);
      if (maxPrice) filter.price.$lte = Number(maxPrice);
    }
    const products = await Product.find(filter).sort({ createdAt: -1 });
    res.json(products);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to fetch products" });
  }
});

app.get("/api/products/:id", async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) return res.status(404).json({ error: "Product not found" });
    res.json(product);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to fetch product" });
  }
});

app.post("/api/products", adminOnly, async (req, res) => {
  try {
    const product = await Product.create(req.body);
    res.json(product);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to create product" });
  }
});

app.put("/api/products/:id", adminOnly, async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);

    if (!product) {
      return res.status(404).json({ error: "Product not found" });
    }

    let variants = product.variants;

    try {
      if (req.body.variants) {
        const parsed = JSON.parse(req.body.variants);
        if (Array.isArray(parsed)) {
          variants = parsed;
        }
      }
    } catch {
      console.warn("⚠️ Invalid variants JSON");
    }

    const updates = {
      name: req.body.name ?? product.name,
      description: req.body.description ?? product.description,
      category: req.body.category ?? product.category,
      condition: req.body.condition ?? product.condition,
      price:
        req.body.price !== undefined
          ? Number(req.body.price)
          : product.price,
      stock:
        req.body.stock !== undefined
          ? Number(req.body.stock)
          : product.stock,
      variants
    };

    const updated = await Product.findByIdAndUpdate(
      req.params.id,
      updates,
      { new: true }
    );

    res.json(updated);

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to update product" });
  }
});

app.delete("/api/products/:id", adminOnly, async (req, res) => {
  try {
    await Product.findByIdAndDelete(req.params.id);
    res.json({ success: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to delete product" });
  }
});

/* ===========================
   📦 ORDERS
=========================== */
app.post("/api/orders", auth, async (req, res) => {
  try {
    const { items, amount, deliveryAddress, phone, paymentMethod, escrow } = req.body;
    // Validate items
    if (!items || !Array.isArray(items) || items.length === 0) return res.status(400).json({ error: "Order must contain at least one item" });
    if (!deliveryAddress?.trim()) return res.status(400).json({ error: "Delivery address is required" });
    if (!phone?.trim()) return res.status(400).json({ error: "Phone number is required" });
    // Validate stock for each item
    const validatedItems = [];
    for (const item of items) {
      if (!item.productId) return res.status(400).json({ error: "Invalid item — missing productId" });
      const qty = Number(item.quantity) || 1;
      if (qty < 1) return res.status(400).json({ error: "Quantity must be at least 1" });
      if (qty > 100) return res.status(400).json({ error: `Quantity cannot exceed 100 per item` });
      const product = await Product.findById(item.productId).select("name price stock vendorId");
      if (!product) return res.status(404).json({ error: `Product not found: ${item.productId}` });
      if (product.stock < qty) return res.status(400).json({ error: `Sorry, only ${product.stock} unit(s) of "${product.name}" available` });
      validatedItems.push({ ...item, name: product.name, price: product.price, quantity: qty, vendorId: product.vendorId });
    }
    const order = await Order.create({
      email: req.user.email,
      items: validatedItems,
      amount,
      reference: "TX-" + Date.now(),
      deliveryAddress: sanitize(deliveryAddress),
      phone: sanitize(phone),
      paymentMethod: paymentMethod || "Paystack",
      escrow: escrow || false,
      escrowStatus: escrow ? "holding" : "none"
    });
    res.json(order);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Order failed" });
  }
});

// AI Assistant "Buy Now" quick action
app.post("/api/orders/buy-now", auth, async (req, res) => {
  try {
    const { productId, quantity } = req.body;
    if (!productId) return res.status(400).json({ error: "Product ID is required" });
    const qty = Number(quantity) || 1;
    const product = await Product.findById(productId);
    if (!product) return res.status(404).json({ error: "Product not found" });
    if (product.stock < qty) return res.status(400).json({ error: `Sorry, only ${product.stock} unit(s) of "${product.name}" available` });
    const user = await User.findById(req.user.id);
    if (!user.phone) return res.status(400).json({ error: "Please add a phone number to your profile before ordering" });
    const order = await Order.create({
      email: req.user.email,
      items: [{ productId, quantity: qty, name: product.name, price: product.price, vendorId: product.vendorId }],
      amount: product.price * qty,
      reference: "TX-" + Date.now(),
      deliveryAddress: "",
      phone: user.phone,
      paymentMethod: "Paystack",
      status: "Pending"
    });
    res.json({ success: true, order, message: `Order placed for ${product.name}! Complete payment to confirm.` });
  } catch (err) {
    console.error("Buy-now error:", err.message);
    res.status(500).json({ error: "Failed to place order" });
  }
});
app.get("/api/orders/me", auth, async (req, res) => {
  try {
    const orders = await Order.find({ email: req.user.email });
    res.json(orders);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to fetch orders" });
  }
});

/* =========================================================================
   💳 PAYSTACK (INTEGRATED WITH ATOMIC STOCK HANDLING & IDEMPOTENT WEBHOOK)
========================================================================= */

/* 1. INITIALIZE TRANSACTION & LOCK STOCK */


// Seller Model
const SellerSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true, lowercase: true, trim: true },
  password: { type: String, required: true },
  phone: { type: String, default: "" },
  storeName: { type: String, required: true },
  storeDescription: { type: String, default: "" },
  storeBanner: { type: String, default: "" },
  storeLogo: { type: String, default: "" },
  storeColor: { type: String, default: "#f97316" },
  status: { type: String, enum: ["pending", "approved", "rejected"], default: "pending" },
  verified: { type: Boolean, default: false },
  commission: { type: Number, default: 10 },
  totalSales: { type: Number, default: 0 },
  walletBalance: { type: Number, default: 0 },
  walletTransactions: [{
    type: { type: String, enum: ["credit", "debit"] },
    amount: Number,
    description: String,
    reference: String,
    createdAt: { type: Date, default: Date.now }
  }],
  resetPasswordToken: { type: String, default: null },
  resetPasswordExpires: { type: Date, default: null },

  createdAt: { type: Date, default: Date.now }
});
const Seller = mongoose.model("Seller", SellerSchema);

// Flash Sale Model
const FlashSaleSchema = new mongoose.Schema({
  productId: { type: mongoose.Schema.Types.ObjectId, ref: "Product", required: true },
  productName: { type: String, required: true },
  originalPrice: { type: Number, required: true },
  salePrice: { type: Number, required: true },
  startTime: { type: Date, required: true },
  endTime: { type: Date, required: true },
  active: { type: Boolean, default: true },
  createdAt: { type: Date, default: Date.now }
});
const FlashSale = mongoose.model("FlashSale", FlashSaleSchema);


// Payout Request Model
const PayoutSchema = new mongoose.Schema({
  sellerId: { type: mongoose.Schema.Types.ObjectId, ref: "Seller", required: true },
  sellerName: String,
  storeName: String,
  amount: { type: Number, required: true },
  bankName: String,
  accountNumber: String,
  accountName: String,
  status: { type: String, enum: ["pending", "approved", "paid", "rejected"], default: "pending" },
  note: String,
  createdAt: { type: Date, default: Date.now }
});
const Payout = mongoose.model("Payout", PayoutSchema);

// Dispute Model
const DisputeSchema = new mongoose.Schema({
  orderId: { type: mongoose.Schema.Types.ObjectId, ref: "Order" },
  customerId: String,
  customerEmail: String,
  sellerId: { type: mongoose.Schema.Types.ObjectId, ref: "Seller" },
  sellerName: String,
  subject: String,
  description: String,
  status: { type: String, enum: ["open", "seller_responded", "resolved", "closed"], default: "open" },
  messages: [{
    sender: String,
    senderType: { type: String, enum: ["customer", "seller", "admin"] },
    message: String,
    createdAt: { type: Date, default: Date.now }
  }],
  createdAt: { type: Date, default: Date.now }
});
const Dispute = mongoose.model("Dispute", DisputeSchema);

// Seller Message Model
const SellerMessageSchema = new mongoose.Schema({
  sellerId: { type: mongoose.Schema.Types.ObjectId, ref: "Seller" },
  customerEmail: String,
  customerName: String,
  productId: { type: mongoose.Schema.Types.ObjectId, ref: "Product" },
  productName: String,
  messages: [{
    sender: String,
    senderType: { type: String, enum: ["customer", "seller"] },
    message: String,
    read: { type: Boolean, default: false },
    createdAt: { type: Date, default: Date.now }
  }],
  createdAt: { type: Date, default: Date.now }
});
const SellerMessage = mongoose.model("SellerMessage", SellerMessageSchema);

/* ===========================
   COUPON ENDPOINTS
=========================== */
// Validate coupon
app.post("/api/coupons/validate", async (req, res) => {
  try {
    const { code, orderTotal } = req.body;
    const coupon = await Coupon.findOne({ code: code.toUpperCase(), active: true });
    if (!coupon) return res.status(404).json({ error: "Invalid or expired coupon code" });
    if (coupon.expiresAt && new Date() > coupon.expiresAt) {
      return res.status(400).json({ error: "This coupon has expired" });
    }
    if (orderTotal < coupon.minOrder) {
      return res.status(400).json({ error: `Minimum order of ₦${coupon.minOrder.toLocaleString()} required` });
    }
    const discount = coupon.type === "percent"
      ? Math.round((coupon.value / 100) * orderTotal)
      : Math.min(coupon.value, orderTotal);
    res.json({ success: true, code: coupon.code, type: coupon.type, value: coupon.value, discount });
  } catch (err) {
    res.status(500).json({ error: "Failed to validate coupon" });
  }
});

// Create coupon (admin only)
app.post("/api/admin/coupons", adminOnly, async (req, res) => {
  try {
    const { code, type, value, minOrder, expiresAt } = req.body;
    const coupon = await Coupon.create({ code, type, value, minOrder, expiresAt: expiresAt || null });
    res.status(201).json({ success: true, data: coupon });
  } catch (err) {
    if (err.code === 11000) return res.status(400).json({ error: "Coupon code already exists" });
    res.status(500).json({ error: "Failed to create coupon" });
  }
});

// Get all coupons (admin only)
app.get("/api/admin/coupons", adminOnly, async (req, res) => {
  try {
    const coupons = await Coupon.find().sort({ createdAt: -1 });
    res.json(coupons);
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch coupons" });
  }
});

// Delete coupon (admin only)
app.delete("/api/admin/coupons/:id", adminOnly, async (req, res) => {
  try {
    await Coupon.findByIdAndDelete(req.params.id);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: "Failed to delete coupon" });
  }
});


const { upload: adminUploader, cloudinary: cloudinaryCloud } = require("./utils/uploader");


// Wallet & Cashback Config
const CASHBACK_PERCENT = 2; // 2% cashback on every order





// One-time: clean up product categories
app.post("/api/admin/fix-categories", adminOnly, async (req, res) => {
  try {
    const products = await Product.find();
    let updated = 0;
    for (const p of products) {
      const name = p.name?.toLowerCase() || "";
      const cat = p.category?.trim().toLowerCase() || "";
      let newCategory = p.category?.trim() || "Electronics";

      // Assign proper categories based on product name
      if (name.includes("iphone") || name.includes("xiaomi") || name.includes("redmi") || name.includes("samsung") && name.includes("phone")) {
        newCategory = "Phones";
      } else if (name.includes("macbook") || name.includes("laptop") || name.includes("elitebook") || name.includes("latitude") || name.includes("thinkpad")) {
        newCategory = "Laptops";
      } else if (name.includes("mac mini") || name.includes("imac") || name.includes("desktop") || name.includes("monitor")) {
        newCategory = "Computers";
      } else if (name.includes("airpod") || name.includes("headphone") || name.includes("earphone") || name.includes("speaker") || name.includes("zealot") || name.includes("tws")) {
        newCategory = "Audio";
      } else if (name.includes("watch")) {
        newCategory = "Wearables";
      } else if (name.includes("keyboard") || name.includes("mouse") || name.includes("case") || name.includes("charger") || name.includes("cable") || name.includes("type-c") || name.includes("sticker")) {
        newCategory = "Accessories";
      } else if (name.includes("printer") || name.includes("deskjet")) {
        newCategory = "Printers";
      } else if (name.includes("power bank") || name.includes("powerbank")) {
        newCategory = "Accessories";
      } else if (name.includes("gaming")) {
        newCategory = "Gaming";
      } else if (cat === "electronic" || cat === "electronic " || cat === "electronics") {
        newCategory = "Electronics";
      }

      if (newCategory !== p.category) {
        await Product.findByIdAndUpdate(p._id, { category: newCategory });
        updated++;
      }
    }
    res.json({ success: true, updated, total: products.length });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});



/* ===========================
   🛡️ AI FRAUD DETECTION
=========================== */
async function analyzeFraud(user, action, details) {
  try {
    const recentTxns = (user.walletTransactions || []).slice(-20);
    const totalDebits = recentTxns.filter(t => t.type === "debit").reduce((s, t) => s + t.amount, 0);
    const txnCount = recentTxns.length;
    const accountAgeDays = Math.floor((Date.now() - new Date(user.createdAt)) / (1000 * 60 * 60 * 24));

    const prompt = `You are a fraud detection AI for TechMart, a Nigerian e-commerce platform.
Analyze this user activity and return a JSON object with:
- score: number 0-100 (0=safe, 100=definitely fraud)
- severity: "low" | "medium" | "high" | "none"
- reason: short string explaining the risk
- flag: boolean (true if score >= 60)

User profile:
- Account age: ${accountAgeDays} days
- Total wallet debits (last 20 txns): N${totalDebits}
- Transaction count (last 20): ${txnCount}
- Already flagged: ${user.isFlagged}
- Current fraud score: ${user.fraudScore}

Current action: ${action}
Action details: ${JSON.stringify(details)}

Common fraud patterns to detect:
- New account (< 3 days) making large transactions
- More than 5 airtime purchases within 1 hour
- Transfer amount > 50000 in a single transaction
- Rapid repeated transfers to same recipient
- Multiple failed login attempts then sudden activity

Respond ONLY with valid JSON, no markdown.`;

    const completion = await groq.chat.completions.create({
      model: "llama-3.3-70b-versatile",
      messages: [{ role: "user", content: prompt }],
      max_tokens: 200,
      temperature: 0.1
    });

    const raw = completion.choices[0].message.content.trim();
    const result = JSON.parse(raw.replace(/```json|```/g, "").trim());

    if (result.flag && result.severity !== "none") {
      await User.findByIdAndUpdate(user._id, {
        $inc: { fraudScore: result.score },
        $set: { isFlagged: true },
        $push: {
          fraudFlags: {
            reason: result.reason,
            severity: result.severity,
            details: JSON.stringify(details),
            createdAt: new Date()
          }
        }
      });
      console.log("FRAUD DETECTED: " + user.email + " - " + result.reason + " (score: " + result.score + ")");
    }

    return result;
  } catch (err) {
    console.error("Fraud detection error:", err.message);
    return { score: 0, flag: false, severity: "none", reason: "analysis failed" };
  }
}

/* ===========================
   TECHMART PAY
=========================== */

// 1. Create/Get Virtual Account for wallet funding
app.post("/api/pay/virtual-account", auth, async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    
    // Check if user already has a virtual account
    if (user.virtualAccountNumber) {
      return res.json({ success: true, account: { accountNumber: user.virtualAccountNumber, bankName: user.virtualAccountBank, accountName: user.name } });
    }

    // Create Paystack customer first
    const customerRes = await axios.post(
      "https://api.paystack.co/customer",
      { email: user.email, first_name: user.name.split(" ")[0], last_name: user.name.split(" ")[1] || user.name },
      { headers: { Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY}` } }
    );
    const customerCode = customerRes.data.data.customer_code;

    // Create dedicated virtual account
    const vaRes = await axios.post(
      "https://api.paystack.co/dedicated_account",
      { customer: customerCode, preferred_bank: "wema-bank" },
      { headers: { Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY}` } }
    );

    const va = vaRes.data.data;
    await User.findByIdAndUpdate(req.user.id, {
      virtualAccountNumber: va.account_number,
      virtualAccountBank: va.bank?.name || "Wema Bank",
      paystackCustomerCode: customerCode
    });

    res.json({ success: true, account: { accountNumber: va.account_number, bankName: va.bank?.name || "Wema Bank", accountName: user.name } });
  } catch (err) {
    console.error("Virtual account error:", err.response?.data || err.message);
    res.status(500).json({ error: "Failed to create virtual account" });
  }
});


// 1b. Fund Wallet via Paystack Payment Link
app.post("/api/pay/fund-wallet", auth, async (req, res) => {
  try {
    const { amount } = req.body;
    if (!amount || Number(amount) < 100) return res.status(400).json({ error: "Minimum deposit is N100" });

    const user = await User.findById(req.user.id);
    const limitCheck = checkDailyLimit(user, "funding", amount);
    if (!limitCheck.ok) return res.status(400).json({ error: limitCheck.error });
    const reference = "WAL-" + Date.now();

    const response = await axios.post(
      "https://api.paystack.co/transaction/initialize",
      {
        email: user.email,
        amount: Number(amount) * 100, // kobo
        reference,
        metadata: {
          userId: user._id.toString(),
          email: user.email,
          name: user.name,
          purpose: "wallet_funding",
          custom_fields: [
            { display_name: "Purpose", variable_name: "purpose", value: "TechMart Wallet Funding" }
          ]
        },
        callback_url: `${process.env.FRONTEND_URL || "https://techmart-frontend.onrender.com"}/pay?funded=true`
      },
      { headers: { Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY}` } }
    );

    res.json({
      success: true,
      paymentUrl: response.data.data.authorization_url,
      reference,
      amount
    });
  } catch (err) {
    console.error("Wallet funding error:", err.response?.data || err.message);
    res.status(500).json({ error: "Failed to initialize payment" });
  }
});

// 2. Wallet to Wallet Transfer
// Reusable wallet PIN verification helper
async function verifyWalletPin(user, pin) {
  if (!user.walletPinSet) return { ok: false, error: "Please set a wallet PIN before making transactions" };
  if (!pin) return { ok: false, error: "Wallet PIN is required" };
  const match = await bcrypt.compare(String(pin), user.walletPin || "");
  if (!match) return { ok: false, error: "Incorrect PIN" };
  return { ok: true };
}

app.post("/api/pay/send", auth, async (req, res) => {
  try {
    const { recipientEmail, amount, note, pin } = req.body;
    if (!recipientEmail || !amount) return res.status(400).json({ error: "Recipient email and amount are required" });
    if (Number(amount) < 100) return res.status(400).json({ error: "Minimum transfer is N100" });
    const sender = await User.findById(req.user.id);
    if (!sender.walletPinSet) return res.status(400).json({ error: "Please set a wallet PIN before sending money" });
    if (!pin) return res.status(400).json({ error: "Wallet PIN is required" });
    const pinMatch = await bcrypt.compare(String(pin), sender.walletPin || "");
    if (!pinMatch) return res.status(400).json({ error: "Incorrect PIN" });
    const recipient = await User.findOne({ email: recipientEmail });
    if (!recipient) return res.status(404).json({ error: "No TechMart user found with that email" });
    if (sender.email === recipientEmail) return res.status(400).json({ error: "You cannot send money to yourself" });
    if ((sender.walletBalance || 0) < Number(amount)) return res.status(400).json({ error: "Insufficient wallet balance" });
    const transferLimit = checkDailyLimit(sender, "transfer", amount);
    if (!transferLimit.ok) return res.status(400).json({ error: transferLimit.error });

    const reference = "TXF-" + Date.now();
    sender.dailyTransferTotal = transferLimit.total + Number(amount);
    sender.dailyTransferDate = transferLimit.today;

    // Debit sender
    sender.walletBalance = (sender.walletBalance || 0) - Number(amount);
    sender.walletTransactions.push({
      type: "debit",
      amount: Number(amount),
      description: `Transfer to ${recipient.name} (${recipientEmail})${note ? " — " + note : ""}`,
      reference
    });
    await sender.save();

    // Credit recipient
    recipient.walletBalance = (recipient.walletBalance || 0) + Number(amount);
    recipient.walletTransactions.push({
      type: "credit",
      amount: Number(amount),
      description: `Transfer from ${sender.name}${note ? " — " + note : ""}`,
      reference
    });
    await recipient.save();

    analyzeFraud(sender, "wallet_transfer", { recipientEmail, amount, reference }).catch(() => {});
    res.json({ success: true, reference, message: `N${Number(amount).toLocaleString()} sent to ${recipient.name}` });
  } catch (err) {
    console.error("Transfer error:", err.message);
    res.status(500).json({ error: "Transfer failed" });
  }
});

// 3. Withdraw to Bank Account
// NIN Verification
app.post("/api/pay/verify-nin", auth, async (req, res) => {
  try {
    const { nin } = req.body;
    if (!nin || nin.length !== 11) return res.status(400).json({ error: "Enter a valid 11-digit NIN" });
    const user = await User.findById(req.user.id);
    if (user.ninVerified || user.bvnVerified) return res.status(400).json({ error: "Identity already verified" });

    const response = await axios.get(
      `https://api.paystack.co/bank/resolve_nin/${nin}`,
      { headers: { Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY}` } }
    );

    const ninData = response.data.data;
    const userName = user.name.toLowerCase();
    const ninFirst = (ninData.first_name || "").toLowerCase();
    const ninLast = (ninData.last_name || "").toLowerCase();

    if (!userName.includes(ninFirst) && !userName.includes(ninLast)) {
      return res.status(400).json({ error: "NIN details do not match your account name" });
    }

    user.ninVerified = true;
    await user.save();

    res.json({ success: true, message: "NIN verified successfully! Your transaction limits have been upgraded." });
  } catch (err) {
    console.error("NIN verification error:", err.response?.data || err.message);
    res.status(500).json({ error: "NIN verification failed. Please try again." });
  }
});

// Daily limit checker helper
function checkDailyLimit(user, type, amount) {
  const today = new Date().toISOString().slice(0, 10);
  const isVerified = user.bvnVerified || user.ninVerified;
  const fundingLimit = isVerified ? 500000 : 50000;
  const transferLimit = isVerified ? 200000 : 20000;

  if (type === "funding") {
    const sameDay = user.dailyFundingDate === today;
    const total = sameDay ? (user.dailyFundingTotal || 0) : 0;
    if (total + Number(amount) > fundingLimit) {
      return { ok: false, error: `Daily funding limit is ₦${fundingLimit.toLocaleString()}. ${!isVerified ? "Verify your BVN to increase limits." : ""}` };
    }
    return { ok: true, total, today };
  }

  if (type === "transfer") {
    const sameDay = user.dailyTransferDate === today;
    const total = sameDay ? (user.dailyTransferTotal || 0) : 0;
    if (total + Number(amount) > transferLimit) {
      return { ok: false, error: `Daily transfer limit is ₦${transferLimit.toLocaleString()}. ${!isVerified ? "Verify your BVN to increase limits." : ""}` };
    }
    return { ok: true, total, today };
  }
}

// Public Pay Profile
app.get("/api/pay/profile/:userId", async (req, res) => {
  try {
    const user = await User.findById(req.params.userId).select("name email bvnVerified ninVerified createdAt");
    if (!user) return res.status(404).json({ error: "User not found" });
    res.json({
      name: user.name,
      email: user.email,
      bvnVerified: user.bvnVerified || false,
      ninVerified: user.ninVerified || false,
      memberSince: user.createdAt
    });
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch profile" });
  }
});

// BVN Verification
app.post("/api/pay/verify-bvn", auth, async (req, res) => {
  try {
    const { bvn } = req.body;
    if (!bvn || bvn.length !== 11) return res.status(400).json({ error: "Enter a valid 11-digit BVN" });
    const user = await User.findById(req.user.id);
    if (user.bvnVerified) return res.status(400).json({ error: "BVN already verified" });

    // Paystack BVN verification
    const response = await axios.get(
      `https://api.paystack.co/bank/resolve_bvn/${bvn}`,
      { headers: { Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY}` } }
    );

    const bvnData = response.data.data;
    // Match first name or last name against user name
    const userName = user.name.toLowerCase();
    const bvnFirst = (bvnData.first_name || "").toLowerCase();
    const bvnLast = (bvnData.last_name || "").toLowerCase();

    if (!userName.includes(bvnFirst) && !userName.includes(bvnLast)) {
      user.bvnLastAttempt = new Date();
      await user.save();
      return res.status(400).json({ error: "BVN details do not match your account name" });
    }

    user.bvnVerified = true;
    user.bvnLastAttempt = new Date();
    await user.save();

    res.json({ success: true, message: "BVN verified successfully! Your transaction limits have been upgraded." });
  } catch (err) {
    console.error("BVN verification error:", err.response?.data || err.message);
    res.status(500).json({ error: "BVN verification failed. Please try again." });
  }
});

app.post("/api/pay/withdraw", auth, async (req, res) => {
  try {
    const { amount, bankCode, accountNumber, accountName } = req.body;
    if (!amount || !bankCode || !accountNumber || !accountName) return res.status(400).json({ error: "All fields are required" });
    if (Number(amount) < 500) return res.status(400).json({ error: "Minimum withdrawal is N500" });

    const user = await User.findById(req.user.id);
    if ((user.walletBalance || 0) < Number(amount)) return res.status(400).json({ error: "Insufficient wallet balance" });

    // Create transfer recipient on Paystack
    const recipientRes = await axios.post(
      "https://api.paystack.co/transferrecipient",
      { type: "nuban", name: accountName, account_number: accountNumber, bank_code: bankCode, currency: "NGN" },
      { headers: { Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY}` } }
    );
    const recipientCode = recipientRes.data.data.recipient_code;

    // Initiate transfer
    const reference = "WTH-" + Date.now();
    await axios.post(
      "https://api.paystack.co/transfer",
      { source: "balance", amount: Number(amount) * 100, recipient: recipientCode, reason: `TechMart withdrawal by ${user.name}`, reference },
      { headers: { Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY}` } }
    );

    // Debit wallet
    user.walletBalance = (user.walletBalance || 0) - Number(amount);
    user.walletTransactions.push({
      type: "debit",
      amount: Number(amount),
      description: `Withdrawal to ${accountName} (${accountNumber})`,
      reference
    });
    await user.save();

    res.json({ success: true, reference, message: `N${Number(amount).toLocaleString()} withdrawal initiated. Arrives in 1-2 minutes.` });
  } catch (err) {
    console.error("Withdrawal error:", err.response?.data || err.message);
    const msg = err.response?.data?.code === "transfer_unavailable"
      ? "Bank withdrawals require a registered business account. This feature is coming soon!"
      : "Withdrawal failed. Please try again.";
    res.status(500).json({ error: msg });
  }
});

// 4. Get Nigerian Banks List
app.get("/api/pay/banks", async (req, res) => {
  try {
    const response = await axios.get(
      "https://api.paystack.co/bank?currency=NGN&use_cursor=false",
      { headers: { Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY}` } }
    );
    res.json(response.data.data);
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch banks" });
  }
});

// 5. Verify Bank Account
app.post("/api/pay/verify-account", auth, async (req, res) => {
  try {
    const { accountNumber, bankCode } = req.body;
    const response = await axios.get(
      `https://api.paystack.co/bank/resolve?account_number=${accountNumber}&bank_code=${bankCode}`,
      { headers: { Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY}` } }
    );
    res.json({ success: true, accountName: response.data.data.account_name });
  } catch (err) {
    res.status(500).json({ error: "Could not verify account" });
  }
});

// 6. Bill Payments (Airtime via Paystack)
app.post("/api/pay/airtime", auth, async (req, res) => {
  try {
    const { phone, amount, network, pin } = req.body;
    if (!phone || !amount || !network) return res.status(400).json({ error: "Phone, amount and network are required" });
    if (Number(amount) < 50) return res.status(400).json({ error: "Minimum airtime is N50" });
    const user = await User.findById(req.user.id);
    const pinCheck = await verifyWalletPin(user, pin);
    if (!pinCheck.ok) return res.status(400).json({ error: pinCheck.error });
    if ((user.walletBalance || 0) < Number(amount)) return res.status(400).json({ error: "Insufficient wallet balance" });

    // Network to Paystack provider code mapping
    const providerMap = { MTN: "MTN", Airtel: "AIR", Glo: "GLO", "9mobile": "ETISALAT" };
    const provider = providerMap[network];
    if (!provider) return res.status(400).json({ error: "Invalid network" });

    const reference = "AIR-" + Date.now();

    // Debit wallet first
    user.walletBalance = (user.walletBalance || 0) - Number(amount);
    user.walletTransactions.push({
      type: "debit",
      amount: Number(amount),
      description: `${network} airtime for ${phone}`,
      reference,
      status: "pending"
    });
    await user.save();

    // Clubkonnect not yet active — refund and block
    user.walletBalance = (user.walletBalance || 0) + Number(amount);
    user.walletTransactions.push({ type: "credit", amount: Number(amount), description: "Refund: airtime service coming soon", reference: reference + "-REFUND" });
    await user.save();
    return res.status(503).json({ error: "Airtime service is coming soon. Your wallet has not been charged." });
  } catch (err) {
    console.error("Airtime error:", err.response?.data || err.message);
    res.status(500).json({ error: "Airtime purchase failed" });
  }
});


// 8. Get Data Bundle Plans
app.get("/api/pay/data-plans/:network", auth, async (req, res) => {
  try {
    const { network } = req.params;
    const staticPlans = {
      MTN: [
        { id: "MTN-100MB-1D", name: "100MB - 1 Day", price: 100 },
        { id: "MTN-200MB-3D", name: "200MB - 3 Days", price: 200 },
        { id: "MTN-500MB-7D", name: "500MB - 7 Days", price: 300 },
        { id: "MTN-1GB-1M", name: "1GB - 30 Days", price: 300 },
        { id: "MTN-2GB-1M", name: "2GB - 30 Days", price: 500 },
        { id: "MTN-5GB-1M", name: "5GB - 30 Days", price: 1500 },
        { id: "MTN-10GB-1M", name: "10GB - 30 Days", price: 3000 },
        { id: "MTN-20GB-1M", name: "20GB - 30 Days", price: 5000 },
        { id: "MTN-50GB-1M", name: "50GB - 30 Days", price: 10000 },
      ],
      Airtel: [
        { id: "AIR-100MB-1D", name: "100MB - 1 Day", price: 100 },
        { id: "AIR-200MB-3D", name: "200MB - 3 Days", price: 200 },
        { id: "AIR-1GB-1M", name: "1GB - 30 Days", price: 300 },
        { id: "AIR-2GB-1M", name: "2GB - 30 Days", price: 500 },
        { id: "AIR-5GB-1M", name: "5GB - 30 Days", price: 1500 },
        { id: "AIR-10GB-1M", name: "10GB - 30 Days", price: 3000 },
        { id: "AIR-20GB-1M", name: "20GB - 30 Days", price: 5000 },
      ],
      Glo: [
        { id: "GLO-100MB-1D", name: "100MB - 1 Day", price: 50 },
        { id: "GLO-200MB-5D", name: "200MB - 5 Days", price: 100 },
        { id: "GLO-1GB-1M", name: "1GB - 30 Days", price: 300 },
        { id: "GLO-2GB-1M", name: "2GB - 30 Days", price: 500 },
        { id: "GLO-5GB-1M", name: "5GB - 30 Days", price: 1500 },
        { id: "GLO-10GB-1M", name: "10GB - 30 Days", price: 2500 },
        { id: "GLO-50GB-1M", name: "50GB - 30 Days", price: 8000 },
      ],
      "9mobile": [
        { id: "9MB-150MB-1D", name: "150MB - 1 Day", price: 100 },
        { id: "9MB-1GB-1M", name: "1GB - 30 Days", price: 300 },
        { id: "9MB-2GB-1M", name: "2GB - 30 Days", price: 500 },
        { id: "9MB-5GB-1M", name: "5GB - 30 Days", price: 1500 },
        { id: "9MB-10GB-1M", name: "10GB - 30 Days", price: 3000 },
      ]
    };
    const plans = staticPlans[network] || [];
    if (plans.length === 0) return res.status(400).json({ error: "Invalid network" });
    res.json({ success: true, plans });
  } catch (err) {
    console.error("Data plans error:", err.message);
    res.status(500).json({ error: "Failed to fetch data plans" });
  }
});
// 9. Purchase Data Bundle
app.post("/api/pay/data", auth, async (req, res) => {
  try {
    const { phone, network, planId, amount, planName, pin } = req.body;
    if (!phone || !network || !planId || !amount) return res.status(400).json({ error: "Phone, network, plan and amount are required" });
    const user = await User.findById(req.user.id);
    const pinCheck = await verifyWalletPin(user, pin);
    if (!pinCheck.ok) return res.status(400).json({ error: pinCheck.error });
    if ((user.walletBalance || 0) < Number(amount)) return res.status(400).json({ error: "Insufficient wallet balance" });

    const networkMap = { MTN: "MTN", Airtel: "AIRTEL", Glo: "GLO", "9mobile": "9MOBILE" };
    const networkCode = networkMap[network];
    if (!networkCode) return res.status(400).json({ error: "Invalid network" });

    const reference = "DATA-" + Date.now();

    // Debit wallet first
    user.walletBalance = (user.walletBalance || 0) - Number(amount);
    user.walletTransactions.push({
      type: "debit",
      amount: Number(amount),
      description: `${network} ${planName || planId} data for ${phone}`,
      reference,
      status: "pending"
    });
    await user.save();

    // Clubkonnect not yet active — refund and block
    user.walletBalance = (user.walletBalance || 0) + Number(amount);
    user.walletTransactions.push({ type: "credit", amount: Number(amount), description: "Refund: data service coming soon", reference: reference + "-REFUND" });
    await user.save();
    return res.status(503).json({ error: "Data bundle service is coming soon. Your wallet has not been charged." });
  } catch (err) {
    console.error("Data bundle error:", err.response?.data || err.message);
    res.status(500).json({ error: "Data purchase failed" });
  }
});


// 10. Verify Electricity Meter
app.post("/api/pay/electricity/verify", auth, async (req, res) => {
  try {
    const { meterNumber, disco, meterType } = req.body;
    if (!meterNumber || !disco || !meterType) return res.status(400).json({ error: "Meter number, disco and meter type are required" });

    const response = await axios.get(
      `https://www.nellobytesystems.com/APIVerifyElectricityV1.asp?UserID=${process.env.CLUBKONNECT_USER_ID}&APIKey=${process.env.CLUBKONNECT_API_KEY}&ElectricDisco=${disco}&MeterType=${meterType}&MeterNumber=${meterNumber}`
    );
    res.json({ success: true, data: response.data });
  } catch (err) {
    console.error("Meter verify error:", err.message);
    res.status(500).json({ error: "Failed to verify meter" });
  }
});

// 11. Pay Electricity Bill
app.post("/api/pay/electricity", auth, async (req, res) => {
  try {
    const { meterNumber, disco, meterType, amount, customerName, pin } = req.body;
    if (!meterNumber || !disco || !meterType || !amount) return res.status(400).json({ error: "All fields are required" });
    if (Number(amount) < 500) return res.status(400).json({ error: "Minimum electricity payment is N500" });
    const user = await User.findById(req.user.id);
    const pinCheck = await verifyWalletPin(user, pin);
    if (!pinCheck.ok) return res.status(400).json({ error: pinCheck.error });
    if ((user.walletBalance || 0) < Number(amount)) return res.status(400).json({ error: "Insufficient wallet balance" });

    const reference = "ELEC-" + Date.now();

    // Debit wallet first
    user.walletBalance = (user.walletBalance || 0) - Number(amount);
    user.walletTransactions.push({
      type: "debit",
      amount: Number(amount),
      description: `${disco} electricity for meter ${meterNumber}`,
      reference,
      status: "pending"
    });
    await user.save();

    // Clubkonnect not yet active — refund and block
    user.walletBalance = (user.walletBalance || 0) + Number(amount);
    user.walletTransactions.push({ type: "credit", amount: Number(amount), description: "Refund: electricity service coming soon", reference: reference + "-REFUND" });
    await user.save();
    return res.status(503).json({ error: "Electricity payment service is coming soon. Your wallet has not been charged." });
  } catch (err) {
    console.error("Electricity error:", err.response?.data || err.message);
    res.status(500).json({ error: "Electricity payment failed" });
  }
});


// 12. Verify Cable TV Smartcard
app.post("/api/pay/cabletv/verify", auth, async (req, res) => {
  try {
    const { smartcardNumber, provider } = req.body;
    if (!smartcardNumber || !provider) return res.status(400).json({ error: "Smartcard number and provider are required" });

    const response = await axios.get(
      `https://www.nellobytesystems.com/APIVerifyCableTVV1.asp?UserID=${process.env.CLUBKONNECT_USER_ID}&APIKey=${process.env.CLUBKONNECT_API_KEY}&CableTV=${provider}&SmartCardNo=${smartcardNumber}`
    );
    res.json({ success: true, data: response.data });
  } catch (err) {
    console.error("Smartcard verify error:", err.message);
    res.status(500).json({ error: "Failed to verify smartcard" });
  }
});

// 13. Get Cable TV Packages
app.get("/api/pay/cabletv/plans/:provider", auth, async (req, res) => {
  try {
    const { provider } = req.params;

    const staticPlans = {
      DSTV: [
        { id: "DSTV-PADI", name: "DStv Padi", price: 2950 },
        { id: "DSTV-YANGA", name: "DStv Yanga", price: 4100 },
        { id: "DSTV-CONFAM", name: "DStv Confam", price: 6200 },
        { id: "DSTV-COMPACT", name: "DStv Compact", price: 9000 },
        { id: "DSTV-COMPACT-PLUS", name: "DStv Compact Plus", price: 14250 },
        { id: "DSTV-PREMIUM", name: "DStv Premium", price: 24500 },
      ],
      GOTV: [
        { id: "GOTV-SUPA-PLUS", name: "GOtv Supa+", price: 6400 },
        { id: "GOTV-SUPA", name: "GOtv Supa", price: 5500 },
        { id: "GOTV-MAX", name: "GOtv Max", price: 4850 },
        { id: "GOTV-JOLLI", name: "GOtv Jolli", price: 3800 },
        { id: "GOTV-JINJA", name: "GOtv Jinja", price: 2800 },
        { id: "GOTV-SMALLIE", name: "GOtv Smallie", price: 1575 },
      ],
      STARTIMES: [
        { id: "ST-NOVA", name: "Startimes Nova", price: 1300 },
        { id: "ST-BASIC", name: "Startimes Basic", price: 2200 },
        { id: "ST-SMART", name: "Startimes Smart", price: 3100 },
        { id: "ST-CLASSIC", name: "Startimes Classic", price: 2500 },
        { id: "ST-SUPER", name: "Startimes Super", price: 4900 },
      ]
    };

    const plans = staticPlans[provider.toUpperCase()] || [];
    if (plans.length === 0) return res.status(400).json({ error: "Invalid provider" });

    res.json({ success: true, plans });
  } catch (err) {
    console.error("Cable TV plans error:", err.message);
    res.status(500).json({ error: "Failed to fetch cable TV plans" });
  }
});

// 14. Pay Cable TV Subscription
app.post("/api/pay/cabletv", auth, async (req, res) => {
  try {
    const { smartcardNumber, provider, planId, planName, amount, customerName, pin } = req.body;
    if (!smartcardNumber || !provider || !planId || !amount) return res.status(400).json({ error: "All fields are required" });
    const user = await User.findById(req.user.id);
    const pinCheck = await verifyWalletPin(user, pin);
    if (!pinCheck.ok) return res.status(400).json({ error: pinCheck.error });
    if ((user.walletBalance || 0) < Number(amount)) return res.status(400).json({ error: "Insufficient wallet balance" });

    const reference = "CATV-" + Date.now();

    // Debit wallet first
    user.walletBalance = (user.walletBalance || 0) - Number(amount);
    user.walletTransactions.push({
      type: "debit",
      amount: Number(amount),
      description: `${provider} ${planName || planId} for smartcard ${smartcardNumber}`,
      reference,
      status: "pending"
    });
    await user.save();

    // TODO: Replace with live Clubkonnect API call when credentials are active
    // const ckUrl = `https://www.nellobytesystems.com/APICableTVV1.asp?UserID=${process.env.CLUBKONNECT_USER_ID}&APIKey=${process.env.CLUBKONNECT_API_KEY}&CableTV=${provider}&SmartCardNo=${smartcardNumber}&PackageCode=${planId}&Amount=${amount}&RequestID=${reference}&CallBackURL=`;
    // const ckRes = await axios.get(ckUrl);

    analyzeFraud(user, "cabletv_payment", { provider, planId, amount, reference }).catch(() => {});
    res.json({ success: true, reference, message: `${provider} ${planName || planId} subscription successful` });
  } catch (err) {
    console.error("Cable TV error:", err.response?.data || err.message);
    res.status(500).json({ error: "Cable TV payment failed" });
  }
});


// Set Wallet PIN
app.post("/api/pay/pin/set", auth, async (req, res) => {
  try {
    const { pin } = req.body;
    if (!pin || pin.length !== 4 || !/^\d{4}$/.test(pin)) return res.status(400).json({ error: "PIN must be exactly 4 digits" });
    const hashed = await bcrypt.hash(pin, 10);
    await User.findByIdAndUpdate(req.user.id, { walletPin: hashed, walletPinSet: true });
    res.json({ success: true, message: "Wallet PIN set successfully" });
  } catch (err) {
    res.status(500).json({ error: "Failed to set PIN" });
  }
});

// Verify Wallet PIN
app.post("/api/pay/pin/verify", auth, async (req, res) => {
  try {
    const { pin } = req.body;
    if (!pin) return res.status(400).json({ error: "PIN is required" });
    const user = await User.findById(req.user.id);
    if (!user.walletPinSet) return res.status(400).json({ error: "No PIN set. Please set a wallet PIN first." });
    const match = await bcrypt.compare(pin, user.walletPin);
    if (!match) return res.status(401).json({ error: "Incorrect PIN" });
    res.json({ success: true, message: "PIN verified" });
  } catch (err) {
    res.status(500).json({ error: "PIN verification failed" });
  }
});


// Forgot Wallet PIN - Send OTP
app.post("/api/pay/pin/forgot", auth, async (req, res) => {
  try {
    const user = await User.findById(req.user.id);

    const otp = String(Math.floor(100000 + Math.random() * 900000));
    user.walletPinResetOtp = otp;
    user.walletPinResetExpires = new Date(Date.now() + 10 * 60 * 1000);

    await user.save();

    const {
      sendWalletPinResetOTP
    } = await import("./services/notificationService.js");

    const smsResult = await sendWalletPinResetOTP(
      user.phone,
      user.name,
      otp
    );

    let emailSent = false;

    if (!smsResult.success) {
      console.warn("⚠️ SMS delivery failed:", smsResult.error);

      try {
        await sendOTPEmail(user.email, user.name, otp);
        emailSent = true;
        console.log("📧 Wallet PIN OTP sent via email fallback.");
      } catch (emailErr) {
        console.error("❌ Email fallback failed:", emailErr.message);
      }
    }

    res.json({
      success: true,
      smsSent: smsResult.success,
      emailSent,
      message: smsResult.success
        ? "Wallet PIN reset OTP sent via SMS."
        : emailSent
          ? "SMS is temporarily unavailable. The OTP has been sent to your email."
          : "OTP generated successfully, but delivery failed. Please contact support."
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({
      error: "Failed to send reset OTP"
    });
  }
});


// Reset Wallet PIN
app.post("/api/pay/pin/reset", auth, async (req, res) => {
  try {

    const { otp, newPin } = req.body;

    console.log("========== PIN RESET REQUEST ==========");
    console.log("User:", req.user.id);
    console.log("Body:", req.body);
    console.log("OTP:", otp);
    console.log("New PIN:", newPin);
    console.log("=======================================");

    if (!otp || !newPin)
      return res.status(400).json({
        error: "OTP and new PIN are required"
      });

    if (!/^\d{4}$/.test(newPin))
      return res.status(400).json({
        error: "PIN must be exactly 4 digits"
      });

    const user = await User.findById(req.user.id);

    console.log("===== WALLET PIN RESET DEBUG =====");
    console.log("OTP received:", otp);
    console.log("OTP stored:", user.walletPinResetOtp);
    console.log("Expires:", user.walletPinResetExpires);
    console.log("Now:", new Date());

    if (
      user.walletPinResetOtp !== otp ||
      !user.walletPinResetExpires ||
      user.walletPinResetExpires < new Date()
    ) {
      return res.status(400).json({
        error: "Invalid or expired OTP"
      });
    }

    user.walletPin = await bcrypt.hash(newPin, 10);
    user.walletPinSet = true;
    user.walletPinResetOtp = null;
    user.walletPinResetExpires = null;

    await user.save();

    res.json({
      success: true,
      message: "Wallet PIN reset successfully."
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({
      error: "Failed to reset Wallet PIN"
    });
  }
});


// Change Wallet PIN
app.post("/api/pay/pin/change", auth, async (req, res) => {
  try {
    const { oldPin, newPin, confirmPin } = req.body;

    if (!oldPin || !newPin || !confirmPin) {
      return res.status(400).json({
        error: "Old PIN, new PIN and confirmation are required"
      });
    }

    if (!/^\d{4}$/.test(newPin)) {
      return res.status(400).json({
        error: "New PIN must be exactly 4 digits"
      });
    }

    if (newPin !== confirmPin) {
      return res.status(400).json({
        error: "PIN confirmation does not match"
      });
    }

    const user = await User.findById(req.user.id);

    const pinCheck = await verifyWalletPin(user, oldPin);

    if (!pinCheck.ok) {
      return res.status(400).json({
        error: pinCheck.error
      });
    }

    const samePin = await bcrypt.compare(String(newPin), user.walletPin || "");

    if (samePin) {
      return res.status(400).json({
        error: "New PIN must be different from the current PIN"
      });
    }

    user.walletPin = await bcrypt.hash(String(newPin), 10);
    await user.save();

    res.json({
      success: true,
      message: "Wallet PIN changed successfully"
    });

  } catch (err) {
    console.error("PIN change error:", err);
    res.status(500).json({
      error: "Failed to change PIN"
    });
  }
});

// 15. Get Betting Platforms
app.get("/api/pay/betting/platforms", auth, async (req, res) => {
  try {
    const platforms = [
      { id: "bet9ja", name: "Bet9ja", icon: "🎯", minDeposit: 100 },
      { id: "sportybet", name: "SportyBet", icon: "⚽", minDeposit: 100 },
      { id: "1xbet", name: "1xBet", icon: "🏆", minDeposit: 100 }
    ];
    res.json({ success: true, platforms });
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch platforms" });
  }
});

// 16. Fund Betting Wallet
app.post("/api/pay/betting", auth, async (req, res) => {
  try {
    const { platform, bettingId, amount, pin } = req.body;
    if (!platform || !bettingId || !amount) return res.status(400).json({ error: "Platform, betting ID and amount are required" });
    if (Number(amount) < 100) return res.status(400).json({ error: "Minimum betting deposit is N100" });
    const validPlatforms = ["bet9ja", "sportybet", "1xbet"];
    if (!validPlatforms.includes(platform.toLowerCase())) return res.status(400).json({ error: "Invalid betting platform" });

    const user = await User.findById(req.user.id);
    if ((user.walletBalance || 0) < Number(amount)) return res.status(400).json({ error: "Insufficient wallet balance" });

    const reference = "BET-" + Date.now();
    const platformNames = { bet9ja: "Bet9ja", sportybet: "SportyBet", "1xbet": "1xBet" };

    // Debit wallet first
    user.walletBalance = (user.walletBalance || 0) - Number(amount);
    user.walletTransactions.push({
      type: "debit",
      amount: Number(amount),
      description: `${platformNames[platform.toLowerCase()]} wallet funding for ID ${bettingId}`,
      reference,
      status: "pending"
    });
    await user.save();

    // Clubkonnect not yet active — refund and block
    user.walletBalance = (user.walletBalance || 0) + Number(amount);
    user.walletTransactions.push({ type: "credit", amount: Number(amount), description: "Refund: betting service coming soon", reference: reference + "-REFUND" });
    await user.save();
    return res.status(503).json({ error: "Betting wallet funding is coming soon. Your wallet has not been charged." });
  } catch (err) {
    console.error("Betting error:", err.response?.data || err.message);
    res.status(500).json({ error: "Betting wallet funding failed" });
  }
});

// 7. TechMart Pay Dashboard Data
app.get("/api/pay/dashboard", auth, async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select("name email walletBalance walletTransactions virtualAccountNumber virtualAccountBank walletPinSet bvnVerified ninVerified");
    
    // Recent transactions (last 10)
    const recent = [...(user.walletTransactions || [])].reverse().slice(0, 10);
    
    // Stats
    const totalIn = (user.walletTransactions || []).filter(t => t.type === "credit").reduce((sum, t) => sum + t.amount, 0);
    const totalOut = (user.walletTransactions || []).filter(t => t.type === "debit").reduce((sum, t) => sum + t.amount, 0);

    res.json({
      walletPinSet: user.walletPinSet,
      balance: user.walletBalance || 0,
      virtualAccount: user.virtualAccountNumber ? {
        accountNumber: user.virtualAccountNumber,
        bankName: user.virtualAccountBank || "Wema Bank",
        accountName: user.name
      } : null,
      recentTransactions: recent,
      stats: { totalIn, totalOut, transactionCount: (user.walletTransactions || []).length },
      bvnVerified: user.bvnVerified || false,
      ninVerified: user.ninVerified || false
    });
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch dashboard" });
  }
});

/* ===========================
   MARKETPLACE ENDPOINTS
=========================== */

// --- SELLER ANALYTICS ---
app.get("/api/seller/analytics", sellerAuth, async (req, res) => {
  try {
    const products = await Product.find({ vendorId: req.seller.id });
    const productIds = products.map(p => p._id.toString());
    const orders = await Order.find({ status: { $in: ["Paid", "Shipped", "Delivered"] } });
    const sellerOrders = orders.filter(o => o.items?.some(i => productIds.includes(i._id?.toString() || i.productId?.toString())));
    const seller = await Seller.findById(req.seller.id);
    const commission = seller.commission || 10;

    const revenue = sellerOrders.reduce((sum, o) => {
      const items = o.items.filter(i => productIds.includes(i._id?.toString() || i.productId?.toString()));
      return sum + items.reduce((s, i) => s + (i.price * (i.quantity || 1)), 0);
    }, 0);

    const commissionAmount = Math.round((commission / 100) * revenue);
    const netRevenue = revenue - commissionAmount;

    // Revenue by date (last 30 days)
    const revenueByDate = {};
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    sellerOrders.filter(o => new Date(o.createdAt) >= thirtyDaysAgo).forEach(o => {
      const date = new Date(o.createdAt).toLocaleDateString();
      const items = o.items.filter(i => productIds.includes(i._id?.toString() || i.productId?.toString()));
      const orderRevenue = items.reduce((s, i) => s + (i.price * (i.quantity || 1)), 0);
      revenueByDate[date] = (revenueByDate[date] || 0) + orderRevenue;
    });

    // Top products
    const productSales = {};
    sellerOrders.forEach(o => {
      o.items.filter(i => productIds.includes(i._id?.toString() || i.productId?.toString())).forEach(i => {
        const id = i._id?.toString() || i.productId?.toString();
        if (!productSales[id]) productSales[id] = { name: i.name, sales: 0, revenue: 0 };
        productSales[id].sales += (i.quantity || 1);
        productSales[id].revenue += (i.price * (i.quantity || 1));
      });
    });
    const topProducts = Object.values(productSales).sort((a, b) => b.revenue - a.revenue).slice(0, 5);

    // Performance metrics
    const totalReviews = products.reduce((sum, p) => sum + (p.reviews?.filter(r => r.approved)?.length || 0), 0);
    const avgRating = products.reduce((sum, p) => sum + (p.rating || 0), 0) / (products.length || 1);
    const disputes = await Dispute.countDocuments({ sellerId: req.seller.id });
    const resolvedDisputes = await Dispute.countDocuments({ sellerId: req.seller.id, status: "resolved" });

    res.json({
      revenue, commissionAmount, netRevenue, commission,
      totalOrders: sellerOrders.length,
      totalProducts: products.length,
      revenueByDate,
      topProducts,
      avgRating: avgRating.toFixed(1),
      totalReviews,
      disputes,
      resolvedDisputes,
      fulfillmentRate: sellerOrders.length > 0 ? Math.round((sellerOrders.filter(o => o.status === "Delivered").length / sellerOrders.length) * 100) : 0
    });
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch analytics" });
  }
});

// --- COMMISSION MANAGEMENT (Admin) ---
app.put("/api/admin/sellers/:id/commission", adminOnly, async (req, res) => {
  try {
    const { commission } = req.body;
    const seller = await Seller.findByIdAndUpdate(req.params.id, { commission: Number(commission) }, { new: true }).select("-password");
    res.json({ success: true, data: seller });
  } catch (err) {
    res.status(500).json({ error: "Failed to update commission" });
  }
});

// --- SELLER VERIFICATION (Admin) ---
app.put("/api/admin/sellers/:id/verify", adminOnly, async (req, res) => {
  try {
    const { verified } = req.body;
    const seller = await Seller.findByIdAndUpdate(req.params.id, { verified: Boolean(verified) }, { new: true }).select("-password");
    res.json({ success: true, data: seller });
  } catch (err) {
    res.status(500).json({ error: "Failed to update verification" });
  }
});

// --- STOREFRONT CUSTOMIZATION ---
app.put("/api/seller/storefront", sellerAuth, async (req, res) => {
  try {
    const { storeDescription, storeBanner, storeLogo, storeColor } = req.body;
    const seller = await Seller.findByIdAndUpdate(
      req.seller.id,
      { storeDescription, storeBanner, storeLogo, storeColor },
      { new: true }
    ).select("-password");
    res.json({ success: true, data: seller });
  } catch (err) {
    res.status(500).json({ error: "Failed to update storefront" });
  }
});

// Get seller storefront (public)
app.get("/api/seller/store/:id", async (req, res) => {
  try {
    const seller = await Seller.findById(req.params.id).select("-password");
    if (!seller || seller.status !== "approved") return res.status(404).json({ error: "Store not found" });
    const products = await Product.find({ vendorId: req.params.id });
    res.json({ seller, products });
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch store" });
  }
});

// --- PAYOUT REQUESTS ---
app.post("/api/seller/payouts", sellerAuth, async (req, res) => {
  try {
    const { amount, bankName, accountNumber, accountName } = req.body;
    if (!amount || !bankName || !accountNumber || !accountName) {
      return res.status(400).json({ error: "All fields are required" });
    }
    const seller = await Seller.findById(req.seller.id);
    const payout = await Payout.create({
      sellerId: req.seller.id,
      sellerName: seller.name,
      storeName: seller.storeName,
      amount: Number(amount),
      bankName, accountNumber, accountName
    });
    res.status(201).json({ success: true, data: payout });
  } catch (err) {
    res.status(500).json({ error: "Failed to request payout" });
  }
});

app.get("/api/seller/payouts", sellerAuth, async (req, res) => {
  try {
    const payouts = await Payout.find({ sellerId: req.seller.id }).sort({ createdAt: -1 });
    res.json(payouts);
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch payouts" });
  }
});

// Admin payout management
app.get("/api/admin/payouts", adminOnly, async (req, res) => {
  try {
    const payouts = await Payout.find().sort({ createdAt: -1 });
    res.json(payouts);
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch payouts" });
  }
});

app.put("/api/admin/payouts/:id", adminOnly, async (req, res) => {
  try {
    const { status, note } = req.body;
    const payout = await Payout.findByIdAndUpdate(req.params.id, { status, note }, { new: true });
    res.json({ success: true, data: payout });
  } catch (err) {
    res.status(500).json({ error: "Failed to update payout" });
  }
});

// --- DISPUTES ---
app.post("/api/disputes", auth, async (req, res) => {
  try {
    const { orderId, subject, description, reason } = req.body;
    if (!orderId || !description) return res.status(400).json({ error: "Order ID and description are required" });
    const user = await User.findById(req.user.id);
    const order = await Order.findById(orderId);
    if (!order) return res.status(404).json({ error: "Order not found" });
    if (order.email !== user.email) return res.status(403).json({ error: "Not your order" });
    // Derive sellerId/sellerName from the order itself, never trust client input
    const sellerId = order.items[0]?.vendorId || null;
    let sellerName = "Unknown Seller";
    if (sellerId) {
      const seller = await Seller.findById(sellerId).catch(() => null);
      if (seller) sellerName = seller.storeName || seller.name;
    }
    const dispute = await Dispute.create({
      orderId, sellerId, sellerName, subject: subject || reason || "Order dispute", description,
      customerEmail: user.email,
      customerId: req.user.id,
      messages: [{ sender: user.name, senderType: "customer", message: description }]
    });
    res.status(201).json({ success: true, data: dispute });
  } catch (err) {
    console.error("Dispute creation error:", err.message);
    res.status(500).json({ error: "Failed to create dispute" });
  }
});

app.get("/api/disputes/my", auth, async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    const disputes = await Dispute.find({ customerEmail: user.email }).sort({ createdAt: -1 });
    res.json(disputes);
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch disputes" });
  }
});

app.get("/api/seller/disputes", sellerAuth, async (req, res) => {
  try {
    const disputes = await Dispute.find({ sellerId: req.seller.id }).sort({ createdAt: -1 });
    res.json(disputes);
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch disputes" });
  }
});

app.post("/api/disputes/:id/reply", async (req, res) => {
  try {
    const { message, sender, senderType } = req.body;
    const dispute = await Dispute.findByIdAndUpdate(
      req.params.id,
      {
        $push: { messages: { sender, senderType, message } },
        status: senderType === "seller" ? "seller_responded" : "open"
      },
      { new: true }
    );
    res.json({ success: true, data: dispute });
  } catch (err) {
    res.status(500).json({ error: "Failed to reply to dispute" });
  }
});

app.get("/api/admin/disputes", adminOnly, async (req, res) => {
  try {
    const disputes = await Dispute.find().sort({ createdAt: -1 });
    res.json(disputes);
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch disputes" });
  }
});

app.put("/api/admin/disputes/:id", adminOnly, async (req, res) => {
  try {
    const { status } = req.body;
    const dispute = await Dispute.findByIdAndUpdate(req.params.id, { status }, { new: true });
    res.json({ success: true, data: dispute });
  } catch (err) {
    res.status(500).json({ error: "Failed to update dispute" });
  }
});

// --- SELLER MESSAGING ---
app.post("/api/seller/messages", auth, async (req, res) => {
  req.body.message = sanitize(req.body.message || "");
  req.body.subject = sanitize(req.body.subject || "");
  try {
    const { sellerId, productId, productName, message } = req.body;
    const user = await User.findById(req.user.id);
    let thread = await SellerMessage.findOne({ sellerId, customerEmail: user.email, productId });
    if (!thread) {
      thread = await SellerMessage.create({
        sellerId, customerEmail: user.email, customerName: user.name,
        productId, productName,
        messages: [{ sender: user.name, senderType: "customer", message }]
      });
    } else {
      thread.messages.push({ sender: user.name, senderType: "customer", message });
      await thread.save();
    }
    res.json({ success: true, data: thread });
  } catch (err) {
    res.status(500).json({ error: "Failed to send message" });
  }
});

app.get("/api/seller/messages", sellerAuth, async (req, res) => {
  try {
    const threads = await SellerMessage.find({ sellerId: req.seller.id }).sort({ createdAt: -1 });
    res.json(threads);
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch messages" });
  }
});

app.post("/api/seller/messages/:id/reply", sellerAuth, async (req, res) => {
  req.body.message = sanitize(req.body.message || "");
  try {
    const { message } = req.body;
    const seller = await Seller.findById(req.seller.id);
    const thread = await SellerMessage.findByIdAndUpdate(
      req.params.id,
      { $push: { messages: { sender: seller.storeName, senderType: "seller", message } } },
      { new: true }
    );
    res.json({ success: true, data: thread });
  } catch (err) {
    res.status(500).json({ error: "Failed to reply" });
  }
});

app.get("/api/seller/messages/customer", auth, async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    const threads = await SellerMessage.find({ customerEmail: user.email }).sort({ createdAt: -1 });
    res.json(threads);
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch messages" });
  }
});


/* ===========================
   AI COMMERCE ENDPOINTS
=========================== */
// AI Chat Assistant
app.post("/api/ai/chat", async (req, res) => {
  try {
    const { message, history = [], userEmail = "Guest", userName = "Guest" } = req.body;
    if (!message) return res.status(400).json({ error: "Message is required" });

    const liveProducts = await Product.find({ stock: { $gt: 0 } }).select("name price stock category description");
    const catalogContext = liveProducts.map(p =>
      `- ${p.name} (N${p.price.toLocaleString()}) | Category: ${p.category} | Stock: ${p.stock} left.`
    ).join("\n");

    const systemInstruction = {
      role: "system",
      content: `You are the AI Sales Assistant for TechMart, Nigeria's elite electronics store.
CURRENT USER: ${userName !== "Guest" ? userName : "a guest"}.
RULES:
1. Always quote prices in Naira (N symbol).
2. Only recommend products from the LIVE CATALOG below.
3. Keep answers concise and helpful.
LIVE CATALOG:
${catalogContext}`
    };

    const messagesPayload = [
      systemInstruction,
      ...history.map(msg => ({ role: msg.sender === "user" ? "user" : "assistant", content: msg.text })),
      { role: "user", content: message }
    ];

    const completion = await groq.chat.completions.create({
      model: "llama-3.3-70b-versatile",
      messages: messagesPayload,
      temperature: 0.7,
      max_tokens: 500
    });

    res.json({ reply: completion.choices[0].message.content });
  } catch (err) {
    console.error("AI chat error:", err.message);
    res.status(500).json({ error: "AI server error" });
  }
});

app.post("/api/ai/search", async (req, res) => {
  try {
    const { query } = req.body;
    if (!query) return res.status(400).json({ error: "Query is required" });

    const products = await Product.find({ stock: { $gt: 0 } });
    const productList = products.map(p => `ID:${p._id} | ${p.name} | N${p.price} | ${p.category} | Stock:${p.stock} | ${p.description?.substring(0, 100)}`).join("\n");

    const response = await axios.post(
      "https://api.groq.com/openai/v1/chat/completions",
      {
        model: "llama-3.3-70b-versatile",
        messages: [
          {
            role: "system",
            content: `You are TechMart's AI search engine. Given a customer's natural language query and a list of products, return the IDs of the most relevant products (max 10). Only return a JSON array of IDs like: ["id1","id2"]. No explanation.`
          },
          {
            role: "user",
            content: `Query: "${query}"\n\nProducts:\n${productList}`
          }
        ],
        max_tokens: 200,
        temperature: 0.1
      },
      { headers: { Authorization: `Bearer ${process.env.GROQ_API_KEY}`, "Content-Type": "application/json" } }
    );

    const text = response.data.choices[0].message.content.trim();
    let ids = [];
    try {
      ids = JSON.parse(text);
    } catch {
      const match = text.match(/\[.*?\]/s);
      if (match) ids = JSON.parse(match[0]);
    }

    const results = products.filter(p => ids.includes(p._id.toString()));
    res.json({ success: true, query, results, total: results.length });
  } catch (err) {
    console.error("AI search error:", err.message);
    res.status(500).json({ error: "AI search failed" });
  }
});

// 2. AI PRODUCT RECOMMENDATIONS
app.post("/api/ai/recommendations", async (req, res) => {
  try {
    const { productId, cartItems, userId } = req.body;
    const products = await Product.find({ stock: { $gt: 0 } });

    let context = "";
    if (productId) {
      const current = products.find(p => p._id.toString() === productId);
      if (current) context += `Currently viewing: ${current.name} (${current.category}) at N${current.price}\n`;
    }
    if (cartItems?.length) {
      context += `In cart: ${cartItems.map(i => i.name).join(", ")}\n`;
    }

    const productList = products
      .filter(p => p._id.toString() !== productId)
      .map(p => `ID:${p._id} | ${p.name} | N${p.price} | ${p.category}`)
      .join("\n");

    const response = await axios.post(
      "https://api.groq.com/openai/v1/chat/completions",
      {
        model: "llama-3.3-70b-versatile",
        messages: [
          {
            role: "system",
            content: `You are TechMart's recommendation engine. Based on customer context, recommend the 6 most relevant products. Return only a JSON array of IDs: ["id1","id2",...]. No explanation.`
          },
          {
            role: "user",
            content: `Context:\n${context}\nAvailable products:\n${productList}`
          }
        ],
        max_tokens: 200,
        temperature: 0.3
      },
      { headers: { Authorization: `Bearer ${process.env.GROQ_API_KEY}`, "Content-Type": "application/json" } }
    );

    const text = response.data.choices[0].message.content.trim();
    let ids = [];
    try { ids = JSON.parse(text); } catch { const m = text.match(/\[.*?\]/s); if (m) ids = JSON.parse(m[0]); }

    const results = products.filter(p => ids.includes(p._id.toString())).slice(0, 6);
    res.json({ success: true, results });
  } catch (err) {
    console.error("AI recommendations error:", err.message);
    res.status(500).json({ error: "Failed to get recommendations" });
  }
});

// 3. AI BUNDLE SUGGESTIONS
app.post("/api/ai/bundles", async (req, res) => {
  try {
    const { productId } = req.body;
    const product = await Product.findById(productId);
    if (!product) return res.status(404).json({ error: "Product not found" });

    const otherProducts = await Product.find({ _id: { $ne: productId }, stock: { $gt: 0 } });
    const productList = otherProducts.map(p => `ID:${p._id} | ${p.name} | N${p.price} | ${p.category}`).join("\n");

    const response = await axios.post(
      "https://api.groq.com/openai/v1/chat/completions",
      {
        model: "llama-3.3-70b-versatile",
        messages: [
          {
            role: "system",
            content: `You are TechMart's bundle suggestion engine. Suggest 3 complementary products that go well with the main product. Return only a JSON array of IDs: ["id1","id2","id3"]. No explanation.`
          },
          {
            role: "user",
            content: `Main product: ${product.name} (${product.category}) at N${product.price}\n\nAvailable products:\n${productList}`
          }
        ],
        max_tokens: 150,
        temperature: 0.3
      },
      { headers: { Authorization: `Bearer ${process.env.GROQ_API_KEY}`, "Content-Type": "application/json" } }
    );

    const text = response.data.choices[0].message.content.trim();
    let ids = [];
    try { ids = JSON.parse(text); } catch { const m = text.match(/\[.*?\]/s); if (m) ids = JSON.parse(m[0]); }

    const bundleProducts = await Product.find({ _id: { $in: ids }, stock: { $gt: 0 } });
    const bundleTotal = product.price + bundleProducts.reduce((sum, p) => sum + p.price, 0);
    const bundleDiscount = Math.round(bundleTotal * 0.05);

    res.json({ success: true, mainProduct: product, bundleProducts, bundleTotal, bundleDiscount, bundlePrice: bundleTotal - bundleDiscount });
  } catch (err) {
    console.error("AI bundle error:", err.message);
    res.status(500).json({ error: "Failed to get bundle suggestions" });
  }
});

// 4. AI PRODUCT DESCRIPTION GENERATOR
app.post("/api/ai/generate-description", async (req, res) => {
  try {
    const { productName, category, price, keyFeatures } = req.body;
    if (!productName) return res.status(400).json({ error: "Product name is required" });

    const response = await axios.post(
      "https://api.groq.com/openai/v1/chat/completions",
      {
        model: "llama-3.3-70b-versatile",
        messages: [
          {
            role: "system",
            content: `You are TechMart's product description writer. Write compelling, SEO-friendly product descriptions for Nigerian electronics marketplace. Be concise (100-150 words), highlight key benefits, and use engaging language. Return only the description text, no extra formatting.`
          },
          {
            role: "user",
            content: `Product: ${productName}\nCategory: ${category || "Electronics"}\nPrice: N${price || ""}\nKey Features: ${keyFeatures || "Not specified"}\n\nWrite a compelling product description.`
          }
        ],
        max_tokens: 300,
        temperature: 0.7
      },
      { headers: { Authorization: `Bearer ${process.env.GROQ_API_KEY}`, "Content-Type": "application/json" } }
    );

    const description = response.data.choices[0].message.content.trim();
    res.json({ success: true, description });
  } catch (err) {
    console.error("AI description error:", err.message);
    res.status(500).json({ error: "Failed to generate description" });
  }
});

// 5. AI REVIEW SUMMARY
app.get("/api/ai/review-summary/:productId", async (req, res) => {
  try {
    const product = await Product.findById(req.params.productId);
    if (!product) return res.status(404).json({ error: "Product not found" });

    const approvedReviews = product.reviews?.filter(r => r.approved) || [];
    if (approvedReviews.length === 0) return res.json({ success: true, summary: null, reviewCount: 0 });

    const reviewText = approvedReviews.map(r => `${r.stars}/5 stars: ${r.comment}`).join("\n");

    const response = await axios.post(
      "https://api.groq.com/openai/v1/chat/completions",
      {
        model: "llama-3.3-70b-versatile",
        messages: [
          {
            role: "system",
            content: `You are TechMart's review summarizer. Summarize customer reviews in 2-3 sentences. Mention what customers love and any concerns. Be balanced and factual. Return only the summary text.`
          },
          {
            role: "user",
            content: `Product: ${product.name}\nReviews:\n${reviewText}`
          }
        ],
        max_tokens: 200,
        temperature: 0.3
      },
      { headers: { Authorization: `Bearer ${process.env.GROQ_API_KEY}`, "Content-Type": "application/json" } }
    );

    const summary = response.data.choices[0].message.content.trim();
    res.json({ success: true, summary, reviewCount: approvedReviews.length, avgRating: product.rating });
  } catch (err) {
    console.error("AI review summary error:", err.message);
    res.status(500).json({ error: "Failed to generate review summary" });
  }
});

// 6. AI INVENTORY FORECASTING
app.get("/api/ai/inventory-forecast", adminOnly, async (req, res) => {
  try {
    const products = await Product.find();
    const orders = await Order.find({ status: { $in: ["Paid", "Delivered", "Shipped"] }, createdAt: { $gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) } });

    // Calculate sales velocity per product
    const salesMap = {};
    orders.forEach(o => {
      o.items?.forEach(item => {
        const id = item._id?.toString() || item.productId?.toString();
        if (id) salesMap[id] = (salesMap[id] || 0) + (item.quantity || 1);
      });
    });

    const forecasts = products.map(p => {
      const sold30Days = salesMap[p._id.toString()] || 0;
      const dailyVelocity = sold30Days / 30;
      const daysUntilStockout = dailyVelocity > 0 ? Math.floor(p.stock / dailyVelocity) : null;
      const reorderSuggestion = dailyVelocity > 0 ? Math.ceil(dailyVelocity * 30) : 0;

      return {
        productId: p._id,
        name: p.name,
        currentStock: p.stock,
        sold30Days,
        dailyVelocity: dailyVelocity.toFixed(2),
        daysUntilStockout,
        reorderSuggestion,
        status: daysUntilStockout === null ? "slow" : daysUntilStockout <= 7 ? "critical" : daysUntilStockout <= 14 ? "low" : "healthy"
      };
    }).sort((a, b) => (a.daysUntilStockout || 999) - (b.daysUntilStockout || 999));

    res.json({ success: true, forecasts, generatedAt: new Date() });
  } catch (err) {
    console.error("AI forecast error:", err.message);
    res.status(500).json({ error: "Failed to generate forecast" });
  }
});


/* ===========================
   FLASH SALE ENDPOINTS
=========================== */

// Get active flash sales (public)
app.get("/api/flash-sales", async (req, res) => {
  try {
    const now = new Date();
    const sales = await FlashSale.find({
      active: true,
      startTime: { $lte: now },
      endTime: { $gte: now }
    }).populate("productId");
    res.json(sales);
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch flash sales" });
  }
});

// Create flash sale (admin)
app.post("/api/admin/flash-sales", adminOnly, async (req, res) => {
  try {
    const { productId, salePrice, startTime, endTime } = req.body;
    const product = await Product.findById(productId);
    if (!product) return res.status(404).json({ error: "Product not found" });
    const sale = await FlashSale.create({
      productId,
      productName: product.name,
      originalPrice: product.price,
      salePrice: Number(salePrice),
      startTime: new Date(startTime),
      endTime: new Date(endTime),
    });
    res.status(201).json({ success: true, data: sale });
  } catch (err) {
    res.status(500).json({ error: "Failed to create flash sale" });
  }
});

// Get all flash sales (admin)
app.get("/api/admin/flash-sales", adminOnly, async (req, res) => {
  try {
    const sales = await FlashSale.find().sort({ createdAt: -1 });
    res.json(sales);
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch flash sales" });
  }
});

// Delete flash sale (admin)
app.delete("/api/admin/flash-sales/:id", adminOnly, async (req, res) => {
  try {
    await FlashSale.findByIdAndDelete(req.params.id);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: "Failed to delete flash sale" });
  }
});

/* ===========================
   DELIVERY FEE CALCULATOR
=========================== */
const DELIVERY_ZONES = [
  {
    zone: 1,
    name: "Ikeja & Surroundings",
    areas: ["ikeja", "ogba", "agege", "ojota", "alausa", "oregun", "opebi", "allen avenue", "maryland", "palmgrove", "onipanu", "gbagada", "magodo", "omole", "berger", "ojodu", "ketu", "mile 12", "oworo", "oworonshoki"],
    fee: 2500
  },
  {
    zone: 2,
    name: "Mainland",
    areas: ["yaba", "mushin", "oshodi", "surulere", "isolo", "ilasamaja", "itire", "bariga", "shomolu", "tinubu", "iganmu", "ebute metta", "otto", "ijora", "orile", "okota", "ago palace", "isolo"],
    fee: 3500
  },
  {
    zone: 3,
    name: "Lagos Island & VI",
    areas: ["victoria island", "ikoyi", "lagos island", "apapa", "obalende", "broad street", "marina", "bar beach", "eti osa", "itirin", "onikan", "idumota", "balogun", "carter"],
    fee: 4500
  },
  {
    zone: 4,
    name: "Lekki & Ajah",
    areas: ["lekki", "ajah", "sangotedo", "chevron", "vgc", "victoria garden", "abraham adesanya", "jakande", "igbo efon", "ibeju", "awoyaya", "lakowe", "bogije", "monastery", "orchid", "lafiaji"],
    fee: 5500
  },
  {
    zone: 5,
    name: "Outskirts",
    areas: ["ikorodu", "badagry", "epe", "mowe", "ibafo", "sagamu", "sango", "ota", "agbara", "arepo", "ojokoro", "ifako", "meiran", "abule egba", "alakuko"],
    fee: 7500
  },
];
const FREE_DELIVERY_THRESHOLD = 150000;
const DEFAULT_FEE = 12000; // Outside Lagos

const calculateDeliveryFee = (address) => {
  if (!address) return { fee: DEFAULT_FEE, zone: "Outside Lagos" };
  const lower = address.toLowerCase();

  // If address doesn't contain "lagos", charge outside Lagos fee
  if (!lower.includes("lagos")) {
    return { fee: DEFAULT_FEE, zone: "Outside Lagos", zoneNumber: 6 };
  }

  // Check zones by keyword
  for (const zone of DELIVERY_ZONES) {
    if (zone.areas.some(area => lower.includes(area))) {
      return { fee: zone.fee, zone: zone.name, zoneNumber: zone.zone };
    }
  }

  // Address contains Lagos but no specific zone match - charge Zone 2 (Mainland) as default
  return { fee: 3500, zone: "Lagos (Mainland)", zoneNumber: 2 };
};

app.post("/api/delivery-fee", async (req, res) => {
  try {
    const { address, orderTotal } = req.body;
    if (!address) return res.status(400).json({ error: "Address is required" });
    const result = calculateDeliveryFee(address);
    const isFreeDelivery = orderTotal >= FREE_DELIVERY_THRESHOLD;
    res.json({
      fee: isFreeDelivery ? 0 : result.fee,
      originalFee: result.fee,
      zone: result.zone,
      zoneNumber: result.zoneNumber,
      freeDelivery: isFreeDelivery,
      freeDeliveryThreshold: FREE_DELIVERY_THRESHOLD,
    });
  } catch (err) {
    res.status(500).json({ error: "Failed to calculate delivery fee" });
  }
});



/* ===========================
   POD ELIGIBILITY & DEPOSIT
=========================== */

// Check if customer is eligible for POD
app.get("/api/orders/pod-eligibility", auth, async (req, res) => {
  try {
    const completedOrders = await Order.countDocuments({
      email: req.user.email,
      status: { $in: ["Paid", "Delivered", "Shipped"] }
    });
    res.json({ eligible: completedOrders > 0, completedOrders });
  } catch (err) {
    res.status(500).json({ error: "Failed to check eligibility" });
  }
});

// Initialize Paystack payment for delivery deposit
app.post("/api/orders/pod-deposit", auth, async (req, res) => {
  try {
    const { deliveryFee, deliveryZone, cart, deliveryAddress, phone, couponCode, walletDebit } = req.body;
    const { email } = req.user;

    if (!deliveryFee || deliveryFee <= 0) {
      return res.status(400).json({ error: "Please enter your delivery address first to calculate delivery fee" });
    }

    // Check eligibility
    const completedOrders = await Order.countDocuments({
      email,
      status: { $in: ["Paid", "Delivered", "Shipped"] }
    });
    if (completedOrders === 0) {
      return res.status(403).json({ error: "Pay on Delivery is only available for returning customers" });
    }

    const reference = "POD-DEP-" + Date.now();

    // Store pending POD order data in a temp reference
    const response = await axios.post(
      "https://api.paystack.co/transaction/initialize",
      {
        email,
        amount: deliveryFee * 100,
        reference,
        callback_url: `${process.env.FRONTEND_URL}/success?pod=true&reference=${reference}`,
        metadata: {
          isPodDeposit: true,
          cart: JSON.stringify(cart),
          deliveryAddress,
          phone,
          couponCode: couponCode || "",
          walletDebit: walletDebit || 0,
          deliveryFee,
          deliveryZone: deliveryZone || "",
        }
      },
      { headers: { Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY}` } }
    );

    res.json({ url: response.data.data.authorization_url, reference });
  } catch (err) {
    console.error("POD deposit error:", err.message);
    res.status(500).json({ error: "Failed to initialize deposit payment" });
  }
});


// Send Paystack payment link for POD order (admin)
app.post("/api/admin/orders/:id/send-payment-link", adminOnly, async (req, res) => {
  try {
    const order = await Order.findById(req.params.id);
    if (!order) return res.status(404).json({ error: "Order not found" });
    if (order.status !== "Pay on Delivery") return res.status(400).json({ error: "Order is not a POD order" });

    const reference = "POD-PAY-" + Date.now();
    const response = await axios.post(
      "https://api.paystack.co/transaction/initialize",
      {
        email: order.email,
        amount: order.amount * 100,
        reference,
        callback_url: `${process.env.FRONTEND_URL}/success?reference=${reference}`,
        metadata: { orderId: order._id.toString(), isPodPayment: true }
      },
      { headers: { Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY}` } }
    );

    const paymentUrl = response.data.data.authorization_url;

    // Update order with payment reference
    await Order.findByIdAndUpdate(req.params.id, { podPaymentReference: reference });

    res.json({ success: true, paymentUrl, reference });
  } catch (err) {
    console.error("Send payment link error:", err.message);
    res.status(500).json({ error: "Failed to generate payment link" });
  }
});

/* ===========================
   PAY ON DELIVERY
=========================== */
app.post("/api/orders/pay-on-delivery", auth, async (req, res) => {
  try {
    const { cart, deliveryAddress, phone, couponCode, walletDebit, deliveryFee, deliveryZone } = req.body;
    const { email } = req.user;

    if (!cart || cart.length === 0) return res.status(400).json({ error: "Cart is empty" });
    if (!deliveryAddress) return res.status(400).json({ error: "Delivery address is required" });
    if (!phone) return res.status(400).json({ error: "Phone number is required" });

    let amount = cart.reduce((sum, item) => sum + (item.price * (item.quantity || 1)), 0);
    let appliedCoupon = null;

    if (couponCode) {
      const coupon = await Coupon.findOne({ code: couponCode.toUpperCase(), active: true });
      if (coupon && (!coupon.expiresAt || new Date() <= coupon.expiresAt) && amount >= coupon.minOrder) {
        const discount = coupon.type === "percent"
          ? Math.round((coupon.value / 100) * amount)
          : Math.min(coupon.value, amount);
        amount = amount - discount;
        appliedCoupon = couponCode.toUpperCase();
      }
    }

    let appliedWalletDebit = 0;
    if (walletDebit && walletDebit > 0) {
      const buyer = await User.findOne({ email });
      if (buyer && buyer.walletBalance >= walletDebit) {
        appliedWalletDebit = Math.min(walletDebit, amount);
        amount = Math.max(0, amount - appliedWalletDebit);
        await User.findOneAndUpdate({ email }, {
          $inc: { walletBalance: -appliedWalletDebit },
          $push: { walletTransactions: { type: "debit", amount: appliedWalletDebit, description: "Wallet payment for POD order", reference: "POD-" + Date.now() } }
        });
      }
    }

    const totalWithDelivery = amount + (deliveryFee || 0);
    const allocatedItems = [];
    for (const item of cart) {
      const updatedProduct = await Product.findOneAndUpdate(
        { _id: item._id || item.productId, stock: { $gte: item.quantity || 1 } },
        { $inc: { stock: -(item.quantity || 1) } },
        { new: true }
      );
      if (!updatedProduct) {
        for (const r of allocatedItems) {
          await Product.findByIdAndUpdate(r.productId, { $inc: { stock: r.quantity } });
        }
        return res.status(400).json({ error: `"${item.name}" is out of stock` });
      }
      allocatedItems.push({ productId: item._id || item.productId, quantity: item.quantity || 1 });
      if (updatedProduct.stock <= 5) sendLowStockAlert(updatedProduct).catch(() => {});
    }

    const reference = "POD-" + Date.now();
    const order = await Order.create({
      email, items: cart, amount: totalWithDelivery, originalAmount: totalWithDelivery,
      couponCode: appliedCoupon, walletDebit: appliedWalletDebit,
      deliveryFee: deliveryFee || 0, deliveryZone: deliveryZone || "",
      reference, status: "Pay on Delivery", deliveryAddress, phone,
      paymentMethod: "Pay on Delivery",
    });

    try { await sendOrderConfirmation(order); } catch (e) {}
    try { await sendAdminOrderNotification(order); } catch (e) {}

    try {
      const buyer = await User.findOne({ email });
      if (buyer) {
        const cashback = Math.round((CASHBACK_PERCENT / 100) * totalWithDelivery);
        if (cashback > 0) {
          buyer.walletBalance = (buyer.walletBalance || 0) + cashback;
          buyer.walletTransactions.push({ type: "credit", amount: cashback, description: `${CASHBACK_PERCENT}% cashback on POD order ${reference}`, reference });
          await buyer.save();
        }
      }
    } catch (e) {}

    res.status(201).json({ success: true, reference, message: "Order placed! Pay cash when your item arrives." });
  } catch (err) {
    res.status(500).json({ error: "Failed to place order" });
  }
});

/* ===========================
   WALLET ENDPOINTS
=========================== */

// Get wallet balance and transactions
app.get("/api/wallet", auth, async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select("walletBalance walletTransactions name email");
    res.json({ balance: user.walletBalance || 0, transactions: user.walletTransactions || [] });
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch wallet" });
  }
});

// Apply wallet balance at checkout (validate how much to use)
app.post("/api/wallet/apply", auth, async (req, res) => {
  try {
    const { amount } = req.body;
    const user = await User.findById(req.user.id);
    const available = user.walletBalance || 0;
    const toUse = Math.min(amount, available);
    res.json({ success: true, walletDebit: toUse, remaining: available - toUse });
  } catch (err) {
    res.status(500).json({ error: "Failed to apply wallet" });
  }
});

// Admin - get all wallets
app.get("/api/admin/wallets", adminOnly, async (req, res) => {
  try {
    const users = await User.find({ walletBalance: { $gt: 0 } }).select("name email walletBalance walletTransactions").sort({ walletBalance: -1 });
    const totalInCirculation = users.reduce((sum, u) => sum + (u.walletBalance || 0), 0);
    res.json({ users, totalInCirculation });
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch wallets" });
  }
});

// Admin - manually credit/debit wallet
app.post("/api/admin/wallets/:userId", adminOnly, async (req, res) => {
  try {
    const { type, amount, description } = req.body;
    const user = await User.findById(req.params.userId);
    if (!user) return res.status(404).json({ error: "User not found" });
    if (type === "credit") {
      user.walletBalance = (user.walletBalance || 0) + Number(amount);
    } else {
      user.walletBalance = Math.max(0, (user.walletBalance || 0) - Number(amount));
    }
    user.walletTransactions.push({ type, amount: Number(amount), description: description || "Admin adjustment", reference: "ADMIN-" + Date.now() });
    await user.save();
    res.json({ success: true, newBalance: user.walletBalance });
  } catch (err) {
    res.status(500).json({ error: "Failed to update wallet" });
  }
});

/* ===========================
   SELLER ENDPOINTS
=========================== */

// Seller application
app.post("/api/seller/apply", async (req, res) => {
  try {
    const { name, password, phone, storeName, storeDescription } = req.body;
    const email = req.body.email ? String(req.body.email).toLowerCase().trim() : req.body.email;
    if (!name || !email || !password || !storeName) {
      return res.status(400).json({ error: "Name, email, password and store name are required" });
    }
    const existing = await Seller.findOne({ email });
    if (existing) return res.status(400).json({ error: "A seller account with this email already exists" });
    const hashedPassword = await bcrypt.hash(password, 10);
    if (!isStrongPassword(password)) {
      return res.status(400).json({
        error:"Password must be 8+ characters with uppercase, lowercase, number and special character."
      });
    }

    const seller = await Seller.create({ name, email, password: hashedPassword, phone, storeName, storeDescription });
    res.status(201).json({ success: true, message: "Application submitted! We will review and get back to you shortly." });
  } catch (err) {
    res.status(500).json({ error: "Failed to submit application" });
  }
});

// Seller login
app.post("/api/seller/login", async (req, res) => {
  try {
    const { password } = req.body;
    const email = req.body.email ? String(req.body.email).toLowerCase().trim() : req.body.email;
    const seller = await Seller.findOne({ email });
    if (!seller) return res.status(400).json({ error: "Seller account not found" });
    const match = await bcrypt.compare(password, seller.password);
    if (!match) return res.status(400).json({ error: "Invalid password" });
    if (seller.status === "pending") return res.status(403).json({ error: "Your application is still under review" });
    if (seller.status === "rejected") return res.status(403).json({ error: "Your application was not approved" });
    const token = jwt.sign({ id: seller._id, role: "seller", storeName: seller.storeName }, process.env.JWT_SECRET, { expiresIn: "7d" });
    res.json({ success: true, token, seller: { id: seller._id, name: seller.name, email: seller.email, storeName: seller.storeName, commission: seller.commission } });
  } catch (err) {
    res.status(500).json({ error: "Login failed" });
  }
});

/* ===========================
   SELLER PASSWORD RESET
=========================== */

app.post("/api/seller/forgot-password", async (req,res)=>{
  try{

    const {email}=req.body;

    if(!email)
      return res.status(400).json({error:"Email is required"});

    const seller=await Seller.findOne({email});

    if(!seller){
      return res.json({
        success:true,
        message:"If that seller account exists, a reset code has been sent."
      });
    }

    const token=Math.floor(
      100000+Math.random()*900000
    ).toString();

    seller.resetPasswordToken=token;
    seller.resetPasswordExpires=Date.now()+3600000;

    await seller.save();

    console.log(
      `🔑 Seller Reset Token for ${seller.email}: ${token}`
    );

    try{
      if(typeof sendPasswordResetEmail==="function"){
        await sendPasswordResetEmail(
          seller.email,
          token
        );
      }
    }catch(e){
      console.error(e.message);
    }

    res.json({
      success:true,
      message:"If that seller account exists, a reset code has been sent."
    });

  }catch(err){
    console.error(err);
    res.status(500).json({
      error:"Seller password reset failed"
    });
  }
});

app.post("/api/seller/reset-password", async (req,res)=>{

  try{

    const {token,newPassword}=req.body;

    if(!token||!newPassword){
      return res.status(400).json({
        error:"Token and password required"
      });
    }

    if (!isStrongPassword(newPassword)) {
      return res.status(400).json({
        error:"Password must be 8+ characters with uppercase, lowercase, number and special character."
      });
    }

    const seller=await Seller.findOne({
      resetPasswordToken:token.trim(),
      resetPasswordExpires:{
        $gt:Date.now()
      }
    });

    if(!seller){
      return res.status(400).json({
        error:"Invalid or expired reset code"
      });
    }

    seller.password=await bcrypt.hash(newPassword,10);

    seller.resetPasswordToken=undefined;
    seller.resetPasswordExpires=undefined;

    await seller.save();

    res.json({
      success:true,
      message:"Seller password updated successfully."
    });

  }catch(err){

    console.error(err);

    res.status(500).json({
      error:"Password reset failed"
    });

  }

});



// Seller middleware
function sellerAuth(req, res, next) {
  const token = req.headers.authorization?.split(" ")[1];
  if (!token) return res.status(401).json({ error: "No token" });
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    if (decoded.role !== "seller") return res.status(403).json({ error: "Seller access only" });
    req.seller = decoded;
    next();
  } catch {
    res.status(401).json({ error: "Invalid token" });
  }
};

// Get seller dashboard stats
app.get("/api/seller/dashboard", sellerAuth, async (req, res) => {
  try {
    const seller = await Seller.findById(req.seller.id).select("-password");
    const products = await Product.find({ vendorId: req.seller.id });
    const orders = await Order.find({ "items.vendorId": req.seller.id, status: { $in: ["Paid", "Shipped", "Delivered"] } });
    const revenue = orders.reduce((sum, o) => {
      const sellerItems = o.items.filter(i => i.vendorId === req.seller.id.toString());
      return sum + sellerItems.reduce((s, i) => s + (i.price * (i.quantity || 1)), 0);
    }, 0);
    res.json({ seller, products, totalProducts: products.length, totalOrders: orders.length, revenue });
  } catch (err) {
    res.status(500).json({ error: "Failed to load dashboard" });
  }
});

// Seller add product
app.post("/api/seller/products", sellerAuth, adminUploader.array("images", 5), async (req, res) => {
  try {
    let imageUrls = [];

    if (req.body.images) {
      if (Array.isArray(req.body.images)) {
        imageUrls = req.body.images;
      } else {
        try {
          imageUrls = JSON.parse(req.body.images);
        } catch {
          imageUrls = [req.body.images];
        }
      }
    }

    if (req.files && req.files.length > 0) {
      for (const file of req.files) {
        if (file.path && file.path.startsWith("http")) {
          imageUrls.push(file.path);
        } else {
          const result = await cloudinaryCloud.uploader.upload(file.path, {
            folder: "techmart_products",
            transformation: [
              { width: 800, height: 800, crop: "limit" },
              { quality: "auto" }
            ]
          });
          imageUrls.push(result.secure_url);
        }
      }
    }

    const product = await Product.create({
      name: req.body.name,
      price: Number(req.body.price),
      description: req.body.description,
      stock: Number(req.body.stock),
      category: req.body.category || "",
      images: imageUrls,
      vendorId: req.seller.id,
      vendorName: req.seller.storeName,
    });

    res.status(201).json({
      success: true,
      message: "Product created successfully",
      data: product
    });

  } catch (err) {
    console.error("Seller product create:", err);
    res.status(500).json({
      success: false,
      error: "Failed to add product"
    });
  }
});

// Seller update product
app.put("/api/seller/products/:id", sellerAuth, adminUploader.array("images", 5), async (req, res) => {
  try {
    const product = await Product.findOne({ _id: req.params.id, vendorId: req.seller.id });
    if (!product) return res.status(404).json({ error: "Product not found" });

    const updates = {
      name: req.body.name || product.name,
      price: req.body.price ? Number(req.body.price) : product.price,
      description: req.body.description || product.description,
      stock: req.body.stock !== undefined ? Number(req.body.stock) : product.stock,
      category: req.body.category || product.category,
    };

    // Upload new images if provided
    if (req.files && req.files.length > 0) {
      const imageUrls = [];
      for (const file of req.files) {
        const result = await cloudinaryCloud.uploader.upload(file.path, {
          folder: "techmart_products",
          transformation: [{ width: 800, height: 800, crop: "limit" }, { quality: "auto" }]
        });
        imageUrls.push(result.secure_url);
      }
      updates.images = imageUrls;
    }

    // Keep existing images if new ones sent as JSON string
    if (req.body.existingImages) {
      try {
        const existing = JSON.parse(req.body.existingImages);
        updates.images = updates.images ? [...existing, ...updates.images] : existing;
      } catch {}
    }

    const updated = await Product.findByIdAndUpdate(req.params.id, updates, { new: true });
    res.json({ success: true, data: updated });
  } catch (err) {
    console.error("Product update error:", err.message);
    res.status(500).json({ error: "Failed to update product" });
  }
});

// Seller get their products
app.get("/api/seller/products", sellerAuth, async (req, res) => {
  try {
    const products = await Product.find({ vendorId: req.seller.id });
    res.json(products);
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch products" });
  }
});

// Seller delete product
app.delete("/api/seller/products/:id", sellerAuth, async (req, res) => {
  try {
    const product = await Product.findOne({ _id: req.params.id, vendorId: req.seller.id });
    if (!product) return res.status(404).json({ error: "Product not found" });
    await Product.findByIdAndDelete(req.params.id);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: "Failed to delete product" });
  }
});

// Admin - get all sellers
app.get("/api/admin/sellers", adminOnly, async (req, res) => {
  try {
    const sellers = await Seller.find().select("-password").sort({ createdAt: -1 });
    res.json(sellers);
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch sellers" });
  }
});

// Admin - approve/reject seller
app.put("/api/admin/sellers/:id", adminOnly, async (req, res) => {
  try {
    const { status } = req.body;
    const seller = await Seller.findByIdAndUpdate(req.params.id, { status }, { new: true }).select("-password");
    res.json({ success: true, data: seller });
  } catch (err) {
    res.status(500).json({ error: "Failed to update seller" });
  }
});

// Admin - delete seller
app.delete("/api/admin/sellers/:id", adminOnly, async (req, res) => {
  try {
    await Seller.findByIdAndDelete(req.params.id);
    await Product.deleteMany({ vendorId: req.params.id });
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: "Failed to delete seller" });
  }
});

app.post("/api/paystack/init", async (req, res) => {
  try {
    const { email, amount, cart, deliveryAddress, phone, couponCode, walletDebit, deliveryFee, deliveryZone } = req.body;
    if (!email || !amount || !cart || cart.length === 0) {
      return res.status(400).json({ error: "Missing checkout payload information" });
    }
    // Apply coupon discount if provided
    let finalAmount = amount;
    let appliedCoupon = null;
    let appliedWalletDebit = 0;
    if (couponCode) {
      const coupon = await Coupon.findOne({ code: couponCode.toUpperCase(), active: true });
      if (coupon && (!coupon.expiresAt || new Date() <= coupon.expiresAt) && amount >= coupon.minOrder) {
        const discount = coupon.type === "percent"
          ? Math.round((coupon.value / 100) * amount)
          : Math.min(coupon.value, amount);
        finalAmount = amount - discount;
        appliedCoupon = couponCode.toUpperCase();
      }
    }
    // Apply wallet debit
    if (walletDebit && walletDebit > 0) {
      const buyer = await User.findOne({ email });
      if (buyer && buyer.walletBalance >= walletDebit) {
        appliedWalletDebit = Math.min(walletDebit, finalAmount);
        finalAmount = Math.max(0, finalAmount - appliedWalletDebit);
      }
    }

    const reference = "TX-" + Date.now();
    const allocatedItems = [];

    // ⚡ RUN ATOMIC CHECK & DECREMENT LOOP FOR ALL CART ITEMS
    try {
      for (const item of cart) {
        // Find item and decrement stock ONLY if existing stock is >= requested qty
        const updatedProduct = await Product.findOneAndUpdate(
          {
            _id: item._id || item.productId,
            stock: { $gte: item.quantity || 1 }
          },
          {
            $inc: { stock: -(item.quantity || 1) }
          },
          { new: true }
        );

        // If update yields null, it means stock is insufficient
        if (!updatedProduct) {
          throw new Error(`Item "${item.name || 'Product'}" is out of stock or unavailable.`);
        }

        // Log local tracking array to roll back changes if an upcoming item checks out failing
        allocatedItems.push({
          productId: item._id || item.productId,
          quantity: item.quantity || 1
        });
        // Send low stock alert if stock drops to 5 or below
        if (updatedProduct.stock <= 5) {
          sendLowStockAlert(updatedProduct).catch(err => console.error("Low stock alert failed:", err.message));
        }
      }
    } catch (stockError) {
      // 🔄 ROLLBACK COMPLETED DECREMENTS IF THE TRANSACTION CALL ABORTS MID-LOOP
      for (const rollbackItem of allocatedItems) {
        await Product.findByIdAndUpdate(rollbackItem.productId, {
          $inc: { stock: rollbackItem.quantity }
        });
      }
      return res.status(400).json({ error: stockError.message });
    }

    // Create pending database record since items are locked down securely
    // Deduct wallet if used
    if (appliedWalletDebit > 0) {
      await User.findOneAndUpdate({ email }, {
        $inc: { walletBalance: -appliedWalletDebit },
        $push: { walletTransactions: { type: "debit", amount: appliedWalletDebit, description: `Wallet payment for order ${reference}`, reference } }
      });
    }
    await Order.create({ email, items: cart, amount: finalAmount, originalAmount: amount, couponCode: appliedCoupon, walletDebit: appliedWalletDebit, deliveryFee: deliveryFee || 0, deliveryZone: deliveryZone || "", reference, status: "Pending", deliveryAddress: deliveryAddress || "", phone: phone || "" });

    const response = await axios.post(
      "https://api.paystack.co/transaction/initialize",
      {
        email,
        amount: finalAmount * 100,
        reference,
        callback_url: `${process.env.FRONTEND_URL}/success`
      },
      {
        headers: {
          Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY}`,
          "Content-Type": "application/json"
        }
      }
    );
    res.json({ url: response.data.data.authorization_url });
  } catch (err) {
    console.error("PAYSTACK ERROR:", err.response?.data || err.message);
    res.status(500).json({ error: "Payment routing setup failed" });
  }
});

/* 2. SECURE & IDEMPOTENT WEBHOOK RECEIVER */
app.post("/api/paystack/webhook", express.raw({ type: "application/json" }), async (req, res) => {
  try {
    // 1. VERIFY SIGNATURE
    const crypto = require("crypto");
    const hash = crypto
      .createHmac("sha512", process.env.PAYSTACK_SECRET_KEY)
      .update(req.body)
      .digest("hex");

    if (hash !== req.headers["x-paystack-signature"]) {
      console.log("❌ Invalid webhook signature");
      return res.status(401).send("Invalid signature");
    }

    const event = JSON.parse(req.body.toString("utf8"));

    console.log("📩 Paystack webhook:", {
      event: event.event,
      reference: event.data?.reference
    });

    if (!event || event.event !== "charge.success") {
      return res.status(200).send("Event ignored");
    }

    const reference = event.data.reference;

    // 2. VERIFY WITH PAYSTACK API
    const verify = await axios.get(
      `https://api.paystack.co/transaction/verify/${reference}`,
      {
        headers: {
          Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY}`
        }
      }
    );

    const paymentData = verify.data.data;

    // Handle Wallet Funding
    if (paymentData.metadata?.purpose === "wallet_funding") {
      try {
        const amount = paymentData.amount / 100;
        const reference = paymentData.reference;

        const email = paymentData.customer?.email
          ?.toLowerCase()
          .trim();

        let user = null;

        if (paymentData.metadata?.userId) {
          user = await User.findById(paymentData.metadata.userId);
        }

        if (!user && email) {
          user = await User.findOne({ email });
        }

        if (!user) {
          console.error(
            "❌ Wallet webhook: user not found",
            { reference, email }
          );
          return res.status(200).json({ status: "ignored" });
        }

        user.walletTransactions = user.walletTransactions || [];

        const alreadyCredited = user.walletTransactions.some(
          t => t.reference === reference
        );

        if (alreadyCredited) {
          console.log("ℹ️ Wallet already credited:", reference);
          return res.status(200).json({ status: "duplicate" });
        }

        user.walletBalance =
          (user.walletBalance || 0) + amount;

        user.walletTransactions.push({
          type: "credit",
          amount,
          description: "Wallet funded via Paystack",
          reference,
          createdAt: new Date(paymentData.paid_at)
        });

        await user.save();

        console.log(
          `✅ Wallet credited: ${user.email} +₦${amount}`
        );
      } catch (e) {
        console.error("Wallet funding webhook error:", e);
      }

      return res.status(200).json({ status: "success" });
    }

    // Handle POD full payment (sent by admin at door)
    if (paymentData.metadata?.isPodPayment) {
      try {
        const orderId = paymentData.metadata.orderId;
        const order = await Order.findByIdAndUpdate(orderId, { status: "Paid" }, { new: true });
        if (order) {
          // Credit cashback
          const buyer = await User.findOne({ email: order.email });
          if (buyer) {
            const cashback = Math.round((CASHBACK_PERCENT / 100) * order.amount);
            if (cashback > 0) {
              buyer.walletBalance = (buyer.walletBalance || 0) + cashback;
              buyer.walletTransactions.push({ type: "credit", amount: cashback, description: `Cashback on POD payment ${order.reference}`, reference: paymentData.reference });
              await buyer.save();
            }
          }
          console.log(`POD order ${orderId} marked as Paid`);
        }
      } catch(e) {
        console.error("POD payment webhook error:", e.message);
      }
      return res.status(200).json({ status: "success" });
    }

    // Handle POD deposit payment
    if (paymentData.metadata?.isPodDeposit) {
      try {
        const meta = paymentData.metadata;
        const cart = JSON.parse(meta.cart || "[]");
        const reference = "POD-" + Date.now();
        const amount = cart.reduce((sum, item) => sum + (item.price * (item.quantity || 1)), 0);

        // Create the full POD order
        const order = await Order.create({
          email: paymentData.customer.email,
          items: cart,
          amount: amount + Number(meta.deliveryFee || 0),
          originalAmount: amount + Number(meta.deliveryFee || 0),
          deliveryFee: Number(meta.deliveryFee || 0),
          deliveryZone: meta.deliveryZone || "",
          depositPaid: Number(meta.deliveryFee || 0),
          depositReference: paymentData.reference,
          reference,
          status: "Pay on Delivery",
          deliveryAddress: meta.deliveryAddress,
          phone: meta.phone,
          paymentMethod: "Pay on Delivery",
          couponCode: meta.couponCode || null,
        });

        try { await sendOrderConfirmation(order); } catch(e) {}
        try { await sendAdminOrderNotification(order); } catch(e) {}

        // Cashback
        const buyer = await User.findOne({ email: paymentData.customer.email });
        if (buyer) {
          const cashback = Math.round((CASHBACK_PERCENT / 100) * order.amount);
          if (cashback > 0) {
            buyer.walletBalance = (buyer.walletBalance || 0) + cashback;
            buyer.walletTransactions.push({ type: "credit", amount: cashback, description: `Cashback on POD order ${reference}`, reference });
            await buyer.save();
          }
        }
      } catch(e) {
        console.error("POD deposit webhook error:", e.message);
      }
      return res.status(200).json({ status: "success" });
    }

    if (paymentData.status !== "success") {
      console.log(`⚠️ Payment not successful for ${reference}: ${paymentData.status}`);
      return res.status(200).send("Payment not verified");
    }

    console.log(`✅ Payment verified for ${reference}`);

    // 3. UPDATE ORDER ONLY IF PENDING
    const order = await Order.findOneAndUpdate(
      { reference, status: "Pending" },
      { status: "Paid" },
      { new: true }
    );

    if (!order) {
      console.log(`ℹ️ Order ${reference} already processed or not found`);
      return res.status(200).send("Already processed");
    }

    console.log(`✅ Order ${order._id} marked as Paid`);

    // PAYMENT DEBUG
    console.log("========== PAYMENT DEBUG ==========");
    console.log("Reference:", reference);
    console.log("Paystack Status:", paymentData.status);
    console.log("Order Status Before Update:", order?.status);
    console.log("Order Email:", order?.email);
    console.log("==================================");
    
    // 4. SEND CONFIRMATION EMAIL
    try {
      await sendOrderConfirmation(order);
      console.log(`📧 Confirmation email sent to ${order.email}`);
    } catch (e) {
      console.error("❌ Email failed:", e.message);
    }
    // 5. NOTIFY ADMIN
    try {
      await sendAdminOrderNotification(order);
    } catch (e) {
      console.error("❌ Admin notification failed:", e.message);
    }
    // 6. CREDIT CASHBACK TO WALLET
    try {
      const buyer = await User.findOne({ email: order.email });
      if (buyer) {
        const cashback = Math.round((CASHBACK_PERCENT / 100) * order.amount);
        if (cashback > 0) {
          buyer.walletBalance = (buyer.walletBalance || 0) + cashback;
          buyer.walletTransactions.push({
            type: "credit",
            amount: cashback,
            description: `${CASHBACK_PERCENT}% cashback on order ${order.reference}`,
            reference: order.reference
          });
          await buyer.save();
          console.log(`Wallet: Credited N${cashback} cashback to ${buyer.email}`);
        }
      }
    } catch (e) {
      console.error("Cashback credit failed:", e.message);
    }

    // 5. NOTIFY FRONTEND
    if (io) {
      io.to(order.email).emit("paymentConfirmed", { reference, email: order.email });
    }

    return res.status(200).json({ status: "success" });

  } catch (err) {
    console.error("❌ Webhook error:", err.message);
    return res.status(500).send("Webhook error");
  }
});

/* ===========================
   👑 ADMIN
=========================== */
app.get("/api/admin/stats", adminOnly, async (req, res) => {
  try {
    const orders = await Order.find();
    const users = await User.find();
    const revenue = orders
      .filter((o) => o.status !== "Cancelled" && o.status !== "Pending")
      .reduce((sum, o) => sum + (o.amount || 0), 0);
    res.json({ totalOrders: orders.length, totalUsers: users.length, totalRevenue: revenue });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to fetch stats" });
  }
});

app.get("/api/admin/orders", adminOnly, async (req, res) => {
  try {
    const orders = await Order.find().sort({ createdAt: -1 });
    res.json(orders);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to fetch orders" });
  }
});

/* UPDATE ORDER STATUS */
app.put("/api/admin/orders/:id", adminOnly, async (req, res) => {
  try {
    const order = await Order.findByIdAndUpdate(
      req.params.id,
      { status: req.body.status },
      { new: true }
    );

    // 📱 SEND ORDER STATUS SMS
    if (order && order.email) {
      try {
        const buyer = await User.findOne({ email: order.email });

        if (buyer && buyer.phone) {
          const { sendOrderUpdate } = require("./services/notificationService");

          await sendOrderUpdate(
            buyer.phone,
            buyer.name || "Customer",
            order._id.toString(),
            req.body.status
          );
        } else {
          console.log("⚠️ SMS skipped: Buyer phone not found for " + order.email);
        }
      } catch (smsError) {
        console.error("❌ SMS notification error:", smsError.message);
      }
    }

    // 📧 SEND ORDER STATUS EMAIL
    try {
      await sendShippingUpdate(order);
    } catch (e) {
      console.log("Order status email failed:", e.message);
    }

    res.json(order);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to update order" });
  }
});

app.get("/api/admin/users", adminOnly, async (req, res) => {
  try {
    const users = await User.find().select("-password").sort({ createdAt: -1 });
    res.json(users);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to fetch users" });
  }
});

app.get("/api/admin/analytics", adminOnly, async (req, res) => {
  try {
    const orders = await Order.find().sort({ createdAt: -1 });
    const users = await User.find();
    const revenue = orders
      .filter((o) => o.status !== "Cancelled" && o.status !== "Pending")
      .reduce((sum, o) => sum + (o.amount || 0), 0);
    const revenueByDate = {};
    orders
      .filter((o) => o.status !== "Cancelled" && o.status !== "Pending")
      .forEach((o) => {
        const date = new Date(o.createdAt).toLocaleDateString("en-NG");
        revenueByDate[date] = (revenueByDate[date] || 0) + (o.amount || 0);
      });
    res.json({
      totalOrders: orders.length,
      totalUsers: users.length,
      totalRevenue: revenue,
      revenueByDate,
      recentOrders: orders.slice(0, 5),
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to fetch analytics" });
  }
});

/* ===========================
   ⭐ REVIEWS
=========================== */

/* ADD REVIEW - verified buyers only */
app.post("/api/products/:id/review", auth, async (req, res) => {
  try {
    const { stars } = req.body;
    const comment = sanitize(req.body.comment);
    if (!comment || !stars) return res.status(400).json({ error: "Comment and stars required" });

    const product = await Product.findById(req.params.id);
    if (!product) return res.status(404).json({ error: "Product not found" });

    const order = await Order.findOne({
      email: req.user.email,
      status: { $in: ["Paid", "Shipped", "Delivered"] },
    });
    const isVerified = !!order;

    const alreadyReviewed = product.reviews.find((r) => r.email === req.user.email);
    if (alreadyReviewed) return res.status(400).json({ error: "You already reviewed this product" });

    let sentiment = "neutral";
    try {
      const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });
      const sentimentRes = await groq.chat.completions.create({
        model: "llama-3.3-70b-versatile",
        messages: [
          {
            role: "system",
            content: `Analyze the sentiment of this product review and respond with ONLY one word: "positive", "negative", or "neutral". Nothing else.`
          },
          { role: "user", content: comment }
        ],
        max_tokens: 10,
        temperature: 0,
      });
      const raw = sentimentRes.choices[0]?.message?.content?.trim().toLowerCase();
      if (["positive", "negative", "neutral"].includes(raw)) sentiment = raw;
    } catch (err) {
      console.log("Sentiment analysis failed:", err.message);
    }

    const review = {
      user: req.user.email.split("@")[0],
      email: req.user.email,
      comment,
      stars: Number(stars),
      verified: isVerified,
      approved: false,
      flagged: false,
      sentiment,
      createdAt: new Date(),
    };

    product.reviews.push(review);

    const approvedReviews = product.reviews.filter((r) => r.approved);
    if (approvedReviews.length > 0) {
      product.rating = (
        approvedReviews.reduce((sum, r) => sum + r.stars, 0) / approvedReviews.length
      ).toFixed(1);
    }

    await product.save();
    res.json({ success: true, message: "Review submitted and pending approval" });

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to submit review" });
  }
});

/* GET PENDING REVIEWS - admin */
app.get("/api/admin/reviews/pending", adminOnly, async (req, res) => {
  try {
    const products = await Product.find({ "reviews.approved": false });
    const pending = [];
    products.forEach((p) => {
      p.reviews
        .filter((r) => !r.approved && !r.flagged)
        .forEach((r) => {
          pending.push({ ...r.toObject(), productId: p._id, productName: p.name });
        });
    });
    res.json(pending);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to fetch pending reviews" });
  }
});

/* GET FLAGGED REVIEWS - admin */
app.get("/api/admin/reviews/flagged", adminOnly, async (req, res) => {
  try {
    const products = await Product.find({ "reviews.flagged": true });
    const flagged = [];
    products.forEach((p) => {
      p.reviews
        .filter((r) => r.flagged)
        .forEach((r) => {
          flagged.push({ ...r.toObject(), productId: p._id, productName: p.name });
        });
    });
    res.json(flagged);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to fetch flagged reviews" });
  }
});

/* APPROVE REVIEW - admin */
app.put("/api/products/:id/review/:reviewId/approve", adminOnly, async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    const review = product.reviews.id(req.params.reviewId);
    if (!review) return res.status(404).json({ error: "Review not found" });
    review.approved = true;
    review.flagged = false;
    const approvedReviews = product.reviews.filter((r) => r.approved);
    if (approvedReviews.length > 0) {
      product.rating = (
        approvedReviews.reduce((sum, r) => sum + r.stars, 0) / approvedReviews.length
      ).toFixed(1);
    }
    await product.save();
    res.json({ success: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to approve review" });
  }
});

/* FLAG REVIEW */
app.put("/api/products/:id/review/:reviewId/flag", auth, async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    const review = product.reviews.id(req.params.reviewId);
    if (!review) return res.status(404).json({ error: "Review not found" });
    review.flagged = true;
    review.approved = false;
    await product.save();
    res.json({ success: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to flag review" });
  }
});

/* DELETE REVIEW - admin */
app.delete("/api/products/:id/review/:reviewId", adminOnly, async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    product.reviews = product.reviews.filter(
      (r) => r._id.toString() !== req.params.reviewId
    );
    await product.save();
    res.json({ success: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to delete review" });
  }
});

/* GET SENTIMENT ANALYTICS - admin */
app.get("/api/admin/reviews/sentiment", adminOnly, async (req, res) => {
  try {
    const products = await Product.find();
    const stats = { positive: 0, negative: 0, neutral: 0, total: 0 };
    const productSentiments = [];

    products.forEach((p) => {
      const approved = p.reviews.filter((r) => r.approved);
      const pos = approved.filter((r) => r.sentiment === "positive").length;
      const neg = approved.filter((r) => r.sentiment === "negative").length;
      const neu = approved.filter((r) => r.sentiment === "neutral").length;

      stats.positive += pos;
      stats.negative += neg;
      stats.neutral += neu;
      stats.total += approved.length;

      if (approved.length > 0) {
        productSentiments.push({
          name: p.name,
          positive: pos,
          negative: neg,
          neutral: neu,
          total: approved.length,
          score: ((pos - neg) / approved.length * 100).toFixed(0),
        });
      }
    });

    productSentiments.sort((a, b) => b.score - a.score);
    res.json({ stats, productSentiments });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to fetch sentiment data" });
  }
});

/* ===========================
   📦 TRACKING
=========================== */
app.get("/api/orders/track/:reference", async (req, res) => {
  try {
    const order = await Order.findOne({ reference: req.params.reference });
    if (!order) return res.status(404).json({ error: "Order not found" });
    res.json(order);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to track order" });
  }
});

app.get("/api/orders/my", auth, async (req, res) => {
  try {
    const orders = await Order.find({ email: req.user.email }).sort({ createdAt: -1 });
    res.json(orders);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to fetch orders" });
  }
});

app.put("/api/orders/:id/tracking", adminOnly, async (req, res) => {
  try {
    const { trackingNumber, status } = req.body;
    const order = await Order.findByIdAndUpdate(
      req.params.id,
      { trackingNumber, status },
      { new: true }
    );
    io.to(order.email).emit("orderUpdated", {
      orderId: order._id,
      reference: order.reference,
      status: order.status,
      trackingNumber: order.trackingNumber
    });
    res.json(order);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to update tracking" });
  }
});
/* ===========================
   🖼️ IMAGE UPLOAD
=========================== */
app.post("/api/upload", adminOnly, upload.single("image"), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ error: "No image provided" });

    // Upload to Cloudinary
    const result = await new Promise((resolve, reject) => {
      cloudinary.uploader.upload_stream(
        {
          folder: "techmart/products",
          transformation: [
            { width: 800, height: 800, crop: "limit" },
            { quality: "auto" },
            { fetch_format: "auto" }
          ]
        },
        (error, result) => {
          if (error) reject(error);
          else resolve(result);
        }
      ).end(req.file.buffer);
    });

    res.json({
      success: true,
      url: result.secure_url,
      public_id: result.public_id,
    });

  } catch (err) {
    console.error("Upload error:", err);
    res.status(500).json({ error: "Image upload failed" });
  }
});

/* ===========================
   MULTI-IMAGE UPLOAD
=========================== */
app.post("/api/admin/products/upload-images", adminOnly, adminUploader.array("images", 5), async (req, res) => {
  try {
    if (!req.files || req.files.length === 0) return res.status(400).json({ error: "No images provided" });
    const urls = [];
    for (const file of req.files) {
      const result = await cloudinaryCloud.uploader.upload(file.path, {
        folder: "techmart_products",
        transformation: [
          { width: 800, height: 800, crop: "limit" },
          { quality: "auto" },
          { fetch_format: "auto" }
        ]
      });
      urls.push(result.secure_url);
    }
    res.json({ success: true, urls });
  } catch (err) {
    console.error("Multi-upload error:", err);
    res.status(500).json({ error: "Image upload failed" });
  }
});

/* ===========================
   ⚡ SOCKET.IO
=========================== */
const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: allowedOrigins,
    methods: ["GET", "POST"],
    credentials: true
  }
});

io.on("connection", (socket) => {
  console.log("⚡ Connected:", socket.id);
  // Client joins a private room keyed by their email so order updates
  // are only delivered to that customer, never broadcast to everyone.
  socket.on("join", (email) => {
    if (email && typeof email === "string") {
      socket.join(email.toLowerCase().trim());
    }
  });
  socket.on("disconnect", () => {
    console.log("❌ Disconnected:", socket.id);
  });
});

// (old generic error handler removed — see global handler at end of file)

/* ===========================
   🏓 KEEP ALIVE
=========================== */
setInterval(() => {
  fetch("https://techmart-backend-ecbi.onrender.com/")
    .then(() => console.log("🏓 Keep alive ping"))
    .catch(() => console.log("⚠️ Ping failed"));
}, 14 * 60 * 1000);

/* ===========================
   🚀 START SERVER
=========================== */
const PORT = process.env.PORT || 5002;


/* ===========================
   🛡️ FRAUD ADMIN ENDPOINTS
=========================== */
// Get all flagged users
app.get("/api/admin/fraud/flagged", adminOnly, async (req, res) => {
  try {
    const flagged = await User.find({ isFlagged: true })
      .select("name email fraudScore fraudFlags isFlagged createdAt walletBalance")
      .sort({ fraudScore: -1 });
    res.json(flagged);
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch flagged users" });
  }
});

// Clear fraud flag on a user
app.post("/api/admin/fraud/clear/:userId", adminOnly, async (req, res) => {
  try {
    await User.findByIdAndUpdate(req.params.userId, {
      $set: { isFlagged: false, fraudScore: 0, fraudFlags: [] }
    });
    res.json({ success: true, message: "Fraud flag cleared" });
  } catch (err) {
    res.status(500).json({ error: "Failed to clear flag" });
  }
});

// Suspend a flagged user
app.post("/api/admin/fraud/suspend/:userId", adminOnly, async (req, res) => {
  try {
    await User.findByIdAndUpdate(req.params.userId, {
      $set: { role: "suspended" }
    });
    res.json({ success: true, message: "User suspended" });
  } catch (err) {
    res.status(500).json({ error: "Failed to suspend user" });
  }
});


/* ===========================
   ESCROW + CANCELLATION + SELLER ANALYTICS
=========================== */

// Buyer confirms delivery — releases escrow to seller wallet
app.post("/api/orders/:orderId/confirm-delivery", auth, async (req, res) => {
  try {
    const order = await Order.findById(req.params.orderId);
    if (!order) return res.status(404).json({ error: "Order not found" });
    if (order.email !== req.user.email) return res.status(403).json({ error: "Not your order" });
    if (order.escrowStatus !== "holding") return res.status(400).json({ error: "No escrow funds to release" });
    if (order.buyerConfirmed) return res.status(400).json({ error: "Delivery already confirmed" });

    // Find seller (checks both Seller model and User model with role=seller) and credit their wallet
    const sellerId = order.items[0]?.vendorId;
    const releaseAmount = Number(order.amount) || 0;
    if (sellerId && releaseAmount > 0) {
      let seller = await Seller.findById(sellerId).catch(() => null);
      let isSellerModel = !!seller;
      if (!seller) seller = await User.findById(sellerId).catch(() => null);
      if (seller) {
        seller.walletBalance = (seller.walletBalance || 0) + releaseAmount;
        seller.walletTransactions = seller.walletTransactions || [];
        seller.walletTransactions.push({
          type: "credit",
          amount: releaseAmount,
          description: `Escrow released for order #${order.trackingNumber || order._id}`,
          reference: "ESC-" + Date.now()
        });
        await seller.save();
      } else {
        console.warn(`⚠️ Escrow release: seller ${sellerId} not found in Seller or User model. Funds not credited.`);
      }
    }

    order.escrowStatus = "released";
    order.escrowReleasedAt = new Date();
    order.buyerConfirmed = true;
    order.status = "Delivered";
    await order.save();

    // 💰 2% Cashback to buyer wallet
    const cashbackAmount = Math.floor((Number(order.amount) || 0) * 0.02);
    let cashbackMsg = "";
    if (cashbackAmount > 0) {
      try {
        const buyer = await User.findOne({ email: order.email });
        if (buyer) {
          buyer.walletBalance = (buyer.walletBalance || 0) + cashbackAmount;
          buyer.walletTransactions = buyer.walletTransactions || [];
          buyer.walletTransactions.push({
            type: "credit",
            amount: cashbackAmount,
            description: `2% cashback on order #${order.trackingNumber || order._id}`,
            reference: "CBK-" + Date.now()
          });
          await buyer.save();
          cashbackMsg = `You earned ₦${cashbackAmount.toLocaleString()} cashback!`;
          console.log(`💰 Cashback ₦${cashbackAmount} credited to ${order.email}`);
        }
      } catch (cbErr) {
        console.error("Cashback error:", cbErr.message);
      }
    }
    res.json({ success: true, message: "Delivery confirmed. Payment released to seller.", cashback: cashbackAmount, cashbackMsg });
  } catch (err) {
    console.error("Escrow release error:", err.message);
    res.status(500).json({ error: "Failed to confirm delivery" });
  }
});

// Cancel order and refund to wallet
app.post("/api/orders/:orderId/cancel", auth, async (req, res) => {
  try {
    const { reason } = req.body;
    const order = await Order.findById(req.params.orderId);
    if (!order) return res.status(404).json({ error: "Order not found" });
    if (order.email !== req.user.email) return res.status(403).json({ error: "Not your order" });

    const cancellableStatuses = ["Pending", "Processing"];
    if (!cancellableStatuses.includes(order.status)) {
      return res.status(400).json({ error: `Cannot cancel an order that is ${order.status}` });
    }

    // Refund to wallet if order was paid
    const refundAmount = Number(order.amount) || 0;
    if (refundAmount > 0) {
      const buyer = await User.findOne({ email: order.email });
      if (buyer) {
        buyer.walletBalance = (buyer.walletBalance || 0) + refundAmount;
        buyer.walletTransactions = buyer.walletTransactions || [];
        buyer.walletTransactions.push({
          type: "credit",
          amount: refundAmount,
          description: `Refund for cancelled order #${order.trackingNumber || order._id}`,
          reference: "REF-" + Date.now()
        });
        await buyer.save();
      }
    }

    order.status = "Cancelled";
    order.cancelledAt = new Date();
    order.cancelReason = reason || "Cancelled by buyer";
    if (order.escrowStatus === "holding") order.escrowStatus = "refunded";
    await order.save();

    res.json({ success: true, message: "Order cancelled. Refund added to your TechMart wallet." });
  } catch (err) {
    console.error("Cancel error:", err.message);
    res.status(500).json({ error: "Failed to cancel order" });
  }
});

// Seller analytics
app.get("/api/seller/analytics", auth, async (req, res) => {
  try {
    const orders = await Order.find({
      "items.vendorId": req.user.id,
      status: { $ne: "Cancelled" }
    });

    const totalRevenue = orders.reduce((sum, o) => sum + (o.amount || 0), 0);
    const totalOrders = orders.length;
    const delivered = orders.filter(o => o.status === "Delivered").length;
    const conversionRate = totalOrders > 0 ? Math.round((delivered / totalOrders) * 100) : 0;

    // Top products
    const productMap = {};
    orders.forEach(o => {
      (o.items || []).forEach(item => {
        if (item.vendorId === req.user.id) {
          if (!productMap[item.name]) productMap[item.name] = { name: item.name, units: 0, revenue: 0 };
          productMap[item.name].units += item.quantity || 1;
          productMap[item.name].revenue += (item.price || 0) * (item.quantity || 1);
        }
      });
    });
    const topProducts = Object.values(productMap).sort((a, b) => b.revenue - a.revenue).slice(0, 5);

    // Monthly revenue (last 6 months)
    const monthly = {};
    orders.forEach(o => {
      const month = new Date(o.createdAt).toLocaleString("default", { month: "short", year: "numeric" });
      monthly[month] = (monthly[month] || 0) + (o.amount || 0);
    });

    res.json({ success: true, totalRevenue, totalOrders, delivered, conversionRate, topProducts, monthly });
  } catch (err) {
    console.error("Seller analytics error:", err.message);
    res.status(500).json({ error: "Failed to fetch analytics" });
  }
});


/* ===========================
   🛡️ TRUST & SAFETY
=========================== */

// Send OTP for 2FA
app.post("/api/auth/send-otp", async (req, res) => {
  try {
    const email = req.body.email ? String(req.body.email).toLowerCase().trim() : req.body.email;
    if (!email) return res.status(400).json({ error: "Email is required" });
    const user = await User.findOne({ email });
    if (!user) return res.status(404).json({ error: "User not found" });

    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const expires = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    await User.findByIdAndUpdate(user._id, { otpCode: otp, otpExpires: expires });

    await sendOTPEmail(user.email, user.name, otp);
    res.json({ success: true, message: "OTP sent to your email" });
  } catch (err) {
    console.error("OTP error:", err.message);
    res.status(500).json({ error: "Failed to send OTP" });
  }
});

// Verify OTP
app.post("/api/auth/verify-otp", async (req, res) => {
  try {
    const { otp } = req.body;
    const email = req.body.email ? String(req.body.email).toLowerCase().trim() : req.body.email;
    if (!email || !otp) return res.status(400).json({ error: "Email and OTP are required" });
    const user = await User.findOne({ email });
    if (!user) return res.status(404).json({ error: "User not found" });
    if (!user.otpCode || user.otpCode !== otp) return res.status(400).json({ error: "Invalid OTP" });
    if (new Date() > new Date(user.otpExpires)) return res.status(400).json({ error: "OTP has expired. Please request a new one." });

    const crypto = require("crypto");
    const deviceToken = crypto.randomBytes(32).toString("hex");
    const updatedTokens = [...(user.deviceTokens || []), deviceToken].slice(-5);
    await User.findByIdAndUpdate(user._id, { otpCode: null, otpExpires: null, deviceTokens: updatedTokens });
    const token = jwt.sign(
      { id: user._id, email: user.email, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: "7d" }
    );
    res.json({ success: true, token, deviceToken, user: { id: user._id, name: user.name, email: user.email, role: user.role, walletBalance: user.walletBalance, walletPinSet: user.walletPinSet, twoFactorEnabled: user.twoFactorEnabled } });
  } catch (err) {
    console.error("OTP verify error:", err.message);
    res.status(500).json({ error: "OTP verification failed" });
  }
});

// Submit Return Request
app.post("/api/returns", auth, async (req, res) => {
  try {
    const { orderId, reason, description } = req.body;
    if (!orderId || !reason) return res.status(400).json({ error: "Order ID and reason are required" });

    const order = await Order.findById(orderId);
    if (!order) return res.status(404).json({ error: "Order not found" });
    if (order.email !== req.user.email) return res.status(403).json({ error: "Not your order" });
    if (!["Delivered", "Paid", "Shipped"].includes(order.status)) {
      return res.status(400).json({ error: "Only delivered or shipped orders can be returned" });
    }

    const existing = await Return.findOne({ orderId, buyerEmail: req.user.email });
    if (existing) return res.status(400).json({ error: "You already submitted a return for this order" });

    const user = await User.findById(req.user.id);
    const returnRequest = await Return.create({
      orderId,
      buyerEmail: req.user.email,
      buyerName: user?.name || req.user.email,
      reason,
      description,
      refundAmount: order.amount
    });

    res.json({ success: true, message: "Return request submitted. We will review it within 24 hours.", returnRequest });
  } catch (err) {
    console.error("Return error:", err.message);
    res.status(500).json({ error: "Failed to submit return request" });
  }
});

// Get buyer's return requests
app.get("/api/returns/my", auth, async (req, res) => {
  try {
    const returns = await Return.find({ buyerEmail: req.user.email }).sort({ createdAt: -1 });
    res.json(returns);
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch returns" });
  }
});

// Admin — get all returns
app.get("/api/admin/returns", adminOnly, async (req, res) => {
  try {
    const returns = await Return.find().sort({ createdAt: -1 });
    res.json(returns);
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch returns" });
  }
});

// Admin — approve/reject return
app.put("/api/admin/returns/:id", adminOnly, async (req, res) => {
  try {
    const { status, adminNote, refundAmount } = req.body;
    const returnReq = await Return.findByIdAndUpdate(
      req.params.id,
      { status, adminNote, refundAmount },
      { new: true }
    );
    if (!returnReq) return res.status(404).json({ error: "Return not found" });

    // If approved, credit buyer wallet
    if (status === "approved") {
      const buyer = await User.findOne({ email: returnReq.buyerEmail });
      if (buyer) {
        buyer.walletBalance = (buyer.walletBalance || 0) + Number(refundAmount || returnReq.refundAmount);
        buyer.walletTransactions.push({
          type: "credit",
          amount: Number(refundAmount || returnReq.refundAmount),
          description: `Refund approved for return request #${returnReq._id}`,
          reference: "RET-" + Date.now()
        });
        await buyer.save();
      }
    }

    res.json({ success: true, returnReq });
  } catch (err) {
    res.status(500).json({ error: "Failed to update return" });
  }
});


/* ===========================
   🤖 AI PLATFORM ASSISTANT V2
=========================== */
app.post("/api/ai/assistant", auth, async (req, res) => {
  try {
    const { message, history = [], context = {} } = req.body;
    const user = await User.findById(req.user.id);
    const isAdmin = user.role === "admin";
    const isSeller = user.role === "seller";

    // 1. Classify intent with full context
    const classifyRes = await groq.chat.completions.create({
      model: "llama-3.3-70b-versatile",
      messages: [{
        role: "system",
        content: `You are an intent classifier for TechMart, a Nigerian e-commerce platform.
Classify the user message into ONE intent. Use conversation history and context to resolve pronouns like "it", "that", "the cheaper one", "the first one".
Return ONLY valid JSON with no markdown.

Context from previous turn: ${JSON.stringify(context)}

Intents:
- find_product: search products (params: query, maxPrice, minPrice, category)
- add_to_cart: add product to cart (params: productId, productName, quantity)
- buy_now: buy product immediately with wallet (params: productId, productName, price)
- compare_products: compare two products (params: product1, product2)
- wallet_balance: check balance
- wallet_transfer: transfer money (params: recipientEmail, amount, note)
- wallet_split: split money between people (params: amount, recipients[])
- wallet_spending: show spending summary (params: period e.g. "this month")
- wallet_cashback: show cashback earned
- fund_wallet: add money to wallet (params: amount)
- track_order: track orders
- show_orders: list recent orders
- apply_coupon: apply best coupon
- place_order: complete checkout with wallet (params: couponCode)
- start_return: start return (params: orderId)
- generate_description: generate product description (params: productName, category)
- seller_flash_sale: create flash sale (params: productName, discount, endDate) - seller/admin only
- seller_low_stock: show low stock products - seller/admin only
- seller_reorder: suggest reorder products - seller/admin only
- seller_descriptions: generate descriptions for all new products - seller/admin only
- admin_revenue: show today revenue - admin only
- admin_suspicious: list suspicious transactions - admin only
- admin_payouts: show/approve pending payouts - admin only
- admin_flag_accounts: show high risk accounts - admin only
- proactive_check: check for alerts (low balance, stock, coupons)
- general_chat: conversation

Example: {"intent": "add_to_cart", "params": {"productId": "abc123", "quantity": 1}}`
      }, {
        role: "user",
        content: `History: ${JSON.stringify(history.slice(-4).map(m => m.text))}

Current message: ${message}`
      }],
      max_tokens: 300,
      temperature: 0.1
    });

    let intent, params;
    try {
      const parsed = JSON.parse(classifyRes.choices[0].message.content.trim());
      intent = parsed.intent;
      params = parsed.params || {};
    } catch {
      intent = "general_chat";
      params = {};
    }

    let responseData = { intent, message: "", data: null, action: null, context: {} };

    switch (intent) {

      case "find_product": {
        const query = { stock: { $gt: 0 } };
        if (params.category) query.category = new RegExp(params.category, "i");
        if (params.maxPrice) query.price = { ...(query.price||{}), $lte: Number(params.maxPrice) };
        if (params.minPrice) query.price = { ...(query.price||{}), $gte: Number(params.minPrice) };
        let products = params.query
          ? await Product.find({ name: new RegExp(params.query, "i"), stock: { $gt: 0 }, ...query }).limit(5)
          : await Product.find(query).limit(5);
        responseData.message = products.length > 0 ? `Found ${products.length} product${products.length > 1 ? "s" : ""}:` : "No products found.";
        responseData.data = { type: "products", items: products.map(p => ({ _id: p._id, name: p.name, price: p.price, image: p.images?.[0], category: p.category, stock: p.stock })) };
        responseData.context = { lastProducts: products.map(p => ({ _id: p._id, name: p.name, price: p.price })) };
        break;
      }

      case "compare_products": {
        const p1 = params.product1 || context.lastProducts?.[0]?.name;
        const p2 = params.product2 || context.lastProducts?.[1]?.name;
        if (!p1 || !p2) { responseData.message = "Please specify two products to compare."; break; }
        const [prod1, prod2] = await Promise.all([
          Product.findOne({ name: new RegExp(p1, "i") }),
          Product.findOne({ name: new RegExp(p2, "i") })
        ]);
        if (!prod1 || !prod2) { responseData.message = "Could not find both products to compare."; break; }
        const cheaper = prod1.price < prod2.price ? prod1 : prod2;
        responseData.message = `Comparing **${prod1.name}** vs **${prod2.name}**:`;
        responseData.data = { type: "compare", items: [prod1, prod2].map(p => ({ _id: p._id, name: p.name, price: p.price, image: p.images?.[0], category: p.category, stock: p.stock, rating: p.rating })), cheaper: cheaper._id };
        responseData.context = { lastProducts: [prod1, prod2].map(p => ({ _id: p._id, name: p.name, price: p.price })), cheaperProduct: { _id: cheaper._id, name: cheaper.name, price: cheaper.price } };
        break;
      }

      case "add_to_cart": {
        let product = null;
        if (params.productId) product = await Product.findById(params.productId);
        else if (params.productName) product = await Product.findOne({ name: new RegExp(params.productName, "i") });
        else if (context.cheaperProduct) product = await Product.findById(context.cheaperProduct._id);
        else if (context.lastProducts?.[0]) product = await Product.findById(context.lastProducts[0]._id);
        if (!product) { responseData.message = "Could not find the product to add to cart."; break; }
        responseData.message = `Added **${product.name}** (₦${product.price?.toLocaleString()}) to your cart!`;
        responseData.data = { type: "add_to_cart", product: { _id: product._id, name: product.name, price: product.price, images: product.images } };
        responseData.action = "add_to_cart";
        responseData.context = { ...context, cartProduct: { _id: product._id, name: product.name, price: product.price } };
        break;
      }

      case "buy_now": {
        let product = null;
        if (params.productId) product = await Product.findById(params.productId);
        else if (context.cartProduct) product = await Product.findById(context.cartProduct._id);
        else if (context.cheaperProduct) product = await Product.findById(context.cheaperProduct._id);
        if (!product) { responseData.message = "Which product would you like to buy?"; break; }
        if ((user.walletBalance || 0) < product.price) {
          responseData.message = `Insufficient wallet balance. You need ₦${product.price?.toLocaleString()} but have ₦${(user.walletBalance||0).toLocaleString()}. Would you like to add money to your wallet?`;
          responseData.data = { type: "navigate", path: "/pay", tab: "Add Money" };
          break;
        }
        responseData.message = `Ready to buy **${product.name}** for ₦${product.price?.toLocaleString()} from your wallet. Confirm?`;
        responseData.data = { type: "confirm_buy", product: { _id: product._id, name: product.name, price: product.price } };
        responseData.action = "confirm_buy";
        break;
      }

      case "wallet_balance": {
        const recent = (user.walletTransactions || []).slice(-3).reverse();
        responseData.message = `Your wallet balance is ₦${(user.walletBalance || 0).toLocaleString()}.`;
        responseData.data = { type: "balance", balance: user.walletBalance || 0, recent };
        break;
      }

      case "wallet_split": {
        const { amount, recipients = [] } = params;
        if (!amount || recipients.length === 0) { responseData.message = "Please specify the amount and recipients. E.g. 'Split ₦30,000 between john@gmail.com, jane@gmail.com, bob@gmail.com'"; break; }
        const share = Math.floor(Number(amount) / recipients.length);
        responseData.message = `Split ₦${Number(amount).toLocaleString()} between ${recipients.length} people: each gets ₦${share.toLocaleString()}. Confirm transfers?`;
        responseData.data = { type: "confirm_split", amount, recipients, share };
        responseData.action = "confirm_split";
        break;
      }

      case "wallet_spending": {
        const period = params.period || "this month";
        const startDate = new Date();
        startDate.setDate(1);
        const txns = (user.walletTransactions || []).filter(t => new Date(t.createdAt) >= startDate);
        const totalSpent = txns.filter(t => t.type === "debit").reduce((s, t) => s + t.amount, 0);
        const totalIn = txns.filter(t => t.type === "credit").reduce((s, t) => s + t.amount, 0);
        responseData.message = `This month: spent ₦${totalSpent.toLocaleString()}, received ₦${totalIn.toLocaleString()}. Net: ${totalIn > totalSpent ? "+" : ""}₦${(totalIn - totalSpent).toLocaleString()}.`;
        responseData.data = { type: "spending", totalSpent, totalIn, txns: txns.slice(-5) };
        break;
      }

      case "wallet_cashback": {
        const cashbackTxns = (user.walletTransactions || []).filter(t => t.description?.toLowerCase().includes("cashback"));
        const total = cashbackTxns.reduce((s, t) => s + t.amount, 0);
        responseData.message = `You have earned ₦${total.toLocaleString()} in cashback across ${cashbackTxns.length} transaction${cashbackTxns.length !== 1 ? "s" : ""}.`;
        responseData.data = { type: "cashback", total, count: cashbackTxns.length };
        break;
      }

      case "wallet_transfer": {
        if (!params.recipientEmail || !params.amount) { responseData.message = "Please provide recipient email and amount."; break; }
        responseData.message = `Transfer ₦${Number(params.amount).toLocaleString()} to ${params.recipientEmail}. Confirm?`;
        responseData.data = { type: "confirm_transfer", recipientEmail: params.recipientEmail, amount: params.amount, note: params.note };
        responseData.action = "confirm_transfer";
        break;
      }

      case "apply_coupon": {
        const coupons = await Coupon.find({ active: true, $or: [{ expiresAt: null }, { expiresAt: { $gt: new Date() } }] }).sort({ value: -1 }).limit(1);
        if (!coupons.length) { responseData.message = "No active coupons available right now."; break; }
        const best = coupons[0];
        responseData.message = `Best coupon: **${best.code}** — ${best.type === "percent" ? best.value + "% off" : "₦" + best.value + " off"}. Tap to copy!`;
        responseData.data = { type: "coupon", code: best.code, value: best.value, discountType: best.type };
        responseData.action = "apply_coupon";
        break;
      }

      case "track_order": {
        const orders = await Order.find({ email: user.email }).sort({ createdAt: -1 }).limit(5);
        if (!orders.length) { responseData.message = "You have no orders yet."; break; }
        const o = orders[0];
        responseData.message = `Last order (#${o.trackingNumber || o._id.toString().slice(-6)}) is **${o.status}** — ₦${o.amount?.toLocaleString()}.`;
        responseData.data = { type: "orders", items: orders.slice(0, 3).map(o => ({ _id: o._id, status: o.status, amount: o.amount, trackingNumber: o.trackingNumber, createdAt: o.createdAt })) };
        break;
      }

      case "show_orders": {
        const orders = await Order.find({ email: user.email }).sort({ createdAt: -1 }).limit(5);
        responseData.message = orders.length ? `Your ${orders.length} most recent orders:` : "No orders yet.";
        responseData.data = { type: "orders", items: orders.map(o => ({ _id: o._id, status: o.status, amount: o.amount, trackingNumber: o.trackingNumber, createdAt: o.createdAt })) };
        break;
      }

      case "start_return": {
        const orders = await Order.find({ email: user.email, status: { $in: ["Delivered", "Shipped"] } }).sort({ createdAt: -1 }).limit(1);
        if (!orders.length) { responseData.message = "No eligible orders for return."; break; }
        responseData.message = `Start return for order #${orders[0].trackingNumber || orders[0]._id.toString().slice(-6)} (₦${orders[0].amount?.toLocaleString()})? What is the reason?`;
        responseData.data = { type: "start_return", orderId: orders[0]._id };
        responseData.action = "start_return";
        break;
      }

      case "generate_description": {
        const name = params.productName || "this product";
        const descRes = await groq.chat.completions.create({
          model: "llama-3.3-70b-versatile",
          messages: [{ role: "user", content: `Write a compelling 2-3 sentence product description for "${name}" ${params.category ? "in the " + params.category + " category" : ""} for a Nigerian e-commerce store. Focus on key features and value. Be concise and persuasive.` }],
          max_tokens: 150, temperature: 0.7
        });
        responseData.message = descRes.choices[0].message.content.trim();
        responseData.data = { type: "description", text: responseData.message };
        break;
      }

      case "seller_low_stock": {
        const query = isSeller ? { vendorId: req.user.id, stock: { $lte: 5 } } : { stock: { $lte: 5 } };
        const products = await Product.find(query).sort({ stock: 1 }).limit(10);
        responseData.message = products.length ? `${products.length} products with low stock:` : "No low stock products.";
        responseData.data = { type: "products", items: products.map(p => ({ _id: p._id, name: p.name, price: p.price, stock: p.stock, image: p.images?.[0] })) };
        break;
      }

      case "seller_reorder": {
        const query = isSeller ? { vendorId: req.user.id, stock: { $lte: 10 } } : { stock: { $lte: 10 } };
        const products = await Product.find(query).sort({ stock: 1 }).limit(5);
        responseData.message = products.length ? `I recommend reordering these ${products.length} products:` : "All products have sufficient stock.";
        responseData.data = { type: "products", items: products.map(p => ({ _id: p._id, name: p.name, price: p.price, stock: p.stock, image: p.images?.[0] })) };
        break;
      }

      case "seller_descriptions": {
        const query = isSeller ? { vendorId: req.user.id, description: { $in: [null, "", "No description"] } } : { description: { $in: [null, "", "No description"] } };
        const products = await Product.find(query).limit(3);
        if (!products.length) { responseData.message = "All products have descriptions."; break; }
        const descriptions = await Promise.all(products.map(async p => {
          const r = await groq.chat.completions.create({
            model: "llama-3.3-70b-versatile",
            messages: [{ role: "user", content: `Write a 2-sentence product description for "${p.name}" (${p.category}) for a Nigerian electronics store.` }],
            max_tokens: 100, temperature: 0.7
          });
          return { _id: p._id, name: p.name, description: r.choices[0].message.content.trim() };
        }));
        responseData.message = `Generated descriptions for ${descriptions.length} products:`;
        responseData.data = { type: "descriptions", items: descriptions };
        break;
      }

      case "admin_revenue": {
        if (!isAdmin) { responseData.message = "Admin access required."; break; }
        const today = new Date(); today.setHours(0,0,0,0);
        const orders = await Order.find({ createdAt: { $gte: today }, status: { $nin: ["Cancelled"] } });
        const revenue = orders.reduce((s, o) => s + (o.amount || 0), 0);
        responseData.message = `Today's revenue: ₦${revenue.toLocaleString()} from ${orders.length} order${orders.length !== 1 ? "s" : ""}.`;
        responseData.data = { type: "revenue", revenue, orders: orders.length, date: today };
        break;
      }

      case "admin_suspicious": {
        if (!isAdmin) { responseData.message = "Admin access required."; break; }
        const flagged = await User.find({ isFlagged: true }).select("name email fraudScore fraudFlags").sort({ fraudScore: -1 }).limit(5);
        responseData.message = flagged.length ? `${flagged.length} suspicious account${flagged.length !== 1 ? "s" : ""} flagged:` : "No suspicious accounts detected.";
        responseData.data = { type: "users", items: flagged.map(u => ({ _id: u._id, name: u.name, email: u.email, fraudScore: u.fraudScore, reason: u.fraudFlags?.[0]?.reason })) };
        break;
      }

      case "admin_payouts": {
        if (!isAdmin) { responseData.message = "Admin access required."; break; }
        const Payout = mongoose.models.Payout;
        if (!Payout) { responseData.message = "Payout system not initialized."; break; }
        const payouts = await Payout.find({ status: "pending" }).limit(5);
        responseData.message = payouts.length ? `${payouts.length} pending payout${payouts.length !== 1 ? "s" : ""} awaiting approval.` : "No pending payouts.";
        responseData.data = { type: "payouts", items: payouts, action: "navigate", path: "/admin" };
        break;
      }

      case "admin_flag_accounts": {
        if (!isAdmin) { responseData.message = "Admin access required."; break; }
        const high = await User.find({ fraudScore: { $gte: 60 } }).select("name email fraudScore").sort({ fraudScore: -1 }).limit(5);
        responseData.message = high.length ? `${high.length} high-risk account${high.length !== 1 ? "s" : ""}:` : "No high-risk accounts.";
        responseData.data = { type: "users", items: high.map(u => ({ _id: u._id, name: u.name, email: u.email, fraudScore: u.fraudScore })) };
        break;
      }

      case "proactive_check": {
        const alerts = [];
        if ((user.walletBalance || 0) < 500) alerts.push("💰 Your wallet balance is low (₦" + (user.walletBalance||0).toLocaleString() + ").");
        const coupon = await Coupon.findOne({ active: true, $or: [{ expiresAt: null }, { expiresAt: { $gt: new Date() } }] });
        if (coupon) alerts.push(`🎟 Active coupon available: **${coupon.code}**`);
        const lowStock = await Product.find({ stock: { $lte: 3, $gt: 0 }, ...(isSeller ? { vendorId: req.user.id } : {}) }).limit(2);
        lowStock.forEach(p => alerts.push(`⚠️ Low stock: **${p.name}** (${p.stock} left)`));
        responseData.message = alerts.length ? alerts.join(" | ") : "Everything looks good! No alerts at this time.";
        responseData.data = { type: "alerts", items: alerts };
        break;
      }

      case "fund_wallet": {
        responseData.message = `Taking you to Add Money${params.amount ? " to fund ₦" + Number(params.amount).toLocaleString() : ""}.`;
        responseData.data = { type: "navigate", path: "/pay", tab: "Add Money", amount: params.amount };
        responseData.action = "navigate";
        break;
      }

      case "general_chat":
      default: {
        const products = await Product.find({ stock: { $gt: 0 } }).select("name price category").limit(20);
        const catalog = products.map(p => p.name + " (" + "N" + p.price?.toLocaleString() + ") - " + p.category).join(", ");
        const chatRes = await groq.chat.completions.create({
          model: "llama-3.3-70b-versatile",
          messages: [
            { role: "system", content: `You are TechMart AI for ${user.name}. Wallet: N${(user.walletBalance||0).toLocaleString()}. Role: ${user.role}. Products: ${catalog}. TechMart was founded by Jamiu Sanni with a vision to build Africa's leading e-commerce platform, connecting buyers and sellers globally. 
TECHMART FAQ KNOWLEDGE:
- Return Policy: Buyers have 7 days after delivery to request a return. Items must be in original condition.
- Escrow: Payment is held securely by TechMart when an order is placed. Funds are only released to the seller after the buyer confirms delivery. This protects both parties.
- Seller Fees: Selling on TechMart is completely free for now. No listing fees, no commission.
- Delivery: TechMart partners with trusted delivery partners to fulfil orders. Sellers coordinate dispatch and buyers are notified with tracking updates.
If a user asks about any of these topics, answer confidently using the above information.
Be helpful and concise.` },
            ...history.slice(-6).map(m => ({ role: m.sender === "user" ? "user" : "assistant", content: m.text })),
            { role: "user", content: message }
          ],
          max_tokens: 300, temperature: 0.7
        });
        responseData.message = chatRes.choices[0].message.content.trim();
        break;
      }
    }

    res.json({ success: true, ...responseData });
  } catch (err) {
    console.error("AI Assistant error:", err.message);
    res.status(500).json({ error: "AI Assistant failed", message: "Sorry, I encountered an error. Please try again." });
  }
});

/* ===========================
   🧠 AI AGENT - TOOL CALLING
=========================== */

// Tool definitions for Groq function calling
const TECHMART_TOOLS = [
  {
    type: "function",
    function: {
      name: "search_products",
      description: "Search for products on TechMart by name, category, or price range",
      parameters: {
        type: "object",
        properties: {
          query: { type: "string", description: "Product name or keywords" },
          category: { type: "string", description: "Product category" },
          maxPrice: { type: "number", description: "Maximum price in Naira" },
          minPrice: { type: "number", description: "Minimum price in Naira" },
          limit: { type: "number", description: "Number of results (default 5)" }
        }
      }
    }
  },
  {
    type: "function",
    function: {
      name: "get_wallet_info",
      description: "Get user wallet balance and recent transactions",
      parameters: { type: "object", properties: {} }
    }
  },
  {
    type: "function",
    function: {
      name: "transfer_money",
      description: "Transfer money from wallet to another TechMart user",
      parameters: {
        type: "object",
        properties: {
          recipientEmail: { type: "string", description: "Recipient email address" },
          amount: { type: "number", description: "Amount in Naira" },
          note: { type: "string", description: "Optional note" }
        },
        required: ["recipientEmail", "amount"]
      }
    }
  },
  {
    type: "function",
    function: {
      name: "get_orders",
      description: "Get user recent orders and their status",
      parameters: {
        type: "object",
        properties: {
          limit: { type: "number", description: "Number of orders to return" },
          status: { type: "string", description: "Filter by status" }
        }
      }
    }
  },
  {
    type: "function",
    function: {
      name: "get_best_coupon",
      description: "Get the best available coupon code",
      parameters: { type: "object", properties: {} }
    }
  },
  {
    type: "function",
    function: {
      name: "get_spending_summary",
      description: "Get wallet spending summary for a period",
      parameters: {
        type: "object",
        properties: {
          period: { type: "string", description: "Period e.g. this month, last week, today" }
        }
      }
    }
  },
  {
    type: "function",
    function: {
      name: "get_low_stock_products",
      description: "Get products with low stock (for sellers and admins)",
      parameters: {
        type: "object",
        properties: {
          threshold: { type: "number", description: "Stock threshold (default 5)" }
        }
      }
    }
  },
  {
    type: "function",
    function: {
      name: "get_admin_stats",
      description: "Get admin dashboard stats including today revenue and orders",
      parameters: { type: "object", properties: {} }
    }
  },
  {
    type: "function",
    function: {
      name: "get_flagged_users",
      description: "Get users flagged for suspicious activity (admin only)",
      parameters: { type: "object", properties: {} }
    }
  },
  {
    type: "function",
    function: {
      name: "generate_product_description",
      description: "Generate a compelling product description using AI",
      parameters: {
        type: "object",
        properties: {
          productName: { type: "string", description: "Product name" },
          category: { type: "string", description: "Product category" }
        },
        required: ["productName"]
      }
    }
  },
  {
    type: "function",
    function: {
      name: "save_preference",
      description: "Save a user preference or memory for future conversations",
      parameters: {
        type: "object",
        properties: {
          key: { type: "string", description: "Preference key e.g. preferred_network, budget" },
          value: { type: "string", description: "Preference value" }
        },
        required: ["key", "value"]
      }
    }
  },
  {
    type: "function",
    function: {
      name: "compare_products",
      description: "Compare two products side by side",
      parameters: {
        type: "object",
        properties: {
          product1: { type: "string", description: "First product name or ID" },
          product2: { type: "string", description: "Second product name or ID" }
        },
        required: ["product1", "product2"]
      }
    }
  }
];

// Tool executor
async function executeTool(toolName, toolArgs, user) {
  switch (toolName) {
    case "search_products": {
      const query = { stock: { $gt: 0 } };
      if (toolArgs.category) query.category = new RegExp(toolArgs.category, "i");
      if (toolArgs.maxPrice) query.price = { ...(query.price||{}), $lte: toolArgs.maxPrice };
      if (toolArgs.minPrice) query.price = { ...(query.price||{}), $gte: toolArgs.minPrice };
      const limit = toolArgs.limit || 5;
      let products;
      if (toolArgs.query) {
        products = await Product.find({ name: new RegExp(toolArgs.query, "i"), stock: { $gt: 0 }, ...query }).limit(limit);
        if (!products.length) products = await Product.find({ description: new RegExp(toolArgs.query, "i"), stock: { $gt: 0 }, ...query }).limit(limit);
      } else {
        products = await Product.find(query).limit(limit);
      }
      return { products: products.map(p => ({ _id: p._id, name: p.name, price: p.price, category: p.category, stock: p.stock, image: p.images?.[0] })) };
    }

    case "get_wallet_info": {
      const recent = (user.walletTransactions || []).slice(-5).reverse();
      return { balance: user.walletBalance || 0, recentTransactions: recent };
    }

    case "transfer_money": {
      const recipient = await User.findOne({ email: toolArgs.recipientEmail });
      if (!recipient) return { error: "Recipient not found" };
      if ((user.walletBalance || 0) < toolArgs.amount) return { error: "Insufficient balance" };
      const reference = "TXF-" + Date.now();
      user.walletBalance -= toolArgs.amount;
      user.walletTransactions.push({ type: "debit", amount: toolArgs.amount, description: `Transfer to ${recipient.name}${toolArgs.note ? " — " + toolArgs.note : ""}`, reference });
      await user.save();
      recipient.walletBalance = (recipient.walletBalance || 0) + toolArgs.amount;
      recipient.walletTransactions.push({ type: "credit", amount: toolArgs.amount, description: `Transfer from ${user.name}`, reference });
      await recipient.save();
      return { success: true, message: `Transferred ₦${toolArgs.amount.toLocaleString()} to ${recipient.name}`, reference };
    }

    case "get_orders": {
      const query = { email: user.email };
      if (toolArgs.status) query.status = toolArgs.status;
      const orders = await Order.find(query).sort({ createdAt: -1 }).limit(toolArgs.limit || 5);
      return { orders: orders.map(o => ({ _id: o._id, status: o.status, amount: o.amount, trackingNumber: o.trackingNumber, createdAt: o.createdAt, items: o.items?.length })) };
    }

    case "get_best_coupon": {
      const coupon = await Coupon.findOne({ active: true, $or: [{ expiresAt: null }, { expiresAt: { $gt: new Date() } }] }).sort({ value: -1 });
      if (!coupon) return { error: "No active coupons" };
      return { code: coupon.code, type: coupon.type, value: coupon.value, minOrder: coupon.minOrder };
    }

    case "get_spending_summary": {
      const start = new Date();
      start.setDate(1);
      const txns = (user.walletTransactions || []).filter(t => new Date(t.createdAt) >= start);
      const spent = txns.filter(t => t.type === "debit").reduce((s, t) => s + t.amount, 0);
      const received = txns.filter(t => t.type === "credit").reduce((s, t) => s + t.amount, 0);
      return { period: toolArgs.period || "this month", totalSpent: spent, totalReceived: received, transactionCount: txns.length };
    }

    case "get_low_stock_products": {
      const threshold = toolArgs.threshold || 5;
      const query = { stock: { $lte: threshold, $gt: 0 } };
      if (user.role === "seller") query.vendorId = user._id.toString();
      const products = await Product.find(query).sort({ stock: 1 }).limit(10);
      return { products: products.map(p => ({ _id: p._id, name: p.name, stock: p.stock, price: p.price })) };
    }

    case "get_admin_stats": {
      if (user.role !== "admin") return { error: "Admin access required" };
      const today = new Date(); today.setHours(0,0,0,0);
      const orders = await Order.find({ createdAt: { $gte: today }, status: { $nin: ["Cancelled"] } });
      const revenue = orders.reduce((s, o) => s + (o.amount || 0), 0);
      const totalUsers = await User.countDocuments();
      const flagged = await User.countDocuments({ isFlagged: true });
      return { todayRevenue: revenue, todayOrders: orders.length, totalUsers, flaggedUsers: flagged };
    }

    case "get_flagged_users": {
      if (user.role !== "admin") return { error: "Admin access required" };
      const flagged = await User.find({ isFlagged: true }).select("name email fraudScore").sort({ fraudScore: -1 }).limit(10);
      return { users: flagged.map(u => ({ _id: u._id, name: u.name, email: u.email, fraudScore: u.fraudScore })) };
    }

    case "generate_product_description": {
      const res = await groq.chat.completions.create({
        model: "llama-3.3-70b-versatile",
        messages: [{ role: "user", content: `Write a compelling 2-3 sentence product description for "${toolArgs.productName}" ${toolArgs.category ? "in the " + toolArgs.category + " category" : ""} for a Nigerian e-commerce store. Be concise and persuasive.` }],
        max_tokens: 150, temperature: 0.7
      });
      return { description: res.choices[0].message.content.trim() };
    }

    case "save_preference": {
      const prefs = user.aiPreferences || {};
      prefs[toolArgs.key] = toolArgs.value;
      await User.findByIdAndUpdate(user._id, { aiPreferences: prefs });
      return { success: true, message: `Saved preference: ${toolArgs.key} = ${toolArgs.value}` };
    }

    case "compare_products": {
      const [p1, p2] = await Promise.all([
        Product.findOne({ $or: [{ _id: toolArgs.product1.length === 24 ? toolArgs.product1 : null }, { name: new RegExp(toolArgs.product1, "i") }] }),
        Product.findOne({ $or: [{ _id: toolArgs.product2.length === 24 ? toolArgs.product2 : null }, { name: new RegExp(toolArgs.product2, "i") }] })
      ]);
      if (!p1 || !p2) return { error: "Could not find one or both products" };
      return {
        product1: { _id: p1._id, name: p1.name, price: p1.price, category: p1.category, stock: p1.stock, rating: p1.rating, image: p1.images?.[0] },
        product2: { _id: p2._id, name: p2.name, price: p2.price, category: p2.category, stock: p2.stock, rating: p2.rating, image: p2.images?.[0] },
        cheaper: p1.price < p2.price ? p1._id : p2._id,
        recommendation: p1.price < p2.price ? p1.name : p2.name
      };
    }

    case "seller_flash_sale": {
      if (!["seller", "admin"].includes(user.role)) return { error: "Only sellers can create flash sales" };
      const { productName, discount, endDate } = toolArgs;
      if (!productName || !discount || !endDate) return { error: "Product name, discount percentage, and end date are required" };
      const query = { name: new RegExp(productName, "i") };
      if (user.role === "seller") query.vendorId = user._id.toString();
      const product = await Product.findOne(query);
      if (!product) return { error: `Could not find a product matching "${productName}"${user.role === "seller" ? " in your store" : ""}` };
      const discountPct = Math.min(90, Math.max(1, Number(discount)));
      const salePrice = Math.round(product.price * (1 - discountPct / 100));
      const endTime = new Date(endDate);
      if (isNaN(endTime.getTime()) || endTime <= new Date()) return { error: "End date must be a valid future date" };
      const sale = await FlashSale.create({
        productId: product._id,
        productName: product.name,
        originalPrice: product.price,
        salePrice,
        startTime: new Date(),
        endTime
      });
      return { success: true, message: `Flash sale created for ${product.name}: ₦${product.price.toLocaleString()} → ₦${salePrice.toLocaleString()} (${discountPct}% off) until ${endTime.toLocaleDateString()}`, flashSaleId: sale._id };
    }
    default:
      return { error: "Unknown tool" };
  }
}

// AI Agent endpoint with tool calling loop
app.post("/api/ai/agent", auth, async (req, res) => {
  try {
    const { message, history = [] } = req.body;
    const user = await User.findById(req.user.id);
    const prefs = user.aiPreferences || {};

    // Build system prompt with user context
    const systemPrompt = `You are TechMart AI Agent for ${user.name} (${user.role}).
Wallet: ₦${(user.walletBalance || 0).toLocaleString()}
Preferences: ${JSON.stringify(prefs)}
Date: ${new Date().toLocaleDateString("en-NG")}

TechMart was founded by Jamiu Sanni with a vision to build Africa's leading e-commerce platform, connecting buyers and sellers globally.
You are an autonomous AI agent that can plan and execute multi-step tasks across TechMart.
Use tools to gather information before responding. Chain multiple tools when needed.
For sensitive actions (transfers, purchases), always confirm with the user first.
Be concise, helpful, and proactive. 
TECHMART FAQ KNOWLEDGE:
- Return Policy: Buyers have 7 days after delivery to request a return. Items must be in original condition.
- Escrow: Payment is held securely by TechMart when an order is placed. Funds are only released to the seller after the buyer confirms delivery. This protects both parties.
- Seller Fees: Selling on TechMart is completely free for now. No listing fees, no commission.
- Delivery: TechMart partners with trusted delivery partners to fulfil orders. Sellers coordinate dispatch and buyers are notified with tracking updates.
If a user asks about any of these topics, answer confidently using the above information.
Speak naturally like a smart Nigerian assistant.`;

    const messages = [
      { role: "system", content: systemPrompt },
      ...history.slice(-10).map(m => ({ role: m.sender === "user" ? "user" : "assistant", content: m.text })),
      { role: "user", content: message }
    ];

    let toolResults = [];
    let finalMessage = "";
    let finalData = null;
    let iterations = 0;
    const MAX_ITERATIONS = 5;

    // Agentic loop — keep calling tools until done
    while (iterations < MAX_ITERATIONS) {
      iterations++;
      const response = await groq.chat.completions.create({
        model: "llama-3.3-70b-versatile",
        messages,
        tools: TECHMART_TOOLS,
        tool_choice: "auto",
        max_tokens: 1000,
        temperature: 0.3
      });

      const choice = response.choices[0];

      // If no tool calls, we have the final answer
      if (!choice.message.tool_calls || choice.message.tool_calls.length === 0) {
        finalMessage = choice.message.content || "";
        break;
      }

      // Execute all tool calls
      messages.push({ role: "assistant", content: choice.message.content || "", tool_calls: choice.message.tool_calls });

      for (const toolCall of choice.message.tool_calls) {
        const toolName = toolCall.function.name;
        let toolArgs = {};
        try { toolArgs = JSON.parse(toolCall.function.arguments); } catch {}

        console.log(`🔧 Agent calling tool: ${toolName}`, toolArgs);
        const result = await executeTool(toolName, toolArgs, user);
        toolResults.push({ tool: toolName, args: toolArgs, result });

        messages.push({
          role: "tool",
          tool_call_id: toolCall.id,
          content: JSON.stringify(result)
        });

        // Build rich data response for frontend
        if (toolName === "search_products" && result.products) {
          finalData = { type: "products", items: result.products };
        }
        if (toolName === "compare_products" && result.product1) {
          finalData = { type: "compare", items: [result.product1, result.product2], cheaper: result.cheaper };
        }
        if (toolName === "get_wallet_info") {
          finalData = { type: "balance", balance: result.balance };
        }
        if (toolName === "get_orders" && result.orders) {
          finalData = { type: "orders", items: result.orders };
        }
        if (toolName === "get_best_coupon" && result.code) {
          finalData = { type: "coupon", code: result.code, value: result.value, discountType: result.type };
        }
        if (toolName === "get_flagged_users" && result.users) {
          finalData = { type: "users", items: result.users };
        }
      }
    }

    res.json({
      success: true,
      message: finalMessage,
      data: finalData,
      toolsUsed: toolResults.map(t => t.tool),
      iterations
    });

  } catch (err) {
    console.error("AI Agent error:", err.message);
    res.status(500).json({ error: "Agent failed", message: "Sorry, I encountered an error. Please try again." });
  }
});

// Streaming agent endpoint
app.post("/api/ai/agent/stream", auth, async (req, res) => {
  try {
    const { message, history = [] } = req.body;
    const user = await User.findById(req.user.id);

    res.setHeader("Content-Type", "text/event-stream");
    res.setHeader("Cache-Control", "no-cache");
    res.setHeader("Connection", "keep-alive");

    const systemPrompt = `You are TechMart AI Agent for ${user.name}. Wallet: ₦${(user.walletBalance || 0).toLocaleString()}. TechMart was founded by Jamiu Sanni with a vision to build Africa's leading e-commerce platform, connecting buyers and sellers globally. 
TECHMART FAQ KNOWLEDGE:
- Return Policy: Buyers have 7 days after delivery to request a return. Items must be in original condition.
- Escrow: Payment is held securely by TechMart when an order is placed. Funds are only released to the seller after the buyer confirms delivery. This protects both parties.
- Seller Fees: Selling on TechMart is completely free for now. No listing fees, no commission.
- Delivery: TechMart partners with trusted delivery partners to fulfil orders. Sellers coordinate dispatch and buyers are notified with tracking updates.
If a user asks about any of these topics, answer confidently using the above information.
Be helpful, concise and natural.`;

    const stream = await groq.chat.completions.create({
      model: "llama-3.3-70b-versatile",
      messages: [
        { role: "system", content: systemPrompt },
        ...history.slice(-6).map(m => ({ role: m.sender === "user" ? "user" : "assistant", content: m.text })),
        { role: "user", content: message }
      ],
      max_tokens: 500,
      temperature: 0.7,
      stream: true
    });

    for await (const chunk of stream) {
      const delta = chunk.choices[0]?.delta?.content || "";
      if (delta) res.write(`data: ${JSON.stringify({ token: delta })}

`);
    }

    res.write("data: [DONE]\n\n");
    res.end();
  } catch (err) {
    console.error("Stream error:", err.message);
    res.write(`data: ${JSON.stringify({ error: err.message })}

`);
    res.end();
  }
});


/* ===========================
   🛒 BUNDLE + ESCROW FLOW
=========================== */

// 1. Add bundle to cart (returns bundle items for frontend)
app.post("/api/orders/bundle", auth, async (req, res) => {
  try {
    const { productIds } = req.body;
    if (!productIds || !productIds.length) return res.status(400).json({ error: "No products provided" });
    const products = await Product.find({ _id: { $in: productIds }, stock: { $gt: 0 } });
    if (!products.length) return res.status(404).json({ error: "No products found" });
    const total = products.reduce((s, p) => s + p.price, 0);
    const discount = Math.round(total * 0.05);
    res.json({
      success: true,
      items: products.map(p => ({ _id: p._id, name: p.name, price: p.price, images: p.images, category: p.category, quantity: 1, vendorId: p.vendorId, vendorName: p.vendorName })),
      total,
      discount,
      bundlePrice: total - discount
    });
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch bundle" });
  }
});

// 2. Checkout with escrow (wallet payment)
app.post("/api/orders/checkout-escrow", auth, async (req, res) => {
  try {
    const { items, amount, deliveryAddress, phone, couponCode, deliveryFee, deliveryZone } = req.body;
    if (!items || !items.length || !amount) return res.status(400).json({ error: "Items and amount are required" });
    if (!deliveryAddress) return res.status(400).json({ error: "Delivery address is required" });

    const user = await User.findById(req.user.id);
    if ((user.walletBalance || 0) < Number(amount)) {
      return res.status(400).json({ error: `Insufficient wallet balance. You need ₦${Number(amount).toLocaleString()} but have ₦${(user.walletBalance || 0).toLocaleString()}` });
    }

    // Check stock availability
    for (const item of items) {
      const product = await Product.findById(item._id);
      if (!product || product.stock < (item.quantity || 1)) {
        return res.status(400).json({ error: `${item.name} is out of stock` });
      }
    }

    const reference = "ESC-" + Date.now();
    const trackingNumber = "TM" + Math.random().toString(36).substring(2, 8).toUpperCase();

    // Debit wallet and hold in escrow
    user.walletBalance = (user.walletBalance || 0) - Number(amount);
    user.walletTransactions.push({
      type: "debit",
      amount: Number(amount),
      description: `Escrow hold for order ${trackingNumber}`,
      reference
    });
    await user.save();

    // Deduct stock atomically
    for (const item of items) {
      await Product.findByIdAndUpdate(item._id, { $inc: { stock: -(item.quantity || 1) } });
    }

    // Create order with escrow
    const order = await Order.create({
      email: req.user.email,
      items,
      amount: Number(amount),
      originalAmount: Number(amount),
      deliveryFee: deliveryFee || 0,
      deliveryZone: deliveryZone || "",
      deliveryAddress,
      phone: phone || "",
      couponCode: couponCode || "",
      reference,
      trackingNumber,
      status: "Paid",
      paymentMethod: "TechMart Wallet",
      escrow: true,
      escrowStatus: "holding"
    });

    // Notify via socket
    io.to(order.email).emit("orderUpdated", { orderId: order._id, reference: order.reference, status: "Paid", trackingNumber });

    res.json({ success: true, order, message: `Order placed! ₦${Number(amount).toLocaleString()} held in escrow until delivery confirmed.` });
  } catch (err) {
    console.error("Escrow checkout error:", err.message);
    res.status(500).json({ error: "Checkout failed" });
  }
});

// 3. Mark order as Shipped (admin or seller)
app.post("/api/orders/:orderId/ship", auth, async (req, res) => {
  try {
    const { trackingNumber, courierName } = req.body;
    const order = await Order.findById(req.params.orderId);
    if (!order) return res.status(404).json({ error: "Order not found" });
    if (!["admin", "seller"].includes(req.user.role)) return res.status(403).json({ error: "Not authorized" });
    if (!["Paid", "Processing"].includes(order.status)) return res.status(400).json({ error: "Order cannot be marked as shipped" });

    order.status = "Shipped";
    if (trackingNumber) order.trackingNumber = trackingNumber;
    if (courierName) order.courierName = courierName;
    await order.save();

    io.to(order.email).emit("orderUpdated", { orderId: order._id, reference: order.reference, status: "Shipped", trackingNumber: order.trackingNumber });
    res.json({ success: true, order, message: "Order marked as shipped" });
  } catch (err) {
    res.status(500).json({ error: "Failed to mark as shipped" });
  }
});

// 4. Admin force release escrow (manual override)
app.post("/api/orders/:orderId/release-escrow", adminOnly, async (req, res) => {
  try {
    const order = await Order.findById(req.params.orderId);
    if (!order) return res.status(404).json({ error: "Order not found" });
    if (order.escrowStatus !== "holding") return res.status(400).json({ error: "No escrow funds to release" });

    // Credit seller wallet
    const sellerId = order.items?.[0]?.vendorId;
    if (sellerId) {
      const seller = await User.findById(sellerId);
      if (seller) {
        seller.walletBalance = (seller.walletBalance || 0) + order.amount;
        seller.walletTransactions = seller.walletTransactions || [];
        seller.walletTransactions.push({
          type: "credit",
          amount: order.amount,
          description: `Escrow released (admin) for order #${order.trackingNumber}`,
          reference: "ESC-REL-" + Date.now()
        });
        await seller.save();
      }
    }

    order.escrowStatus = "released";
    order.escrowReleasedAt = new Date();
    order.status = "Delivered";
    await order.save();

    res.json({ success: true, message: "Escrow released to seller wallet" });
  } catch (err) {
    res.status(500).json({ error: "Failed to release escrow" });
  }
});

// 5. Seller requests withdrawal from wallet
app.post("/api/seller/withdraw", sellerAuth, async (req, res) => {
  try {
    const { amount, bankCode, accountNumber, accountName, bankName } = req.body;
    if (!amount || !bankCode || !accountNumber || !accountName) return res.status(400).json({ error: "All fields are required" });
    if (Number(amount) < 1000) return res.status(400).json({ error: "Minimum seller withdrawal is ₦1,000" });
    const seller = await Seller.findById(req.seller.id);
    if (!seller) return res.status(404).json({ error: "Seller not found" });
    if ((seller.walletBalance || 0) < Number(amount)) return res.status(400).json({ error: "Insufficient wallet balance" });

    // Create payout request
    const Payout = mongoose.models.Payout || mongoose.model("Payout", new mongoose.Schema({
      sellerId: String,
      sellerName: String,
      sellerEmail: String,
      amount: Number,
      bankCode: String,
      accountNumber: String,
      accountName: String,
      bankName: String,
      status: { type: String, default: "pending" },
      reference: String,
      createdAt: { type: Date, default: Date.now }
    }));

    const reference = "PAY-" + Date.now();
    await Payout.create({
      sellerId: seller._id,
      sellerName: seller.name,
      sellerEmail: seller.email,
      amount: Number(amount),
      bankCode,
      accountNumber,
      accountName,
      bankName: bankName || "",
      reference
    });

    // Debit wallet
    seller.walletBalance = (seller.walletBalance || 0) - Number(amount);
    seller.walletTransactions.push({
      type: "debit",
      amount: Number(amount),
      description: `Withdrawal request to ${accountName} (${accountNumber})`,
      reference
    });
    await seller.save();

    res.json({ success: true, reference, message: `Withdrawal of ₦${Number(amount).toLocaleString()} requested. Processing within 24 hours.` });
  } catch (err) {
    console.error("Seller withdrawal error:", err.message);
    res.status(500).json({ error: "Withdrawal request failed" });
  }
});

// 6. Get seller wallet balance + earnings
app.get("/api/seller/wallet", sellerAuth, async (req, res) => {
  try {
    const seller = await Seller.findById(req.seller.id).select("walletBalance walletTransactions name email");
    const earnings = (seller.walletTransactions || [])
      .filter(t => t.type === "credit" && t.description?.includes("Escrow"))
      .reduce((s, t) => s + t.amount, 0);
    const withdrawn = (seller.walletTransactions || [])
      .filter(t => t.type === "debit" && t.description?.includes("Withdrawal"))
      .reduce((s, t) => s + t.amount, 0);
    res.json({
      success: true,
      balance: seller.walletBalance || 0,
      totalEarnings: earnings,
      totalWithdrawn: withdrawn,
      recentTransactions: (seller.walletTransactions || []).slice(-10).reverse()
    });
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch wallet" });
  }
});

// 7. Admin get all escrow orders
app.get("/api/admin/escrow", adminOnly, async (req, res) => {
  try {
    const orders = await Order.find({ escrow: true }).sort({ createdAt: -1 }).limit(50);
    res.json(orders);
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch escrow orders" });
  }
});


/* ===========================
   🛒 CART PERSISTENCE
=========================== */
// Add cartItems to User schema handled via existing walletTransactions pattern
// We'll store cart in a simple field

// Sync cart to server
app.post("/api/cart/sync", auth, async (req, res) => {
  try {
    const { items } = req.body;
    await User.findByIdAndUpdate(req.user.id, { savedCart: items || [], cartUpdatedAt: items && items.length > 0 ? new Date() : null, cartReminderSent: false });
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: "Failed to sync cart" });
  }
});

// Get cart from server
app.get("/api/cart", auth, async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select("savedCart");
    res.json({ items: user.savedCart || [] });
  } catch (err) {
    res.status(500).json({ error: "Failed to get cart" });
  }
});

// Clear cart on server
app.delete("/api/cart/clear", auth, async (req, res) => {
  try {
    await User.findByIdAndUpdate(req.user.id, { savedCart: [] });
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: "Failed to clear cart" });
  }
});



/* ===============================
   TERMII DEBUG (TEMPORARY)
================================ */
app.get("/api/admin/termii/debug", adminOnly, async (req, res) => {
  try {
    const response = await axios.get(
      `https://api.ng.termii.com/api/get-balance?api_key=${process.env.TERMII_API_KEY}`
    );

    res.json({
      success: true,
      workspace: response.data.application,
      user: response.data.user,
      balance: response.data.balance,
      currency: response.data.currency,
      senderId: process.env.TERMII_SENDER_ID,
      apiKeyLoaded: Boolean(process.env.TERMII_API_KEY)
    });

  } catch (err) {

    res.status(500).json({
      success: false,
      status: err.response?.status,
      data: err.response?.data,
      message: err.message
    });

  }
});


// ── Abandoned Cart Recovery Cron (runs every 15 mins) ──
cron.schedule("*/15 * * * *", async () => {
  try {
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
    const users = await User.find({
      cartUpdatedAt: { $lte: oneHourAgo },
      cartReminderSent: false,
      savedCart: { $exists: true, $ne: [] }
    }).select("name email savedCart cartUpdatedAt");

    for (const user of users) {
      if (!user.savedCart || user.savedCart.length === 0) continue;
      try {
        await sendAbandonedCartEmail(user, user.savedCart);
        await User.findByIdAndUpdate(user._id, { cartReminderSent: true });
        console.log("📧 Abandoned cart email sent to " + user.email);
      } catch (e) {
        console.error("❌ Failed to send cart email to " + user.email + ":", e.message);
      }
    }
  } catch (e) {
    console.error("❌ Abandoned cart cron error:", e.message);
  }
});

server.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});
// --- ADMIN FILE UPLOAD ROUTE INTEGRATION ---
// Product model already imported above

app.post("/api/admin/products/add", adminUploader.array("images", 5), async (req, res) => {
  try {
    let imageUrls = [];
    if (req.files && req.files.length > 0) {
      for (const file of req.files) {
        const result = await cloudinaryCloud.uploader.upload(file.path, {
          folder: "techmart_products"
        });
        imageUrls.push(result.secure_url);
      }
    } else if (req.body.images) {
      imageUrls = Array.isArray(req.body.images) ? req.body.images : [req.body.images];
    } else {
      return res.status(400).json({ message: "Product image asset is required." });
    }
    let variants = null;

    try {
      if (req.body.variants) {
        variants = JSON.parse(req.body.variants);
      }
    } catch (err) {
      console.warn("⚠️ Invalid variants JSON received.");
    }

    if (!Array.isArray(variants) || variants.length === 0) {
      variants = [{
        name: "Default",
        color: "",
        size: "",
        storage: "",
        condition: req.body.condition || "New",
        price: Number(req.body.price),
        stock: Number(req.body.stock)
      }];
    }

    const newProduct = new Product({
      name: req.body.name,
      price: Number(req.body.price),
      description: req.body.description,
      stock: Number(req.body.stock),
      category: req.body.category || "",
      condition: req.body.condition || "New",
      images: imageUrls,
      variants
    });
    await newProduct.save();
    res.status(201).json({ success: true, data: newProduct });
  } catch (error) {
    console.error("UPLOAD EXCEPTION:", error);
    res.status(500).json({ message: error.message });
  }
});
// deploy trigger




/* ===========================
   🔄 PAYSTACK RECONCILIATION (admin)
=========================== */
// Catches wallet-funding payments that succeeded on Paystack but never
// got credited (e.g. a missed/failed webhook delivery) and credits them.
app.post("/api/admin/reconcile-wallets", adminOnly, async (req, res) => {
  try {
    const response = await axios.get("https://api.paystack.co/transaction", {
      headers: { Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY}` },
      params: { perPage: 100, status: "success" }
    });
    const walletTxns = response.data.data.filter(t => t.reference.startsWith("WAL-"));
    const fixed = [];
    for (const txn of walletTxns) {
      const user = await User.findOne({ email: txn.customer.email });
      if (!user) continue;
      const alreadyCredited = (user.walletTransactions || []).some(t => t.reference === txn.reference);
      if (alreadyCredited) continue;
      const amount = txn.amount / 100;
      user.walletBalance = (user.walletBalance || 0) + amount;
      user.walletTransactions = user.walletTransactions || [];
      user.walletTransactions.push({
        type: "credit",
        amount,
        description: "Wallet funded via Paystack (reconciled)",
        reference: txn.reference,
        createdAt: new Date(txn.paid_at)
      });
      await user.save();
      fixed.push({ email: user.email, amount, reference: txn.reference });
    }
    res.json({ success: true, checked: walletTxns.length, fixed: fixed.length, details: fixed });
  } catch (err) {
    console.error("Reconciliation error:", err.message);
    res.status(500).json({ error: "Reconciliation failed" });
  }
});

/* ===========================
   ��️ GLOBAL ERROR HANDLING
=========================== */

/* ===========================
   🔄 PAYSTACK RECONCILIATION (admin)
=========================== */
// Multer-specific error handler (must come before the generic error handler)
app.use((err, req, res, next) => {
  if (err instanceof multer.MulterError) {
    if (err.code === "LIMIT_FILE_SIZE") {
      return res.status(400).json({ error: "Image too large. Maximum file size is 5MB." });
    }
    return res.status(400).json({ error: `Upload error: ${err.message}` });
  }
  if (err && err.message && err.message.includes("Only images")) {
    return res.status(400).json({ error: err.message });
  }
  next(err);
});

// Global Express error handler
app.use((err, req, res, next) => {
  console.error("🔥 Unhandled error:", err.message, err.stack);
  res.status(err.status || 500).json({
    error: process.env.NODE_ENV === "production"
      ? "An unexpected error occurred. Please try again."
      : err.message
  });
});

// 404 handler for unknown routes
app.use((req, res) => {
  res.status(404).json({ error: `Route ${req.method} ${req.path} not found` });
});

// Unhandled promise rejections
process.on("unhandledRejection", (reason, promise) => {
  console.error("🔥 Unhandled Rejection at:", promise, "reason:", reason);
});

// Uncaught exceptions
process.on("uncaughtException", (err) => {
  console.error("🔥 Uncaught Exception:", err.message);
  process.exit(1);
});

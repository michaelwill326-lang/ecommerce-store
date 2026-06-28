require("dotenv").config();

const express = require("express");
const cors = require("cors");
const mongoose = require("mongoose");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");
const axios = require("axios");
const http = require("http");
const helmet = require("helmet");
const rateLimit = require("express-rate-limit");
const { Server } = require("socket.io");
const Groq = require("groq-sdk");

const aiRoutes = require("./routes/ai");
const { sendOrderConfirmation, sendWelcomeEmail, sendShippingUpdate, sendPasswordResetEmail, sendAdminOrderNotification, sendLowStockAlert } = require("./utils/email");
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
const app = express();
app.set("trust proxy", 1);

/* ===========================
   🔒 SECURITY
=========================== */
app.use(helmet());

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 300,
  message: { error: "Too many requests, try again later." }
});

app.use(limiter);

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  message: { error: "Too many attempts, please try again in 15 minutes." }
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
app.use(express.json({ limit: "10mb" }));

/* ===========================
   🤖 AI ROUTES
=========================== */
app.use("/api/ai", aiRoutes);

/* ===========================
   🧠 DATABASE
=========================== */
mongoose
  .connect(process.env.MONGO_URI)
  .then(() => console.log("✅ MongoDB Connected"))
  .catch((err) => console.error("❌ MongoDB Error:", err));

/* ===========================
   👤 MODELS
=========================== */
const User = mongoose.model(
  "User",
  new mongoose.Schema({
    name: String,
    email: { type: String, unique: true },
    password: String,
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
    originalAmount: Number,
    couponCode: String,
    createdAt: { type: Date, default: Date.now }
  })
);

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
  if (!token) return res.status(401).json({ error: "No token" });
  try {
    req.user = jwt.verify(token, process.env.JWT_SECRET);
    next();
  } catch {
    return res.status(401).json({ error: "Invalid token" });
  }
}

function adminOnly(req, res, next) {
  const token = req.headers.authorization?.split(" ")[1];
  if (!token) return res.status(401).json({ error: "No token" });
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    if (decoded.role !== "admin") return res.status(403).json({ error: "Admin only" });
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
    const { name, email, password } = req.body;
    if (!name || !email || !password || !req.body.phone) return res.status(400).json({ error: "Name, email, password, and phone number are required" });
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) return res.status(400).json({ error: "Invalid email address" });
    if (password.length < 6) return res.status(400).json({ error: "Password must be at least 6 characters" });
    if (name.trim().length < 2) return res.status(400).json({ error: "Name must be at least 2 characters" });
    const existingUser = await User.findOne({ email });
    if (existingUser) return res.status(400).json({ error: "User already exists" });
    const hashedPassword = await bcrypt.hash(password, 10);
    const user = await User.create({ name, email, password: hashedPassword, phone: req.body.phone || "" });
    const token = jwt.sign(
      { id: user._id, email: user.email, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: "7d" }
    );

    // 📧 SEND WELCOME EMAIL
    try {
      await sendWelcomeEmail(user);
    } catch (e) {
      console.log("Welcome email failed:", e.message);
    }

    res.status(201).json({ success: true, token, user });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Signup failed" });
  }
});

/* LOGIN */
app.post("/api/auth/login", async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email });
    if (!user) return res.status(400).json({ error: "User not found" });
    const match = await bcrypt.compare(password, user.password);
    if (!match) return res.status(400).json({ error: "Wrong password" });
    const token = jwt.sign(
      { id: user._id, email: user.email, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: "7d" }
    );
    res.json({ success: true, token, user });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Login failed" });
  }
});

/* FORGOT PASSWORD */
app.post("/api/auth/forgot-password", async (req, res) => {
  try {
    const { email } = req.body;
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
   🛍 PRODUCTS
=========================== */
app.get("/api/products", async (req, res) => {
  try {
    const products = await Product.find().sort({ createdAt: -1 });
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
    const product = await Product.findByIdAndUpdate(req.params.id, req.body, { new: true });
    res.json(product);
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
    const { items, amount } = req.body;
    const order = await Order.create({
      email: req.user.email,
      items,
      amount,
      reference: "TX-" + Date.now()
    });
    res.json(order);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Order failed" });
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
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  phone: { type: String, default: "" },
  storeName: { type: String, required: true },
  storeDescription: { type: String, default: "" },
  status: { type: String, enum: ["pending", "approved", "rejected"], default: "pending" },
  commission: { type: Number, default: 10 },
  totalSales: { type: Number, default: 0 },
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
    areas: ["ikeja", "ogba", "agege", "ojota", "alausa", "oregun", "opebi", "allen", "maryland", "palmgrove", "onipanu"],
    fee: 2500
  },
  {
    zone: 2,
    name: "Mainland",
    areas: ["yaba", "mushin", "oshodi", "surulere", "isolo", "oshodi", "ilasamaja", "itire", "ketu", "mile 12", "bariga", "shomolu", "gbagada"],
    fee: 3500
  },
  {
    zone: 3,
    name: "Lagos Island & VI",
    areas: ["victoria island", "vi", "ikoyi", "lagos island", "apapa", "tincan", "obalende", "broad street", "marina"],
    fee: 4500
  },
  {
    zone: 4,
    name: "Lekki & Ajah",
    areas: ["lekki", "ajah", "sangotedo", "chevron", "vgc", "victoria garden", "abraham adesanya", "jakande", "igbo efon"],
    fee: 5500
  },
  {
    zone: 5,
    name: "Outskirts",
    areas: ["ikorodu", "badagry", "epe", "mowe", "ibafo", "sagamu", "abeokuta", "sango", "ota"],
    fee: 7500
  },
];
const FREE_DELIVERY_THRESHOLD = 150000;
const DEFAULT_FEE = 12000; // Outside Lagos

const calculateDeliveryFee = (address) => {
  if (!address) return { fee: DEFAULT_FEE, zone: "Outside Lagos" };
  const lower = address.toLowerCase();
  for (const zone of DELIVERY_ZONES) {
    if (zone.areas.some(area => lower.includes(area))) {
      return { fee: zone.fee, zone: zone.name, zoneNumber: zone.zone };
    }
  }
  return { fee: DEFAULT_FEE, zone: "Outside Lagos", zoneNumber: 6 };
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
    const { name, email, password, phone, storeName, storeDescription } = req.body;
    if (!name || !email || !password || !storeName) {
      return res.status(400).json({ error: "Name, email, password and store name are required" });
    }
    const existing = await Seller.findOne({ email });
    if (existing) return res.status(400).json({ error: "A seller account with this email already exists" });
    const hashedPassword = await bcrypt.hash(password, 10);
    const seller = await Seller.create({ name, email, password: hashedPassword, phone, storeName, storeDescription });
    res.status(201).json({ success: true, message: "Application submitted! We will review and get back to you shortly." });
  } catch (err) {
    res.status(500).json({ error: "Failed to submit application" });
  }
});

// Seller login
app.post("/api/seller/login", async (req, res) => {
  try {
    const { email, password } = req.body;
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

// Seller middleware
const sellerAuth = (req, res, next) => {
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
    if (req.files && req.files.length > 0) {
      for (const file of req.files) {
        const result = await cloudinaryCloud.uploader.upload(file.path, { folder: "techmart_products" });
        imageUrls.push(result.secure_url);
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
    res.status(201).json({ success: true, data: product });
  } catch (err) {
    res.status(500).json({ error: "Failed to add product" });
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
      .update(JSON.stringify(req.body))
      .digest("hex");

    if (hash !== req.headers["x-paystack-signature"]) {
      console.log("❌ Invalid webhook signature");
      return res.status(401).send("Invalid signature");
    }

    const event = req.body;

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
      io.emit("paymentConfirmed", { reference, email: order.email });
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

    // 📱 FETCH BUYER INFO FOR AUTOMATED TERMII SMS ALERTS
    if (order && order.email) {
      try {
        const buyer = await User.findOne({ email: order.email });
        if (buyer && buyer.phone) {
          // Dynamic runtime import to safely execute our ES module service from CommonJS
          const { sendOrderUpdate } = await import("./services/notificationService.js");
          await sendOrderUpdate(buyer.phone, buyer.name || "Customer", order._id.toString(), req.body.status);
        } else {
          console.log("⚠️ Termii Alert skipped: Buyer phone record not found for " + order.email);
        }
      } catch (smsError) {
        console.error("❌ Termii execution error inside update loop:", smsError.message);
      }
    }

    // 📧 SEND SHIPPING EMAIL
    if (req.body.status === "Shipped") {
      try {
        await sendShippingUpdate(order);
      } catch (e) {
        console.log("Shipping email failed:", e.message);
      }
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
        revenueByDate[date] = (revenueByDate[date] || 0) + o.amount;
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
    const { comment, stars } = req.body;
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
    io.emit("orderUpdated", {
      orderId: order._id,
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
  socket.on("disconnect", () => {
    console.log("❌ Disconnected:", socket.id);
  });
});

/* ===========================
   ❌ ERROR HANDLER
=========================== */
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: "Something went wrong" });
});

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
    const newProduct = new Product({
      name: req.body.name,
      price: Number(req.body.price),
      description: req.body.description,
      stock: Number(req.body.stock),
      category: req.body.category || "",
      images: imageUrls
    });
    await newProduct.save();
    res.status(201).json({ success: true, data: newProduct });
  } catch (error) {
    console.error("UPLOAD EXCEPTION:", error);
    res.status(500).json({ message: error.message });
  }
});
// deploy trigger


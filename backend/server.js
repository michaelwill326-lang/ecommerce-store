require("dotenv").config();

const express = require("express");
const cors = require("cors");
const mongoose = require("mongoose");
const stripe = require("stripe")(process.env.STRIPE_SECRET_KEY);
const http = require("http");
const { Server } = require("socket.io");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcrypt");
const { Parser } = require("json2csv");

const app = express();
const server = http.createServer(app);
const io = new Server(server, { cors: { origin: "*" } });

console.log("🚀 TechMart Server Initializing...");

app.use(cors({
  origin: "*",
  methods: ["GET","POST","PUT","DELETE"],
  allowedHeaders: ["Content-Type","Authorization"]
}));

/* ================= DATABASE ================= */

mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log("✅ TechMart Database Connected"))
  .catch(err => console.error("❌ MongoDB Error:", err));

/* ================= SCHEMAS ================= */

const adminSchema = new mongoose.Schema({
  email: { type: String, unique: true, required: true },
  password: { type: String, required: true },
  role: { type: String, default: "admin" }
});
const Admin = mongoose.model("Admin", adminSchema);

const productSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, unique: true, trim: true },
    price: { type: Number, required: true, min: 0 },
    stock: { type: Number, required: true, min: 0 }
  },
  { timestamps: true }
);
const Product = mongoose.model("Product", productSchema);

const orderSchema = new mongoose.Schema({
  customerName: { type: String, required: true },
  email: { type: String, required: true },
  address: { type: String, required: true },
  items: [{ name: String, quantity: Number, price: Number }],
  totalAmount: { type: Number, required: true },
  paymentIntentId: String,
  status: {
    type: String,
    enum: ["Pending","Processing","Shipped","Delivered","Cancelled"],
    default: "Pending"
  }
}, { timestamps: true });

const Order = mongoose.model("Order", orderSchema);

/* ================= AUTH ================= */

function requireAdmin(req, res, next) {
  const auth = req.headers.authorization || "";
  const token = auth.startsWith("Bearer ") ? auth.slice(7) : null;

  if (!token) return res.status(401).json({ message: "Missing token" });

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.admin = decoded;
    next();
  } catch {
    res.status(401).json({ message: "Invalid token" });
  }
}

/* ================= PUBLIC STORE PRODUCTS ================= */

app.get("/api/store/products", async (req, res) => {
  try {
    const products = await Product.find().sort({ createdAt: -1 });
    res.json(products);
  } catch {
    res.status(500).json({ message: "Failed to load products" });
  }
});

/* ================= ADMIN ================= */

app.post("/api/admin/register", async (req, res) => {
  try {
    const { email, password } = req.body;

    const existing = await Admin.findOne({ email });
    if (existing) return res.status(400).json({ message: "Admin already exists" });

    const hashed = await bcrypt.hash(password, 10);
    await Admin.create({ email, password: hashed });

    res.json({ message: "Admin created successfully" });
  } catch {
    res.status(500).json({ message: "Registration failed" });
  }
});

app.post("/api/admin/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    const admin = await Admin.findOne({ email });
    if (!admin) return res.status(401).json({ message: "Invalid credentials" });

    const match = await bcrypt.compare(password, admin.password);
    if (!match) return res.status(401).json({ message: "Invalid credentials" });

    const token = jwt.sign(
      { id: admin._id, role: admin.role },
      process.env.JWT_SECRET,
      { expiresIn: "7d" }
    );

    res.json({ token });
  } catch {
    res.status(500).json({ message: "Login failed" });
  }
});

/* ================= INVENTORY (ADMIN) ================= */

app.post("/api/products", requireAdmin, async (req, res) => {
  try {
    let { name, price, stock } = req.body;
    name = name.trim();
    price = Number(price);
    stock = Number(stock);

    const updated = await Product.findOneAndUpdate(
      { name },
      { $set: { price }, $inc: { stock } },
      { new: true, upsert: true }
    );

    res.json(updated);
  } catch {
    res.status(500).json({ message: "Failed to add product" });
  }
});

app.get("/api/products", requireAdmin, async (req, res) => {
  const products = await Product.find().sort({ createdAt: -1 });
  res.json(products);
});

app.put("/api/products/:id", requireAdmin, async (req, res) => {
  const updated = await Product.findByIdAndUpdate(
    req.params.id,
    { stock: req.body.stock },
    { new: true }
  );
  res.json(updated);
});

app.delete("/api/products/:id", requireAdmin, async (req, res) => {
  await Product.findByIdAndDelete(req.params.id);
  res.json({ message: "Product deleted" });
});

/* ================= ORDERS (WITH FILTERS) ================= */

app.get("/api/orders", requireAdmin, async (req, res) => {
  try {
    const page = parseInt(req.query.page || 1);
    const limit = parseInt(req.query.limit || 10);
    const search = req.query.search || "";
    const status = req.query.status || "";
    const from = req.query.from;
    const to = req.query.to;

    const filter = {};

    if (search) {
      filter.$or = [
        { customerName: { $regex: search, $options: "i" } },
        { email: { $regex: search, $options: "i" } }
      ];
    }

    if (status) filter.status = status;

    if (from || to) {
      filter.createdAt = {};
      if (from) filter.createdAt.$gte = new Date(from);
      if (to) filter.createdAt.$lte = new Date(to + "T23:59:59.999Z");
    }

    const total = await Order.countDocuments(filter);

    const orders = await Order.find(filter)
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit);

    res.json({
      orders,
      total,
      page,
      totalPages: Math.ceil(total / limit)
    });
  } catch {
    res.status(500).json({ message: "Failed to fetch orders" });
  }
});

app.put("/api/orders/:id/status", requireAdmin, async (req, res) => {
  const updated = await Order.findByIdAndUpdate(
    req.params.id,
    { status: req.body.status },
    { new: true }
  );

  io.emit("update-status", updated);
  res.json(updated);
});

/* ================= CSV EXPORT ================= */

app.get("/api/orders/export", requireAdmin, async (req, res) => {
  const orders = await Order.find();
  const fields = ["customerName","email","totalAmount","status","createdAt"];
  const parser = new Parser({ fields });

  const csv = parser.parse(orders);

  res.header("Content-Type", "text/csv");
  res.attachment("TechMart_Orders.csv");
  res.send(csv);
});

/* ================= MONTHLY REVENUE ================= */

app.get("/api/revenue/monthly", requireAdmin, async (req, res) => {
  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);

  const thisMonth = await Order.aggregate([
    { $match: { createdAt: { $gte: startOfMonth } } },
    { $group: { _id: null, total: { $sum: "$totalAmount" } } }
  ]);

  const lastMonth = await Order.aggregate([
    {
      $match: {
        createdAt: { $gte: startOfLastMonth, $lt: startOfMonth }
      }
    },
    { $group: { _id: null, total: { $sum: "$totalAmount" } } }
  ]);

  res.json({
    thisMonth: thisMonth[0]?.total || 0,
    lastMonth: lastMonth[0]?.total || 0
  });
});

/* ================= STRIPE CHECKOUT ================= */

app.post("/api/create-checkout-session", async (req, res) => {
  const { cartItems, customerName, email, address } = req.body;

  const session = await stripe.checkout.sessions.create({
    payment_method_types: ["card"],
    mode: "payment",
    line_items: cartItems.map(item => ({
      price_data: {
        currency: "usd",
        product_data: { name: item.name },
        unit_amount: Math.round(item.price * 100)
      },
      quantity: item.quantity
    })),
    customer_email: email,
    success_url: "http://localhost:3000/success",
    cancel_url: "http://localhost:3000/cancel",
    metadata: {
      store: "TechMart",
      customerName,
      address,
      cartItems: JSON.stringify(cartItems)
    }
  });

  res.json({ url: session.url });
});

/* ================= START ================= */

const PORT = process.env.PORT || 5002;
server.listen(PORT, () =>
  console.log("🚀 TechMart Server running on port " + PORT)
);
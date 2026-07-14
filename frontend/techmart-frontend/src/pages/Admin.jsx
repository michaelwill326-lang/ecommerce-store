import { useEffect, useState } from "react";
import AIInventoryForecast from "../components/AIInventoryForecast";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import {
  LineChart, Line, XAxis, YAxis,
  Tooltip, CartesianGrid, ResponsiveContainer
} from "recharts";

const API = import.meta.env.VITE_API_URL || "https://techmart-backend-ecbi.onrender.com";

const TABS = ["Dashboard", "Orders", "Products", "Users", "Reviews", "Coupons", "Sellers", "Wallets", "Flash Sales", "Payouts", "Disputes", "AI Forecast", "Fraud", "Returns", "Escrow"];

export default function Admin() {
  const navigate = useNavigate();
  const [tab, setTab] = useState("Dashboard");
  const [analytics, setAnalytics] = useState(null);
  const [orders, setOrders] = useState([]);
  const [products, setProducts] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [showAddProduct, setShowAddProduct] = useState(false);
  const [editProduct, setEditProduct] = useState(null);
  const [newProduct, setNewProduct] = useState({
    name: "", price: "", description: "", category: "", stock: "", images: [""]
  });
  const [pendingReviews, setPendingReviews] = useState([]);
  const [flaggedReviews, setFlaggedReviews] = useState([]);
  const [flaggedUsers, setFlaggedUsers] = useState([]);
  const [returns, setReturns] = useState([]);
  const [escrowOrders, setEscrowOrders] = useState([]);
  const [sentiment, setSentiment] = useState(null);
  const [reviewTab, setReviewTab] = useState("pending");
  const [coupons, setCoupons] = useState([]);
  const [sellers, setSellers] = useState([]);
  const [wallets, setWallets] = useState({ users: [], totalInCirculation: 0 });
  const [walletAction, setWalletAction] = useState({ userId: "", type: "credit", amount: "", description: "" });
  const [flashSales, setFlashSales] = useState([]);
  const [payouts, setPayouts] = useState([]);
  const [disputes, setDisputes] = useState([]);
  const [selectedDispute, setSelectedDispute] = useState(null);
  const [disputeReply, setDisputeReply] = useState("");
  const [newFlash, setNewFlash] = useState({ productId: "", salePrice: "", startTime: "", endTime: "" });
  const [flashMsg, setFlashMsg] = useState("");
  const [walletMsg, setWalletMsg] = useState("");
  const [newCoupon, setNewCoupon] = useState({ code: "", type: "percent", value: "", minOrder: "", expiresAt: "" });
  const [couponMsg, setCouponMsg] = useState("");
  const [uploading, setUploading] = useState(false);
  const [uploadPreview, setUploadPreview] = useState(null);

  const token = localStorage.getItem("token");
  const user = (() => { try { return JSON.parse(localStorage.getItem("user")); } catch { return null; } })();
  const headers = { Authorization: `Bearer ${token}` };

  useEffect(() => {
    if (!token || user?.role !== "admin") {
      navigate("/login");
      return;
    }
    fetchAll();
  }, []);

  const fetchAll = async () => {
    try {
      setLoading(true);
      const [analyticsRes, ordersRes, productsRes, usersRes, sentimentRes, pendingRes, flaggedRes, couponsRes, sellersRes, walletsRes, flashRes, payoutsRes, disputesRes] = await Promise.all([
        axios.get(`${API}/api/admin/analytics`, { headers }),
        axios.get(`${API}/api/admin/orders`, { headers }),
        axios.get(`${API}/api/products`),
        axios.get(`${API}/api/admin/users`, { headers }),
        axios.get(`${API}/api/admin/reviews/sentiment`, { headers }),
        axios.get(`${API}/api/admin/reviews/pending`, { headers }),
        axios.get(`${API}/api/admin/reviews/flagged`, { headers }),
        axios.get(`${API}/api/admin/coupons`, { headers }),
        axios.get(`${API}/api/admin/sellers`, { headers }),
        axios.get(`${API}/api/admin/wallets`, { headers }),
        axios.get(`${API}/api/admin/flash-sales`, { headers }),
        axios.get(`${API}/api/admin/payouts`, { headers }),
        axios.get(`${API}/api/admin/disputes`, { headers }),
      ]);
      setAnalytics(analyticsRes.data);
      setOrders(ordersRes.data);
      setProducts(productsRes.data);
      setUsers(usersRes.data);
      setSentiment(sentimentRes.data);
      setPendingReviews(pendingRes.data);
      setFlaggedReviews(flaggedRes.data);
      setCoupons(couponsRes?.data || []);
      setSellers(sellersRes?.data || []);
      setWallets(walletsRes?.data || { users: [], totalInCirculation: 0 });
      setFlashSales(flashRes?.data || []);
      setPayouts(payoutsRes?.data || []);
      setDisputes(disputesRes?.data || []);
      setError("");
    } catch (err) {
      setError("Failed to load admin data");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleImageUpload = async (e) => {
    const files = Array.from(e.target.files);
    if (!files.length) return;
    try {
      setUploading(true);
      const formData = new FormData();
      files.forEach(file => formData.append("images", file));
      const res = await axios.post(`${API}/api/admin/products/upload-images`, formData, {
        headers: { ...headers, "Content-Type": "multipart/form-data" },
      });
      const urls = res.data.urls;
      setNewProduct(prev => ({ ...prev, images: [...(prev.images.filter(u => u)), ...urls] }));
      setUploadPreview(urls[0]);
    } catch (err) {
      alert("Image upload failed. Please try again.");
    } finally {
      setUploading(false);
    }
  };

  const updateOrderStatus = async (id, status) => {
    try {
      await axios.put(`${API}/api/admin/orders/${id}`, { status }, { headers });
      setOrders(orders.map(o => o._id === id ? { ...o, status } : o));
    } catch (err) {
      alert("Failed to update order");
    }
  };

  const deleteProduct = async (id) => {
    if (!window.confirm("Delete this product?")) return;
    try {
      await axios.delete(`${API}/api/products/${id}`, { headers });
      setProducts(products.filter(p => p._id !== id));
    } catch (err) {
      alert("Failed to delete product");
    }
  };

  const saveProduct = async () => {
    try {
      if (editProduct) {
        const res = await axios.put(`${API}/api/products/${editProduct._id}`, newProduct, { headers });
        setProducts(products.map(p => p._id === editProduct._id ? res.data : p));
      } else {
        const res = await axios.post(`${API}/api/products`, newProduct, { headers });
        setProducts([res.data, ...products]);
      }
      setShowAddProduct(false);
      setEditProduct(null);
      setUploadPreview(null);
      setNewProduct({ name: "", price: "", description: "", category: "", stock: "", images: [""] });
    } catch (err) {
      alert("Failed to save product");
    }
  };

  const openEdit = (p) => {
    setEditProduct(p);
    setUploadPreview(p.images?.[0] || null);
    setNewProduct({
      name: p.name, price: p.price, description: p.description,
      category: p.category, stock: p.stock, images: p.images || [""]
    });
    setShowAddProduct(true);
  };

  const approveReview = async (productId, reviewId) => {
    try {
      await axios.put(`${API}/api/products/${productId}/review/${reviewId}/approve`, {}, { headers });
      setPendingReviews(pendingReviews.filter(r => r._id !== reviewId));
      setFlaggedReviews(flaggedReviews.filter(r => r._id !== reviewId));
      alert("✅ Review approved!");
    } catch (err) {
      alert("Failed to approve review");
    }
  };

  const deleteReview = async (productId, reviewId) => {
    if (!window.confirm("Delete this review?")) return;
    try {
      await axios.delete(`${API}/api/products/${productId}/review/${reviewId}`, { headers });
      setPendingReviews(pendingReviews.filter(r => r._id !== reviewId));
      setFlaggedReviews(flaggedReviews.filter(r => r._id !== reviewId));
      alert("🗑️ Review deleted!");
    } catch (err) {
      alert("Failed to delete review");
    }
  };

  const chartData = analytics?.revenueByDate
    ? Object.keys(analytics.revenueByDate).map(date => ({
        date, revenue: analytics.revenueByDate[date]
      }))
    : [];

  const getStatusColor = (status) => {
    if (status === "Paid") return "#22c55e";
    if (status === "Pending") return "#f97316";
    if (status === "Shipped") return "#3b82f6";
    if (status === "Delivered") return "#8b5cf6";
    return "#888";
  };

  if (loading) return (
    <div style={styles.centered}>
      <div style={styles.spinner} />
      <p style={{ color: "var(--text-muted)", marginTop: "16px" }}>Loading dashboard...</p>
    </div>
  );

  if (error) return (
    <div style={styles.centered}>
      <p style={{ color: "#f97316" }}>⚠️ {error}</p>
      <button onClick={fetchAll} style={styles.orangeBtn}>Retry</button>
    </div>
  );

  return (
    <div style={styles.page}>

      {/* HEADER */}
      <div style={styles.header}>
        <div>
          <h1 style={styles.title}>👑 Admin Dashboard</h1>
          <p style={styles.subtitle}>Welcome back, {user?.name}</p>
        </div>
        <button onClick={() => navigate("/")} style={styles.backBtn}>← Back to Store</button>
      </div>

      {/* TABS */}
      <div style={styles.tabRow}>
        {TABS.map(t => (
          <button
            key={t}
            onClick={() => setTab(t)}
            style={{
              ...styles.tabBtn,
              background: tab === t ? "linear-gradient(135deg, #f97316, #dc2626)" : "#1a1a1a",
              color: tab === t ? "#fff" : "#888",
              border: tab === t ? "none" : "1px solid #333",
            }}
          >
            {t === "Dashboard" && "📊 "}
            {t === "Orders" && "📦 "}
            {t === "Products" && "🛍️ "}
            {t === "Users" && "👥 "}
            {t === "Reviews" && "⭐ "}
            {t === "Fraud" && "🚨 "}
            {t === "Returns" && "↩️ "}
            {t === "Escrow" && "🔐 "}
            {t}
          </button>
        ))}
      </div>

      {/* =====================
          DASHBOARD TAB
      ===================== */}
      {tab === "Dashboard" && (
        <div>
          <div style={styles.statsGrid}>
            {[
              { label: "Total Revenue", value: `₦${analytics?.totalRevenue?.toLocaleString() || 0}`, icon: "💰", color: "#22c55e" },
              { label: "Total Orders", value: analytics?.totalOrders || 0, icon: "📦", color: "#3b82f6" },
              { label: "Total Users", value: analytics?.totalUsers || 0, icon: "👥", color: "#8b5cf6" },
              { label: "Total Products", value: products.length, icon: "🛍️", color: "#f97316" },
            ].map((s) => (
              <div key={s.label} style={styles.statCard}>
                <span style={{ fontSize: "32px" }}>{s.icon}</span>
                <div>
                  <p style={{ ...styles.statValue, color: s.color }}>{s.value}</p>
                  <p style={styles.statLabel}>{s.label}</p>
                </div>
              </div>
            ))}
          </div>

          {chartData.length > 0 && (
            <div style={styles.chartCard}>
              <h2 style={styles.sectionTitle}>📈 Revenue Over Time</h2>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#222" />
                  <XAxis dataKey="date" stroke="#888" fontSize={12} />
                  <YAxis stroke="#888" fontSize={12} />
                  <Tooltip
                    contentStyle={{ background: "var(--bg-card)", border: "1px solid var(--border-color)", borderRadius: "8px" }}
                    labelStyle={{ color: "var(--text-primary)" }}
                    formatter={(v) => [`₦${v.toLocaleString()}`, "Revenue"]}
                  />
                  <Line type="monotone" dataKey="revenue" stroke="#f97316" strokeWidth={2} dot={{ fill: "#f97316" }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          )}

          <div style={styles.tableCard}>
            <h2 style={styles.sectionTitle}>🕐 Recent Orders</h2>
            <table style={styles.table}>
              <thead>
                <tr>
                  {["Email", "Amount", "Status", "Date"].map(h => (
                    <th key={h} style={styles.th}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {analytics?.recentOrders?.map(o => (
                  <tr key={o._id} style={styles.tr}>
                    <td style={styles.td}>{o.email}</td>
                    <td style={styles.td}>₦{o.amount?.toLocaleString()}</td>
                    <td style={styles.td}>
                      <span style={{ ...styles.badge, background: getStatusColor(o.status) }}>
                        {o.status}
                      </span>
                    </td>
                    <td style={styles.td}>{new Date(o.createdAt).toLocaleDateString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* =====================
          ORDERS TAB
      ===================== */}
      {tab === "Orders" && (
        <div style={styles.tableCard}>
          <h2 style={styles.sectionTitle}>📦 All Orders ({orders.length})</h2>
          <table style={styles.table}>
            <thead>
              <tr>
                {["Email", "Address", "Phone", "Amount", "Items", "Status", "Date", "Action"].map(h => (
                  <th key={h} style={styles.th}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {orders.map(o => (
                <tr key={o._id} style={styles.tr}>
                  <td style={styles.td}>{o.email}</td>
                  <td style={styles.td}>{o.deliveryAddress || "—"}</td>
                  <td style={styles.td}>{o.phone || "—"}</td>
                  <td style={styles.td}>₦{o.amount?.toLocaleString()}</td>
                  <td style={styles.td}>{o.items?.length || 0} items</td>
                  <td style={styles.td}>
                    <span style={{ ...styles.badge, background: getStatusColor(o.status) }}>
                      {o.status}
                    </span>
                  </td>
                  <td style={styles.td}>{new Date(o.createdAt).toLocaleDateString()}</td>
                  <td style={styles.td}>
                    <select
                      value={o.status}
                      onChange={(e) => updateOrderStatus(o._id, e.target.value)}
                      style={styles.select}
                    >
                      {["Pending", "Pay on Delivery", "Paid", "Shipped", "Delivered", "Cancelled"].map(s => (
                        <option key={s} value={s}>{s}</option>
                      ))}
                    </select>
                    {o.status === "Pay on Delivery" && (
                      <button
                        onClick={async () => {
                          try {
                            const res = await axios.post(`${API}/api/admin/orders/${o._id}/send-payment-link`, {}, { headers });
                            const url = res.data.paymentUrl;
                            await navigator.clipboard.writeText(url);
                            alert(`Payment link copied to clipboard!

Send this to the customer:
${url}`);
                          } catch (err) {
                            alert("Failed to generate payment link");
                          }
                        }}
                        style={{ marginTop: "6px", width: "100%", padding: "6px 8px", background: "linear-gradient(135deg, #16a34a, #15803d)", color: "var(--text-primary)", border: "none", borderRadius: "6px", cursor: "pointer", fontSize: "11px", fontWeight: "700" }}
                      >
                        Send Payment Link
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* =====================
          PRODUCTS TAB
      ===================== */}
      {tab === "Products" && (
        <div>
          <div style={styles.tableCard}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
              <h2 style={styles.sectionTitle}>🛍️ Products ({products.length})</h2>
              <button
                onClick={() => {
                  setShowAddProduct(true);
                  setEditProduct(null);
                  setUploadPreview(null);
                  setNewProduct({ name: "", price: "", description: "", category: "", stock: "", images: [""] });
                }}
                style={styles.orangeBtn}
              >
                + Add Product
              </button>
            </div>

            {/* ADD/EDIT FORM */}
            {showAddProduct && (
              <div style={styles.formCard}>
                <h3 style={{ color: "var(--text-primary)", marginBottom: "16px" }}>
                  {editProduct ? "✏️ Edit Product" : "➕ Add New Product"}
                </h3>
                <div style={styles.formGrid}>
                  {[
                    { key: "name", placeholder: "Product Name" },
                    { key: "price", placeholder: "Price (₦)", type: "number" },
                    { key: "category", placeholder: "Category" },
                    { key: "stock", placeholder: "Stock Quantity", type: "number" },
                  ].map(f => (
                    <input
                      key={f.key}
                      type={f.type || "text"}
                      placeholder={f.placeholder}
                      value={newProduct[f.key]}
                      onChange={(e) => setNewProduct({ ...newProduct, [f.key]: e.target.value })}
                      style={styles.input}
                    />
                  ))}
                </div>
                <textarea
                  placeholder="Description"
                  value={newProduct.description}
                  onChange={(e) => setNewProduct({ ...newProduct, description: e.target.value })}
                  style={{ ...styles.input, width: "100%", height: "80px", resize: "vertical", marginBottom: "12px" }}
                />

                                {/* IMAGE UPLOAD */}
                <div style={styles.uploadWrap}>
                  <p style={styles.uploadLabel}>Product Images (up to 5)</p>
                  {newProduct.images.filter(u => u).length > 0 && (
                    <div style={{ display: "flex", flexWrap: "wrap", gap: "8px", marginBottom: "12px" }}>
                      {newProduct.images.filter(u => u).map((url, idx) => (
                        <div key={idx} style={{ position: "relative" }}>
                          <img src={url} alt={`Preview ${idx + 1}`} style={{ width: "80px", height: "80px", objectFit: "cover", borderRadius: "8px", border: "2px solid #ddd" }} />
                          <button
                            onClick={() => setNewProduct(prev => ({ ...prev, images: prev.images.filter((_, i) => i !== idx) }))}
                            style={{ position: "absolute", top: "-6px", right: "-6px", background: "red", color: "var(--text-primary)", border: "none", borderRadius: "50%", width: "20px", height: "20px", cursor: "pointer", fontSize: "12px", lineHeight: "20px", textAlign: "center", padding: 0 }}
                          >x</button>
                        </div>
                      ))}
                    </div>
                  )}
                  <label style={styles.uploadBtn}>
                    {uploading ? "Uploading..." : "Upload Images"}
                    <input
                      type="file"
                      accept="image/*"
                      multiple
                      onChange={handleImageUpload}
                      style={{ display: "none" }}
                      disabled={uploading}
                    />
                  </label>
                  <p style={{ color: "#555", fontSize: "12px", margin: "8px 0" }}>or paste image URL:</p>
                  <input
                    type="text"
                    placeholder="https://..."
                    value=""
                    onChange={(e) => {
                      if (e.target.value) setNewProduct(prev => ({ ...prev, images: [...prev.images.filter(u => u), e.target.value] }));
                    }}
                    onBlur={(e) => { e.target.value = ""; }}
                    style={{ ...styles.input, width: "100%", marginBottom: "16px" }}
                  />
                </div>

                <div style={{ display: "flex", gap: "12px" }}>
                  <button
                    onClick={saveProduct}
                    disabled={uploading}
                    style={{ ...styles.orangeBtn, opacity: uploading ? 0.7 : 1 }}
                  >
                    {editProduct ? "Save Changes" : "Add Product"}
                  </button>
                  <button
                    onClick={() => { setShowAddProduct(false); setEditProduct(null); setUploadPreview(null); }}
                    style={styles.backBtn}
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}

            <table style={styles.table}>
              <thead>
                <tr>
                  {["Image", "Name", "Price", "Category", "Stock", "Actions"].map(h => (
                    <th key={h} style={styles.th}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {products.map(p => (
                  <tr key={p._id} style={styles.tr}>
                    <td style={styles.td}>
                      <img
                        src={p.images?.[0] || "https://placehold.co/50x50?text=No+Image"}
                        alt={p.name}
                        onError={(e) => { e.target.src = "https://placehold.co/50x50?text=No+Image"; }}
                        style={{ width: "50px", height: "50px", objectFit: "cover", borderRadius: "8px" }}
                      />
                    </td>
                    <td style={styles.td}>{p.name}</td>
                    <td style={styles.td}>₦{p.price?.toLocaleString()}</td>
                    <td style={styles.td}>{p.category}</td>
                    <td style={styles.td}>
                      <span style={{ color: p.stock > 0 ? "#22c55e" : "#dc2626", fontWeight: "700" }}>
                        {p.stock}
                      </span>
                    </td>
                    <td style={styles.td}>
                      <div style={{ display: "flex", gap: "8px" }}>
                        <button onClick={() => openEdit(p)} style={styles.editBtn}>✏️ Edit</button>
                        <button onClick={() => deleteProduct(p._id)} style={styles.deleteBtn}>🗑️ Delete</button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* =====================
          USERS TAB
      ===================== */}
      {tab === "Users" && (
        <div style={styles.tableCard}>
          <h2 style={styles.sectionTitle}>👥 All Users ({users.length})</h2>
          <table style={styles.table}>
            <thead>
              <tr>
                {["Avatar", "Name", "Email", "Role", "Joined"].map(h => (
                  <th key={h} style={styles.th}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {users.map(u => (
                <tr key={u._id} style={styles.tr}>
                  <td style={styles.td}>
                    <div style={{ ...styles.avatar, width: "36px", height: "36px", fontSize: "14px" }}>
                      {u.name?.charAt(0).toUpperCase()}
                    </div>
                  </td>
                  <td style={styles.td}>{u.name}</td>
                  <td style={styles.td}>{u.email}</td>
                  <td style={styles.td}>
                    <span style={{
                      ...styles.badge,
                      background: u.role === "admin" ? "#f97316" : "#333",
                    }}>
                      {u.role}
                    </span>
                  </td>
                  <td style={styles.td}>{new Date(u.createdAt).toLocaleDateString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* =====================
          REVIEWS TAB
      ===================== */}
      {tab === "Payouts" && (
        <div>
          <h2 style={{ color: "var(--text-primary)", marginBottom: "20px" }}>Seller Payout Requests</h2>
          {payouts.length === 0 ? <p style={{ color: "var(--text-muted)" }}>No payout requests yet.</p> : (
            <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
              {payouts.map(p => (
                <div key={p._id} style={{ background: "var(--bg-card)", border: "1px solid #2a2a2a", borderRadius: "12px", padding: "16px" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: "12px" }}>
                    <div>
                      <p style={{ color: "var(--text-primary)", fontWeight: "700", fontSize: "16px", margin: "0 0 4px" }}>N{p.amount.toLocaleString()} — {p.storeName}</p>
                      <p style={{ color: "var(--text-muted)", fontSize: "13px", margin: "0 0 2px" }}>{p.bankName} | {p.accountNumber} | {p.accountName}</p>
                      <p style={{ color: "var(--text-muted)", fontSize: "12px", margin: 0 }}>{new Date(p.createdAt).toLocaleDateString()}</p>
                    </div>
                    <div style={{ display: "flex", gap: "8px", alignItems: "center", flexWrap: "wrap" }}>
                      <span style={{ padding: "4px 10px", borderRadius: "999px", fontSize: "12px", fontWeight: "700", background: p.status === "paid" ? "#0a2a1a" : p.status === "rejected" ? "#2a1010" : "#1a1a0a", color: p.status === "paid" ? "#22c55e" : p.status === "rejected" ? "#f87171" : "#fbbf24" }}>{p.status.toUpperCase()}</span>
                      {p.status === "pending" && (
                        <>
                          <button onClick={async () => {
                            const res = await axios.put(`${API}/api/admin/payouts/${p._id}`, { status: "paid" }, { headers });
                            setPayouts(payouts.map(x => x._id === p._id ? res.data.data : x));
                          }} style={{ background: "#22c55e", color: "var(--text-primary)", border: "none", borderRadius: "8px", padding: "6px 12px", cursor: "pointer", fontSize: "13px", fontWeight: "700" }}>Mark Paid</button>
                          <button onClick={async () => {
                            const note = prompt("Reason for rejection:");
                            if (!note) return;
                            const res = await axios.put(`${API}/api/admin/payouts/${p._id}`, { status: "rejected", note }, { headers });
                            setPayouts(payouts.map(x => x._id === p._id ? res.data.data : x));
                          }} style={{ background: "#dc2626", color: "var(--text-primary)", border: "none", borderRadius: "8px", padding: "6px 12px", cursor: "pointer", fontSize: "13px", fontWeight: "700" }}>Reject</button>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
      {/* =====================
          FRAUD TAB
      ===================== */}
      {tab === "Fraud" && (
        <div style={styles.tableCard}>
          <h2 style={{ color: "#f97316", marginBottom: 16 }}>🚨 Fraud Detection</h2>
          <button onClick={async () => {
            try {
              const res = await axios.get(`${API}/api/admin/fraud/flagged`, { headers });
              setFlaggedUsers(res.data);
            } catch { alert("Failed to load flagged users"); }
          }} style={{ ...styles.addBtn, marginBottom: 16 }}>Load Flagged Users</button>
          {flaggedUsers.length === 0 ? (
            <p style={{ color: "var(--text-muted)" }}>No flagged users yet. Click Load to fetch.</p>
          ) : (
            <table style={styles.table}>
              <thead><tr>
                <th style={styles.th}>User</th>
                <th style={styles.th}>Email</th>
                <th style={styles.th}>Fraud Score</th>
                <th style={styles.th}>Flags</th>
                <th style={styles.th}>Wallet</th>
                <th style={styles.th}>Actions</th>
              </tr></thead>
              <tbody>
                {flaggedUsers.map(u => (
                  <tr key={u._id}>
                    <td style={styles.td}>{u.name}</td>
                    <td style={styles.td}>{u.email}</td>
                    <td style={styles.td}>
                      <span style={{ color: u.fraudScore > 70 ? "#dc2626" : u.fraudScore > 40 ? "#f97316" : "#22c55e", fontWeight: 700 }}>
                        {u.fraudScore}
                      </span>
                    </td>
                    <td style={styles.td}>
                      {(u.fraudFlags || []).slice(-2).map((f, i) => (
                        <div key={i} style={{ fontSize: 11, color: f.severity === "high" ? "#dc2626" : "#f97316", marginBottom: 2 }}>
                          [{f.severity}] {f.reason}
                        </div>
                      ))}
                    </td>
                    <td style={styles.td}>N{(u.walletBalance || 0).toLocaleString()}</td>
                    <td style={styles.td}>
                      <button onClick={async () => {
                        await axios.post(`${API}/api/admin/fraud/clear/${u._id}`, {}, { headers });
                        setFlaggedUsers(flaggedUsers.filter(x => x._id !== u._id));
                      }} style={{ ...styles.approveBtn, marginRight: 6 }}>Clear</button>
                      <button onClick={async () => {
                        if (window.confirm("Suspend this user?")) {
                          await axios.post(`${API}/api/admin/fraud/suspend/${u._id}`, {}, { headers });
                          setFlaggedUsers(flaggedUsers.filter(x => x._id !== u._id));
                        }
                      }} style={{ ...styles.deleteBtn }}>Suspend</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}

      {/* RETURNS TAB */}
      {tab === "Returns" && (
        <div style={styles.tableCard}>
          <h2 style={{ color: "#f97316", marginBottom: 16 }}>↩️ Return Requests</h2>
          <button onClick={async () => {
            try {
              const res = await axios.get(`${API}/api/admin/returns`, { headers });
              setReturns(res.data);
            } catch { alert("Failed to load returns"); }
          }} style={{ ...styles.addBtn, marginBottom: 16 }}>Load Return Requests</button>
          {returns.length === 0 ? (
            <p style={{ color: "var(--text-muted)" }}>No return requests yet. Click Load to fetch.</p>
          ) : (
            <table style={styles.table}>
              <thead><tr>
                <th style={styles.th}>Buyer</th>
                <th style={styles.th}>Reason</th>
                <th style={styles.th}>Amount</th>
                <th style={styles.th}>Status</th>
                <th style={styles.th}>Actions</th>
              </tr></thead>
              <tbody>
                {returns.map(r => (
                  <tr key={r._id}>
                    <td style={styles.td}>{r.buyerName}<br/><span style={{color:"var(--text-muted)",fontSize:11}}>{r.buyerEmail}</span></td>
                    <td style={styles.td}>{r.reason}<br/><span style={{color:"var(--text-muted)",fontSize:11}}>{r.description}</span></td>
                    <td style={styles.td}>N{(r.refundAmount||0).toLocaleString()}</td>
                    <td style={styles.td}>
                      <span style={{color: r.status==="approved"?"#22c55e":r.status==="rejected"?"#dc2626":"#f97316", fontWeight:700}}>{r.status}</span>
                    </td>
                    <td style={styles.td}>
                      {r.status === "pending" && (<>
                        <button onClick={async () => {
                          await axios.put(`${API}/api/admin/returns/${r._id}`, { status: "approved", refundAmount: r.refundAmount }, { headers });
                          setReturns(returns.map(x => x._id === r._id ? {...x, status: "approved"} : x));
                        }} style={{...styles.approveBtn, marginRight:6}}>Approve & Refund</button>
                        <button onClick={async () => {
                          const note = prompt("Reason for rejection:");
                          await axios.put(`${API}/api/admin/returns/${r._id}`, { status: "rejected", adminNote: note }, { headers });
                          setReturns(returns.map(x => x._id === r._id ? {...x, status: "rejected"} : x));
                        }} style={styles.deleteBtn}>Reject</button>
                      </>)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}

      {tab === "AI Forecast" && (
        <div>
          <h2 style={{ color: "var(--text-primary)", marginBottom: "8px" }}>AI Inventory Forecast</h2>
          <p style={{ color: "var(--text-muted)", marginBottom: "20px" }}>AI analyzes your sales velocity to predict stockouts and suggest reorder quantities.</p>
          <AIInventoryForecast headers={headers} />
        </div>
      )}
      {tab === "Disputes" && (
        <div>
          <h2 style={{ color: "var(--text-primary)", marginBottom: "20px" }}>Customer Disputes</h2>
          {selectedDispute ? (
            <div>
              <button onClick={() => setSelectedDispute(null)} style={{ background: "var(--bg-card)", border: "1px solid var(--border-color)", color: "var(--text-primary)", padding: "8px 16px", borderRadius: "8px", cursor: "pointer", marginBottom: "16px" }}>Back</button>
              <div style={{ background: "var(--bg-card)", border: "1px solid #2a2a2a", borderRadius: "12px", padding: "16px", marginBottom: "16px" }}>
                <h3 style={{ color: "var(--text-primary)", margin: "0 0 8px" }}>{selectedDispute.subject}</h3>
                <p style={{ color: "var(--text-muted)", fontSize: "13px", margin: "0 0 4px" }}>Customer: {selectedDispute.customerEmail}</p>
                <p style={{ color: "var(--text-muted)", fontSize: "13px", margin: 0 }}>Seller: {selectedDispute.sellerName}</p>
                <div style={{ display: "flex", gap: "8px", marginTop: "12px" }}>
                  {["resolved", "closed"].map(s => (
                    <button key={s} onClick={async () => {
                      const res = await axios.put(`${API}/api/admin/disputes/${selectedDispute._id}`, { status: s }, { headers });
                      setSelectedDispute(res.data.data);
                      setDisputes(disputes.map(d => d._id === selectedDispute._id ? res.data.data : d));
                    }} style={{ padding: "6px 14px", background: s === "resolved" ? "#22c55e" : "#333", color: "var(--text-primary)", border: "none", borderRadius: "8px", cursor: "pointer", fontSize: "13px", fontWeight: "700" }}>{s.charAt(0).toUpperCase() + s.slice(1)}</button>
                  ))}
                </div>
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: "10px", marginBottom: "16px" }}>
                {selectedDispute.messages.map((m, i) => (
                  <div key={i} style={{ background: "var(--bg-card)", border: "1px solid var(--border-color)", borderRadius: "10px", padding: "12px" }}>
                    <p style={{ color: "#f97316", fontSize: "11px", fontWeight: "700", margin: "0 0 4px" }}>{m.sender} ({m.senderType})</p>
                    <p style={{ color: "var(--text-primary)", fontSize: "14px", margin: 0 }}>{m.message}</p>
                  </div>
                ))}
              </div>
              <div style={{ display: "flex", gap: "8px" }}>
                <input value={disputeReply} onChange={e => setDisputeReply(e.target.value)} placeholder="Admin response..." style={{ flex: 1, padding: "10px 14px", background: "var(--bg-secondary)", border: "1px solid var(--border-color)", borderRadius: "8px", color: "var(--text-primary)", outline: "none" }} />
                <button onClick={async () => {
                  if (!disputeReply.trim()) return;
                  const res = await axios.post(`${API}/api/disputes/${selectedDispute._id}/reply`, { message: disputeReply, sender: "TechMart Admin", senderType: "admin" });
                  setSelectedDispute(res.data.data);
                  setDisputeReply("");
                }} style={{ padding: "10px 20px", background: "linear-gradient(135deg, #f97316, #dc2626)", color: "var(--text-primary)", border: "none", borderRadius: "8px", cursor: "pointer", fontWeight: "700" }}>Send</button>
              </div>
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
              {disputes.length === 0 ? <p style={{ color: "var(--text-muted)" }}>No disputes yet.</p> : disputes.map(d => (
                <div key={d._id} onClick={() => setSelectedDispute(d)} style={{ background: "var(--bg-card)", border: "1px solid #2a2a2a", borderRadius: "12px", padding: "16px", cursor: "pointer" }}>
                  <div style={{ display: "flex", justifyContent: "space-between" }}>
                    <p style={{ color: "var(--text-primary)", fontWeight: "700", margin: "0 0 4px" }}>{d.subject}</p>
                    <span style={{ padding: "2px 8px", borderRadius: "999px", fontSize: "11px", fontWeight: "700", background: d.status === "resolved" ? "#0a2a1a" : "#2a1a0a", color: d.status === "resolved" ? "#22c55e" : "#fbbf24" }}>{d.status}</span>
                  </div>
                  <p style={{ color: "var(--text-muted)", fontSize: "13px", margin: 0 }}>{d.customerEmail} vs {d.sellerName}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
      {tab === "Flash Sales" && (
        <div>
          <h2 style={{ color: "var(--text-primary)", marginBottom: "20px" }}>Flash Sales</h2>
          <div style={{ background: "var(--bg-card)", border: "1px solid #2a2a2a", borderRadius: "12px", padding: "20px", marginBottom: "24px" }}>
            <h3 style={{ color: "#f97316", marginBottom: "16px" }}>Create Flash Sale</h3>
            {flashMsg && <p style={{ color: flashMsg.includes("success") ? "#22c55e" : "#f87171", marginBottom: "12px" }}>{flashMsg}</p>}
            <div style={{ display: "flex", flexWrap: "wrap", gap: "12px", marginBottom: "16px" }}>
              <select value={newFlash.productId} onChange={e => setNewFlash({...newFlash, productId: e.target.value})}
                style={{ ...styles.input, flex: "1", minWidth: "200px" }}>
                <option value="">Select Product</option>
                {products.map(p => <option key={p._id} value={p._id}>{p.name} - N{p.price?.toLocaleString()}</option>)}
              </select>
              <input placeholder="Sale Price (N)" type="number" value={newFlash.salePrice}
                onChange={e => setNewFlash({...newFlash, salePrice: e.target.value})}
                style={{ ...styles.input, minWidth: "150px" }} />
              <input placeholder="Start Time" type="datetime-local" value={newFlash.startTime}
                onChange={e => setNewFlash({...newFlash, startTime: e.target.value})}
                style={{ ...styles.input, minWidth: "180px", colorScheme: "dark" }} />
              <input placeholder="End Time" type="datetime-local" value={newFlash.endTime}
                onChange={e => setNewFlash({...newFlash, endTime: e.target.value})}
                style={{ ...styles.input, minWidth: "180px", colorScheme: "dark" }} />
            </div>
            <button onClick={async () => {
              setFlashMsg("");
              if (!newFlash.productId || !newFlash.salePrice || !newFlash.startTime || !newFlash.endTime) {
                setFlashMsg("All fields are required"); return;
              }
              try {
                const res = await axios.post(`${API}/api/admin/flash-sales`, newFlash, { headers });
                setFlashSales([res.data.data, ...flashSales]);
                setNewFlash({ productId: "", salePrice: "", startTime: "", endTime: "" });
                setFlashMsg("success: Flash sale created!");
              } catch (err) { setFlashMsg(err.response?.data?.error || "Failed to create flash sale"); }
            }} style={styles.orangeBtn}>Create Flash Sale</button>
          </div>
          <div style={{ background: "var(--bg-card)", border: "1px solid #2a2a2a", borderRadius: "12px", padding: "20px" }}>
            <h3 style={{ color: "#f97316", marginBottom: "16px" }}>Active & Upcoming Sales</h3>
            {flashSales.length === 0 ? <p style={{ color: "var(--text-muted)" }}>No flash sales yet.</p> : (
              <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                {flashSales.map(s => {
                  const now = new Date();
                  const isActive = new Date(s.startTime) <= now && new Date(s.endTime) >= now;
                  const isExpired = new Date(s.endTime) < now;
                  const discount = Math.round(((s.originalPrice - s.salePrice) / s.originalPrice) * 100);
                  return (
                    <div key={s._id} style={{ background: "var(--bg-secondary)", borderRadius: "10px", padding: "16px", display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "12px" }}>
                      <div>
                        <p style={{ color: "var(--text-primary)", fontWeight: "700", margin: "0 0 4px" }}>{s.productName}</p>
                        <p style={{ color: "var(--text-muted)", fontSize: "13px", margin: "0 0 4px" }}>
                          <span style={{ textDecoration: "line-through" }}>N{s.originalPrice?.toLocaleString()}</span>
                          {" → "}
                          <span style={{ color: "#f97316", fontWeight: "700" }}>N{s.salePrice?.toLocaleString()}</span>
                          {" "}
                          <span style={{ color: "#22c55e" }}>{discount}% off</span>
                        </p>
                        <p style={{ color: "var(--text-muted)", fontSize: "12px", margin: 0 }}>
                          {new Date(s.startTime).toLocaleString()} → {new Date(s.endTime).toLocaleString()}
                        </p>
                      </div>
                      <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
                        <span style={{ padding: "4px 10px", borderRadius: "999px", fontSize: "12px", fontWeight: "700", background: isActive ? "#0a2a1a" : isExpired ? "#2a1010" : "#1a1a0a", color: isActive ? "#22c55e" : isExpired ? "#f87171" : "#fbbf24" }}>
                          {isActive ? "LIVE" : isExpired ? "EXPIRED" : "UPCOMING"}
                        </span>
                        <button onClick={async () => {
                          if (!window.confirm("Delete this flash sale?")) return;
                          await axios.delete(`${API}/api/admin/flash-sales/${s._id}`, { headers });
                          setFlashSales(flashSales.filter(x => x._id !== s._id));
                        }} style={{ background: "#dc2626", color: "var(--text-primary)", border: "none", borderRadius: "8px", padding: "6px 12px", cursor: "pointer", fontSize: "13px" }}>Delete</button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}
      {tab === "Wallets" && (
        <div>
          <h2 style={{ color: "var(--text-primary)", marginBottom: "8px" }}>Wallet Management</h2>
          <p style={{ color: "var(--text-muted)", marginBottom: "20px" }}>Total in circulation: <span style={{ color: "#f97316", fontWeight: "700" }}>₦{(wallets.totalInCirculation || 0).toLocaleString()}</span></p>

          {/* Manual Credit/Debit */}
          <div style={{ background: "var(--bg-card)", border: "1px solid #2a2a2a", borderRadius: "12px", padding: "20px", marginBottom: "24px" }}>
            <h3 style={{ color: "#f97316", marginBottom: "16px" }}>Manual Wallet Adjustment</h3>
            {walletMsg && <p style={{ color: walletMsg.includes("success") ? "#22c55e" : "#f87171", marginBottom: "12px" }}>{walletMsg}</p>}
            <div style={{ display: "flex", flexWrap: "wrap", gap: "12px", marginBottom: "12px" }}>
              <select value={walletAction.userId} onChange={e => setWalletAction({...walletAction, userId: e.target.value})}
                style={{ ...styles.input, flex: "1", minWidth: "200px" }}>
                <option value="">Select User</option>
                {wallets.users.map(u => <option key={u._id} value={u._id}>{u.name} - ₦{u.walletBalance.toLocaleString()}</option>)}
              </select>
              <select value={walletAction.type} onChange={e => setWalletAction({...walletAction, type: e.target.value})}
                style={{ ...styles.input, minWidth: "120px" }}>
                <option value="credit">Credit</option>
                <option value="debit">Debit</option>
              </select>
              <input placeholder="Amount (₦)" type="number" value={walletAction.amount}
                onChange={e => setWalletAction({...walletAction, amount: e.target.value})}
                style={{ ...styles.input, minWidth: "120px" }} />
              <input placeholder="Description" value={walletAction.description}
                onChange={e => setWalletAction({...walletAction, description: e.target.value})}
                style={{ ...styles.input, flex: "1", minWidth: "200px" }} />
            </div>
            <button onClick={async () => {
              setWalletMsg("");
              if (!walletAction.userId || !walletAction.amount) { setWalletMsg("Please select user and enter amount"); return; }
              try {
                const res = await axios.post(`${API}/api/admin/wallets/${walletAction.userId}`, walletAction, { headers });
                setWalletMsg(`success: Wallet updated! New balance: ₦${res.data.newBalance.toLocaleString()}`);
                const walletsRes = await axios.get(`${API}/api/admin/wallets`, { headers });
                setWallets(walletsRes.data);
              } catch (err) { setWalletMsg(err.response?.data?.error || "Failed to update wallet"); }
            }} style={styles.orangeBtn}>Apply</button>
          </div>

          {/* Wallet List */}
          <div style={{ background: "var(--bg-card)", border: "1px solid #2a2a2a", borderRadius: "12px", padding: "20px" }}>
            <h3 style={{ color: "#f97316", marginBottom: "16px" }}>Customer Wallets</h3>
            {wallets.users.length === 0 ? <p style={{ color: "var(--text-muted)" }}>No wallets with balance yet.</p> : (
              <table style={styles.table}>
                <thead><tr>
                  <th style={styles.th}>Customer</th>
                  <th style={styles.th}>Email</th>
                  <th style={styles.th}>Balance</th>
                  <th style={styles.th}>Transactions</th>
                </tr></thead>
                <tbody>
                  {wallets.users.map(u => (
                    <tr key={u._id}>
                      <td style={styles.td}>{u.name}</td>
                      <td style={styles.td}>{u.email}</td>
                      <td style={styles.td}><strong style={{ color: "#f97316" }}>₦{u.walletBalance.toLocaleString()}</strong></td>
                      <td style={styles.td}>{u.walletTransactions?.length || 0}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      )}
      {tab === "Sellers" && (
        <div>
          <h2 style={{ color: "var(--text-primary)", marginBottom: "20px" }}>Seller Applications</h2>
          {sellers.length === 0 ? (
            <p style={{ color: "var(--text-muted)" }}>No seller applications yet.</p>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
              {sellers.map(s => (
                <div key={s._id} style={{ background: "var(--bg-card)", border: "1px solid #2a2a2a", borderRadius: "12px", padding: "20px" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: "12px" }}>
                    <div>
                      <p style={{ color: "var(--text-primary)", fontWeight: "700", fontSize: "16px", margin: "0 0 4px" }}>{s.storeName}</p>
                      <p style={{ color: "var(--text-muted)", fontSize: "13px", margin: "0 0 4px" }}>{s.name} - {s.email}</p>
                      <p style={{ color: "var(--text-muted)", fontSize: "13px", margin: "0 0 8px" }}>{s.phone}</p>
                      {s.storeDescription && <p style={{ color: "var(--text-secondary)", fontSize: "13px", margin: "0 0 8px" }}>{s.storeDescription}</p>}
                      <span style={{
                        padding: "4px 12px", borderRadius: "999px", fontSize: "12px", fontWeight: "700",
                        background: s.status === "approved" ? "#0a2a1a" : s.status === "rejected" ? "#2a1010" : "#1a1a0a",
                        color: s.status === "approved" ? "#22c55e" : s.status === "rejected" ? "#f87171" : "#fbbf24",
                        border: `1px solid ${s.status === "approved" ? "#22c55e" : s.status === "rejected" ? "#dc2626" : "#f59e0b"}`
                      }}>{s.status.toUpperCase()}</span>
                    </div>
                    <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
                      {s.status !== "approved" && (
                        <button onClick={async () => {
                          const res = await axios.put(`${API}/api/admin/sellers/${s._id}`, { status: "approved" }, { headers });
                          setSellers(sellers.map(x => x._id === s._id ? res.data.data : x));
                        }} style={{ background: "#22c55e", color: "var(--text-primary)", border: "none", borderRadius: "8px", padding: "8px 16px", cursor: "pointer", fontWeight: "700", fontSize: "13px" }}>Approve</button>
                      )}
                      <button onClick={async () => {
                        const res = await axios.put(`${API}/api/admin/sellers/${s._id}/verify`, { verified: !s.verified }, { headers });
                        setSellers(sellers.map(x => x._id === s._id ? res.data.data : x));
                      }} style={{ background: s.verified ? "#1d4ed8" : "#333", color: "var(--text-primary)", border: "none", borderRadius: "8px", padding: "8px 16px", cursor: "pointer", fontWeight: "700", fontSize: "13px" }}>{s.verified ? "Unverify" : "Verify"}</button>
                      <button onClick={async () => {
                        const commission = prompt("Set commission % (current: " + (s.commission || 10) + "%):");
                        if (!commission) return;
                        const res = await axios.put(`${API}/api/admin/sellers/${s._id}/commission`, { commission }, { headers });
                        setSellers(sellers.map(x => x._id === s._id ? res.data.data : x));
                      }} style={{ background: "#f59e0b", color: "var(--text-primary)", border: "none", borderRadius: "8px", padding: "8px 16px", cursor: "pointer", fontWeight: "700", fontSize: "13px" }}>Commission</button>
                      {s.status !== "rejected" && (
                        <button onClick={async () => {
                          const res = await axios.put(`${API}/api/admin/sellers/${s._id}`, { status: "rejected" }, { headers });
                          setSellers(sellers.map(x => x._id === s._id ? res.data.data : x));
                        }} style={{ background: "#f59e0b", color: "var(--text-primary)", border: "none", borderRadius: "8px", padding: "8px 16px", cursor: "pointer", fontWeight: "700", fontSize: "13px" }}>Reject</button>
                      )}
                      <button onClick={async () => {
                        if (!window.confirm("Delete this seller?")) return;
                        await axios.delete(`${API}/api/admin/sellers/${s._id}`, { headers });
                        setSellers(sellers.filter(x => x._id !== s._id));
                      }} style={{ background: "#dc2626", color: "var(--text-primary)", border: "none", borderRadius: "8px", padding: "8px 16px", cursor: "pointer", fontWeight: "700", fontSize: "13px" }}>Delete</button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
      {tab === "Coupons" && (
        <div>
          <h2 style={{ color: "var(--text-primary)", marginBottom: "20px" }}>Coupon Codes</h2>
          {/* Create Coupon Form */}
          <div style={{ background: "var(--bg-card)", borderRadius: "12px", padding: "20px", marginBottom: "24px" }}>
            <h3 style={{ color: "#f97316", marginBottom: "16px" }}>Create New Coupon</h3>
            {couponMsg && <p style={{ color: couponMsg.startsWith("Error") ? "red" : "green", marginBottom: "12px" }}>{couponMsg}</p>}
            <div style={{ display: "flex", flexWrap: "wrap", gap: "12px", marginBottom: "16px" }}>
              <input placeholder="Code (e.g. WELCOME10)" value={newCoupon.code}
                onChange={e => setNewCoupon({ ...newCoupon, code: e.target.value.toUpperCase() })}
                style={{ ...styles.input, flex: "1", minWidth: "140px" }} />
              <select value={newCoupon.type} onChange={e => setNewCoupon({ ...newCoupon, type: e.target.value })}
                style={{ ...styles.input, flex: "1", minWidth: "120px" }}>
                <option value="percent">Percent (%)</option>
                <option value="fixed">Fixed (₦)</option>
              </select>
              <input placeholder={newCoupon.type === "percent" ? "Value (e.g. 10)" : "Value in ₦"} value={newCoupon.value}
                onChange={e => setNewCoupon({ ...newCoupon, value: e.target.value })}
                type="number" style={{ ...styles.input, flex: "1", minWidth: "120px" }} />
              <input placeholder="Min order (₦)" value={newCoupon.minOrder}
                onChange={e => setNewCoupon({ ...newCoupon, minOrder: e.target.value })}
                type="number" style={{ ...styles.input, flex: "1", minWidth: "120px" }} />
              <input placeholder="Expires (optional)" value={newCoupon.expiresAt}
                onChange={e => setNewCoupon({ ...newCoupon, expiresAt: e.target.value })}
                type="date" style={{ ...styles.input, flex: "1", minWidth: "140px" }} />
            </div>
            <button onClick={async () => {
              setCouponMsg("");
              if (!newCoupon.code || !newCoupon.value) { setCouponMsg("Error: Code and value are required"); return; }
              try {
                const res = await axios.post(`${API}/api/admin/coupons`, { ...newCoupon, value: Number(newCoupon.value), minOrder: Number(newCoupon.minOrder) || 0 }, { headers });
                setCoupons([res.data.data, ...coupons]);
                setNewCoupon({ code: "", type: "percent", value: "", minOrder: "", expiresAt: "" });
                setCouponMsg("Coupon created successfully!");
              } catch (err) { setCouponMsg("Error: " + (err.response?.data?.error || "Failed to create coupon")); }
            }} style={styles.orangeBtn}>Create Coupon</button>
          </div>
          {/* Coupons Table */}
          <div style={{ background: "var(--bg-card)", borderRadius: "12px", padding: "20px" }}>
            <h3 style={{ color: "#f97316", marginBottom: "16px" }}>Active Coupons</h3>
            {coupons.length === 0 ? <p style={{ color: "var(--text-muted)" }}>No coupons yet.</p> : (
              <table style={styles.table}>
                <thead><tr>
                  <th style={styles.th}>Code</th>
                  <th style={styles.th}>Type</th>
                  <th style={styles.th}>Value</th>
                  <th style={styles.th}>Min Order</th>
                  <th style={styles.th}>Expires</th>
                  <th style={styles.th}>Action</th>
                </tr></thead>
                <tbody>
                  {coupons.map(c => (
                    <tr key={c._id}>
                      <td style={styles.td}><strong style={{ color: "#f97316" }}>{c.code}</strong></td>
                      <td style={styles.td}>{c.type === "percent" ? "%" : "₦"}</td>
                      <td style={styles.td}>{c.type === "percent" ? `${c.value}%` : `₦${c.value.toLocaleString()}`}</td>
                      <td style={styles.td}>₦{(c.minOrder || 0).toLocaleString()}</td>
                      <td style={styles.td}>{c.expiresAt ? new Date(c.expiresAt).toLocaleDateString() : "Never"}</td>
                      <td style={styles.td}>
                        <button onClick={async () => {
                          if (!window.confirm("Delete this coupon?")) return;
                          await axios.delete(`${API}/api/admin/coupons/${c._id}`, { headers });
                          setCoupons(coupons.filter(x => x._id !== c._id));
                        }} style={{ background: "red", color: "var(--text-primary)", border: "none", borderRadius: "6px", padding: "4px 10px", cursor: "pointer" }}>Delete</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      )}
      {tab === "Reviews" && (
        <div>
          {sentiment && (
            <div style={styles.tableCard}>
              <h2 style={styles.sectionTitle}>🧠 Sentiment Analysis</h2>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(180px, 1fr))", gap: "16px", marginBottom: "24px" }}>
                {[
                  { label: "Positive", value: sentiment.stats.positive, color: "#22c55e", emoji: "😊" },
                  { label: "Neutral", value: sentiment.stats.neutral, color: "var(--text-muted)", emoji: "😐" },
                  { label: "Negative", value: sentiment.stats.negative, color: "#dc2626", emoji: "😞" },
                  { label: "Total Reviews", value: sentiment.stats.total, color: "#f97316", emoji: "⭐" },
                ].map(s => (
                  <div key={s.label} style={{ background: "var(--bg-secondary)", border: "1px solid var(--border-light)", borderRadius: "12px", padding: "16px", textAlign: "center" }}>
                    <p style={{ fontSize: "28px", margin: 0 }}>{s.emoji}</p>
                    <p style={{ color: s.color, fontSize: "24px", fontWeight: "800", margin: "8px 0 4px" }}>{s.value}</p>
                    <p style={{ color: "var(--text-muted)", fontSize: "13px", margin: 0 }}>{s.label}</p>
                  </div>
                ))}
              </div>
              {sentiment.productSentiments.length > 0 && (
                <>
                  <h3 style={{ color: "var(--text-primary)", fontSize: "15px", fontWeight: "700", marginBottom: "16px" }}>Product Sentiment Rankings</h3>
                  <table style={styles.table}>
                    <thead>
                      <tr>
                        {["Product", "😊 Positive", "😐 Neutral", "😞 Negative", "Score", "Total"].map(h => (
                          <th key={h} style={styles.th}>{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {sentiment.productSentiments.map((p, i) => (
                        <tr key={i} style={styles.tr}>
                          <td style={styles.td}>{p.name}</td>
                          <td style={{ ...styles.td, color: "#22c55e" }}>{p.positive}</td>
                          <td style={{ ...styles.td, color: "var(--text-muted)" }}>{p.neutral}</td>
                          <td style={{ ...styles.td, color: "#dc2626" }}>{p.negative}</td>
                          <td style={styles.td}>
                            <span style={{ ...styles.badge, background: p.score > 0 ? "#22c55e" : p.score < 0 ? "#dc2626" : "#333" }}>
                              {p.score > 0 ? "+" : ""}{p.score}%
                            </span>
                          </td>
                          <td style={styles.td}>{p.total}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </>
              )}
            </div>
          )}

          <div style={styles.tableCard}>
            <h2 style={styles.sectionTitle}>🛡️ Review Moderation</h2>
            <div style={{ display: "flex", gap: "10px", marginBottom: "20px" }}>
              {["pending", "flagged"].map(t => (
                <button
                  key={t}
                  onClick={() => setReviewTab(t)}
                  style={{
                    padding: "8px 18px", borderRadius: "8px", fontSize: "13px", fontWeight: "600", cursor: "pointer",
                    background: reviewTab === t ? "linear-gradient(135deg, #f97316, #dc2626)" : "#1a1a1a",
                    color: reviewTab === t ? "#fff" : "#888",
                    border: reviewTab === t ? "none" : "1px solid #333",
                  }}
                >
                  {t === "pending" ? `⏳ Pending (${pendingReviews.length})` : `⚑ Flagged (${flaggedReviews.length})`}
                </button>
              ))}
            </div>

            {reviewTab === "pending" && (
              pendingReviews.length === 0 ? (
                <p style={{ color: "var(--text-muted)", textAlign: "center", padding: "40px 0" }}>✅ No pending reviews!</p>
              ) : (
                pendingReviews.map((r, i) => (
                  <div key={i} style={{ background: "var(--bg-secondary)", border: "1px solid var(--border-light)", borderRadius: "12px", padding: "16px", marginBottom: "12px" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: "12px" }}>
                      <div style={{ flex: 1 }}>
                        <p style={{ color: "#f97316", fontWeight: "700", fontSize: "14px", margin: "0 0 4px" }}>{r.productName}</p>
                        <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "4px" }}>
                          <p style={{ color: "var(--text-primary)", fontWeight: "600", fontSize: "13px", margin: 0 }}>{r.user}</p>
                          {r.verified && <span style={{ background: "#0a2a1a", border: "1px solid #22c55e", color: "#22c55e", padding: "2px 8px", borderRadius: "999px", fontSize: "11px" }}>✅ Verified</span>}
                        </div>
                        <div style={{ display: "flex", gap: "2px", marginBottom: "8px" }}>
                          {[1,2,3,4,5].map(s => (
                            <span key={s} style={{ color: s <= r.stars ? "#f97316" : "#333", fontSize: "14px" }}>★</span>
                          ))}
                        </div>
                        <p style={{ color: "var(--text-secondary)", fontSize: "14px", margin: "0 0 8px" }}>{r.comment}</p>
                        <span style={{ color: r.sentiment === "positive" ? "#22c55e" : r.sentiment === "negative" ? "#dc2626" : "#888", fontSize: "12px", fontWeight: "600" }}>
                          🧠 {r.sentiment}
                        </span>
                      </div>
                      <div style={{ display: "flex", gap: "8px", flexShrink: 0 }}>
                        <button onClick={() => approveReview(r.productId, r._id)} style={styles.editBtn}>✅ Approve</button>
                        <button onClick={() => deleteReview(r.productId, r._id)} style={styles.deleteBtn}>🗑️ Delete</button>
                      </div>
                    </div>
                  </div>
                ))
              )
            )}

            {reviewTab === "flagged" && (
              flaggedReviews.length === 0 ? (
                <p style={{ color: "var(--text-muted)", textAlign: "center", padding: "40px 0" }}>✅ No flagged reviews!</p>
              ) : (
                flaggedReviews.map((r, i) => (
                  <div key={i} style={{ background: "#2a1010", border: "1px solid #dc2626", borderRadius: "12px", padding: "16px", marginBottom: "12px" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: "12px" }}>
                      <div style={{ flex: 1 }}>
                        <p style={{ color: "#f97316", fontWeight: "700", fontSize: "14px", margin: "0 0 4px" }}>{r.productName}</p>
                        <p style={{ color: "var(--text-primary)", fontWeight: "600", fontSize: "13px", margin: "0 0 8px" }}>{r.user}</p>
                        <div style={{ display: "flex", gap: "2px", marginBottom: "8px" }}>
                          {[1,2,3,4,5].map(s => (
                            <span key={s} style={{ color: s <= r.stars ? "#f97316" : "#333", fontSize: "14px" }}>★</span>
                          ))}
                        </div>
                        <p style={{ color: "var(--text-secondary)", fontSize: "14px", margin: "0 0 8px" }}>{r.comment}</p>
                        <span style={{ color: r.sentiment === "positive" ? "#22c55e" : r.sentiment === "negative" ? "#dc2626" : "#888", fontSize: "12px", fontWeight: "600" }}>
                          🧠 {r.sentiment}
                        </span>
                      </div>
                      <div style={{ display: "flex", gap: "8px", flexShrink: 0 }}>
                        <button onClick={() => approveReview(r.productId, r._id)} style={styles.editBtn}>✅ Approve</button>
                        <button onClick={() => deleteReview(r.productId, r._id)} style={styles.deleteBtn}>🗑️ Delete</button>
                      </div>
                    </div>
                  </div>
                ))
              )
            )}
          </div>
        </div>
      )}

    </div>
  );
}

const styles = {
  page: { maxWidth: "1200px", margin: "0 auto", padding: "32px 16px", minHeight: "100vh" },
  centered: { display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", minHeight: "70vh", gap: "16px" },
  header: { display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "32px", flexWrap: "wrap", gap: "16px" },
  title: { color: "var(--text-primary)", fontSize: "28px", fontWeight: "800", margin: 0 },
  subtitle: { color: "var(--text-muted)", fontSize: "14px", marginTop: "4px" },
  backBtn: { background: "var(--bg-card)", border: "1px solid var(--border-color)", color: "var(--text-primary)", padding: "10px 18px", borderRadius: "8px", cursor: "pointer", fontSize: "14px" },
  tabRow: { display: "flex", gap: "10px", marginBottom: "32px", flexWrap: "wrap" },
  tabBtn: { padding: "10px 20px", borderRadius: "10px", fontSize: "14px", fontWeight: "600", cursor: "pointer" },
  statsGrid: { display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))", gap: "16px", marginBottom: "32px" },
  statCard: { background: "var(--bg-card)", border: "1px solid #2a2a2a", borderRadius: "16px", padding: "24px", display: "flex", alignItems: "center", gap: "16px" },
  statValue: { fontSize: "24px", fontWeight: "800", margin: 0 },
  statLabel: { color: "var(--text-muted)", fontSize: "13px", margin: 0 },
  chartCard: { background: "var(--bg-card)", border: "1px solid #2a2a2a", borderRadius: "16px", padding: "24px", marginBottom: "24px" },
  tableCard: { background: "var(--bg-card)", border: "1px solid #2a2a2a", borderRadius: "16px", padding: "24px", marginBottom: "24px", overflowX: "auto" },
  sectionTitle: { color: "var(--text-primary)", fontSize: "18px", fontWeight: "700", margin: "0 0 20px" },
  table: { width: "100%", borderCollapse: "collapse" },
  th: { color: "var(--text-muted)", fontSize: "12px", fontWeight: "700", textTransform: "uppercase", letterSpacing: "1px", padding: "12px 16px", textAlign: "left", borderBottom: "1px solid var(--border-light)" },
  tr: { borderBottom: "1px solid #1e1e1e" },
  td: { color: "var(--text-primary)", fontSize: "14px", padding: "14px 16px" },
  badge: { color: "var(--text-primary)", padding: "4px 10px", borderRadius: "999px", fontSize: "12px", fontWeight: "600" },
  select: { background: "var(--bg-input)", border: "1px solid var(--border-color)", color: "var(--text-primary)", padding: "6px 10px", borderRadius: "8px", fontSize: "13px", cursor: "pointer" },
  formCard: { background: "var(--bg-secondary)", border: "1px solid var(--border-color)", borderRadius: "16px", padding: "24px", marginBottom: "24px" },
  formGrid: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px", marginBottom: "12px" },
  input: { background: "var(--bg-card)", border: "1px solid var(--border-color)", color: "var(--text-primary)", padding: "10px 14px", borderRadius: "8px", fontSize: "14px", outline: "none", boxSizing: "border-box" },
  uploadWrap: { marginBottom: "16px" },
  uploadLabel: { color: "var(--text-secondary)", fontSize: "13px", fontWeight: "600", textTransform: "uppercase", letterSpacing: "0.5px", marginBottom: "10px" },
  previewWrap: { position: "relative", width: "120px", height: "120px", marginBottom: "12px", borderRadius: "12px", overflow: "hidden" },
  previewImg: { width: "100%", height: "100%", objectFit: "cover" },
  uploadingOverlay: { position: "absolute", top: 0, left: 0, right: 0, bottom: 0, background: "rgba(0,0,0,0.7)", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" },
  uploadBtn: { display: "inline-block", padding: "10px 20px", background: "var(--bg-card)", border: "1px solid #f97316", color: "#f97316", borderRadius: "8px", cursor: "pointer", fontSize: "14px", fontWeight: "600" },
  orangeBtn: { padding: "10px 20px", background: "linear-gradient(135deg, #f97316, #dc2626)", color: "var(--text-primary)", border: "none", borderRadius: "8px", cursor: "pointer", fontWeight: "700", fontSize: "14px" },
  editBtn: { padding: "6px 12px", background: "#1e3a5f", border: "1px solid #3b82f6", color: "#3b82f6", borderRadius: "6px", cursor: "pointer", fontSize: "12px" },
  deleteBtn: { padding: "6px 12px", background: "#3f0f0f", border: "1px solid #dc2626", color: "#dc2626", borderRadius: "6px", cursor: "pointer", fontSize: "12px" },
  spinner: { width: "40px", height: "40px", border: "4px solid #333", borderTop: "4px solid #f97316", borderRadius: "50%", animation: "spin 0.8s linear infinite" },
  avatar: { background: "linear-gradient(135deg, #f97316, #dc2626)", color: "var(--text-primary)", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: "800" },
};
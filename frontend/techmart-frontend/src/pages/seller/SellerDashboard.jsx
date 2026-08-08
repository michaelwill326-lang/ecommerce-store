import { useState, useEffect } from "react";
import EmptyState from "../../components/EmptyState";
import { useNavigate, Link } from "react-router-dom";
import axios from "axios";
import AIDescriptionGenerator from "../../components/AIDescriptionGenerator";
const API = import.meta.env.VITE_API_URL || "https://techmart-backend-ecbi.onrender.com";

export default function SellerDashboard() {
  const navigate = useNavigate();
  const token = localStorage.getItem("sellerToken");
  const seller = (() => { try { return JSON.parse(localStorage.getItem("seller") || "{}"); } catch { return {}; } })();
  const headers = { Authorization: `Bearer ${token}` };
  const [tab, setTab] = useState("Overview");
  const [data, setData] = useState(null);
  const [analytics, setAnalytics] = useState(null);
  const [enhanced, setEnhanced] = useState(null);
  const [enhancedLoading, setEnhancedLoading] = useState(false);
  const [payouts, setPayouts] = useState([]);
  const [disputes, setDisputes] = useState([]);
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddProduct, setShowAddProduct] = useState(false);
  const [newProduct, setNewProduct] = useState({ name: "", price: "", description: "", category: "", stock: "" });
  const [images, setImages] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [msg, setMsg] = useState("");
  const [storefront, setStorefront] = useState({ storeDescription: "", storeBanner: "", storeLogo: "", storeColor: "#f97316" });
  const [newPayout, setNewPayout] = useState({ amount: "", bankName: "", accountNumber: "", accountName: "" });
  const [selectedDispute, setSelectedDispute] = useState(null);
  const [disputeReply, setDisputeReply] = useState("");
  const [selectedThread, setSelectedThread] = useState(null);
  const [msgReply, setMsgReply] = useState("");

  useEffect(() => {
    if (!token) { navigate("/seller/login"); return; }
    fetchAll();
  }, []);

  const fetchAll = async () => {
    try {
      setLoading(true);
      const [dashRes, analyticsRes, payoutsRes, disputesRes, messagesRes] = await Promise.all([
        axios.get(`${API}/api/seller/dashboard`, { headers }),
        axios.get(`${API}/api/seller/analytics`, { headers }),
        axios.get(`${API}/api/seller/payouts`, { headers }),
        axios.get(`${API}/api/seller/disputes`, { headers }),
        axios.get(`${API}/api/seller/messages`, { headers }),
      ]);
      setData(dashRes.data);
      setAnalytics(analyticsRes.data);
      setPayouts(payoutsRes.data || []);
      setDisputes(disputesRes.data || []);
      setMessages(messagesRes.data || []);
      setStorefront({
        storeDescription: dashRes.data.seller?.storeDescription || "",
        storeBanner: dashRes.data.seller?.storeBanner || "",
        storeLogo: dashRes.data.seller?.storeLogo || "",
        storeColor: dashRes.data.seller?.storeColor || "#f97316",
      });
    } catch (err) {
      if (err.response?.status === 401) navigate("/seller/login");
    } finally { setLoading(false); }
  };

  const handleImageUpload = async (e) => {
    const files = Array.from(e.target.files);
    if (!files.length) return;
    setUploading(true);
    try {
      const formData = new FormData();
      files.forEach(f => formData.append("images", f));
      const res = await axios.post(`${API}/api/admin/products/upload-images`, formData, { headers: { ...headers, "Content-Type": "multipart/form-data" } });
      setImages(prev => [...prev, ...res.data.urls]);
      setMsg(`✅ ${res.data.urls.length} image${res.data.urls.length > 1 ? "s" : ""} uploaded successfully!`);
    } catch { setMsg("❌ Image upload failed. Max 5MB per image, JPG/PNG only."); }
    finally { setUploading(false); }
  };

  const [variants, setVariants] = useState([{ name: "", color: "", size: "", storage: "", condition: "New", price: "", stock: "" }]);

  const addVariant = () => setVariants(prev => [...prev, { name: "", color: "", size: "", storage: "", condition: "New", price: "", stock: "" }]);
  const removeVariant = (i) => setVariants(prev => prev.filter((_, j) => j !== i));
  const updateVariant = (i, field, value) => setVariants(prev => prev.map((v, j) => j === i ? { ...v, [field]: value } : v));

  const fetchEnhanced = async () => {
    setEnhancedLoading(true);
    try {
      const res = await axios.get(`${API}/api/seller/analytics/enhanced`, { headers });
      setEnhanced(res.data);
    } catch { setMsg("Failed to load enhanced analytics"); }
    finally { setEnhancedLoading(false); }
  };

  const addProduct = async () => {
    setMsg("");
    if (!newProduct.name || !newProduct.price || !newProduct.stock) { setMsg("Name, price and stock are required"); return; }
    try {
      const formData = new FormData();
      formData.append("name", newProduct.name);
      formData.append("price", newProduct.price);
      formData.append("stock", newProduct.stock);
      formData.append("category", newProduct.category || "");
      formData.append("description", newProduct.description || "");
      formData.append("images", JSON.stringify(images));
      formData.append("variants", JSON.stringify(variants.filter(v => v.price && v.stock)));
      const res = await axios.post(`${API}/api/seller/products`, formData, { headers: { ...headers, "Content-Type": "multipart/form-data" } });
      setData(prev => ({ ...prev, products: [res.data.data, ...(prev?.products || [])] }));
      setShowAddProduct(false);
      setNewProduct({ name: "", price: "", description: "", category: "", stock: "" });
      setVariants([{ name: "", color: "", size: "", storage: "", condition: "New", price: "", stock: "" }]);
      setImages([]);
      setMsg("✅ Product added successfully!");
    } catch (err) { setMsg(err.response?.data?.error || "Failed to add product"); }
  };

  const deleteProduct = async (id) => {
    if (!window.confirm("Delete this product?")) return;
    try {
      await axios.delete(`${API}/api/seller/products/${id}`, { headers });
      setData(prev => ({ ...prev, products: prev.products.filter(p => p._id !== id) }));
    } catch { setMsg("Failed to delete product"); }
  };

  const saveStorefront = async () => {
    try {
      await axios.put(`${API}/api/seller/storefront`, storefront, { headers });
      setMsg("Storefront updated!");
    } catch { setMsg("Failed to update storefront"); }
  };

  const requestPayout = async () => {
    setMsg("");
    if (!newPayout.amount || !newPayout.bankName || !newPayout.accountNumber || !newPayout.accountName) {
      setMsg("All payout fields are required"); return;
    }
    try {
      const res = await axios.post(`${API}/api/seller/payouts`, newPayout, { headers });
      setPayouts([res.data.data, ...payouts]);
      setNewPayout({ amount: "", bankName: "", accountNumber: "", accountName: "" });
      setMsg("Payout request submitted!");
    } catch (err) { setMsg(err.response?.data?.error || "Failed to request payout"); }
  };

  const replyDispute = async () => {
    if (!disputeReply.trim()) return;
    try {
      const res = await axios.post(`${API}/api/disputes/${selectedDispute._id}/reply`, {
        message: disputeReply, sender: seller.storeName, senderType: "seller"
      });
      setSelectedDispute(res.data.data);
      setDisputeReply("");
    } catch { setMsg("Failed to send reply"); }
  };

  const replyMessage = async () => {
    if (!msgReply.trim()) return;
    try {
      const res = await axios.post(`${API}/api/seller/messages/${selectedThread._id}/reply`, { message: msgReply }, { headers });
      setSelectedThread(res.data.data);
      setMsgReply("");
    } catch { setMsg("Failed to send reply"); }
  };

  const [sellerWallet, setSellerWallet] = useState(null);
  const [withdrawForm, setWithdrawForm] = useState({ amount: "", bankCode: "", accountNumber: "", accountName: "", bankName: "" });
  const [withdrawLoading, setWithdrawLoading] = useState(false);
  const [banks, setBanks] = useState([]);
  const [verifyingAccount, setVerifyingAccount] = useState(false);

  if (loading) return <div style={{ minHeight: "100vh", background: "var(--bg-primary)", display: "flex", alignItems: "center", justifyContent: "center", color: "var(--text-primary)" }}>Loading...</div>;

  const inp = { width: "100%", padding: "12px 16px", background: "var(--bg-secondary)", border: "1px solid var(--border-color)", borderRadius: "10px", color: "var(--text-primary)", fontSize: "14px", outline: "none", boxSizing: "border-box", marginBottom: "12px" };
  const TABS = ["Overview", "Analytics", "Products", "Storefront", "Wallet", "Payouts", "Disputes", "Messages"];

  const statCards = [
    { label: "Revenue", value: `N${(analytics?.revenue || 0).toLocaleString()}`, color: "#f97316" },
    { label: "Net (after commission)", value: `N${(analytics?.netRevenue || 0).toLocaleString()}`, color: "#22c55e" },
    { label: "Orders", value: analytics?.totalOrders || 0, color: "#3b82f6" },
    { label: "Products", value: analytics?.totalProducts || 0, color: "#a855f7" },
    { label: "Avg Rating", value: analytics?.avgRating || "N/A", color: "#f59e0b" },
    { label: "Fulfillment", value: `${analytics?.fulfillmentRate || 0}%`, color: "#22c55e" },
  ];

  return (
    <div style={{ minHeight: "100vh", background: "var(--bg-primary)", padding: "16px", paddingBottom: "40px" }}>
      {/* HEADER */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px", flexWrap: "wrap", gap: "12px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
          {data?.seller?.storeLogo && <img src={data.seller.storeLogo} style={{ width: "40px", height: "40px", borderRadius: "8px", objectFit: "cover" }} />}
          <div>
            <h1 style={{ color: "#f97316", fontSize: "20px", fontWeight: "900", margin: 0 }}>{seller.storeName}</h1>
            <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
              {data?.seller?.verified && <span style={{ background: "#1d4ed8", color: "var(--text-primary)", fontSize: "10px", fontWeight: "700", padding: "2px 8px", borderRadius: "999px" }}>VERIFIED</span>}
              <p style={{ color: "var(--text-muted)", fontSize: "12px", margin: 0 }}>{seller.email}</p>
            </div>
          </div>
        </div>
        <button onClick={() => { localStorage.removeItem("sellerToken"); localStorage.removeItem("seller"); navigate("/seller/login"); }}
          style={{ background: "var(--bg-card)", border: "1px solid var(--border-color)", color: "var(--text-muted)", padding: "8px 16px", borderRadius: "8px", cursor: "pointer", fontSize: "13px" }}>
          Logout
        </button>
      </div>

      {/* TABS */}
      <div style={{ display: "flex", gap: "6px", marginBottom: "20px", overflowX: "auto", paddingBottom: "4px" }}>
        {TABS.map(t => (
          <button key={t} onClick={() => setTab(t)} style={{ padding: "8px 14px", borderRadius: "8px", border: "none", cursor: "pointer", fontWeight: "600", fontSize: "13px", whiteSpace: "nowrap", background: tab === t ? "linear-gradient(135deg, #f97316, #dc2626)" : "#1a1a1a", color: tab === t ? "#fff" : "#888" }}>{t}</button>
        ))}
      </div>

      {msg && <div style={{ background: msg.includes("Failed") || msg.includes("required") ? "#2a1010" : "#0a2a1a", border: `1px solid ${msg.includes("Failed") || msg.includes("required") ? "#dc2626" : "#22c55e"}`, color: msg.includes("Failed") || msg.includes("required") ? "#f87171" : "#86efac", padding: "12px 16px", borderRadius: "10px", fontSize: "14px", marginBottom: "16px" }}>{msg}</div>}

      {/* OVERVIEW */}
      {tab === "Overview" && (
        <div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))", gap: "12px", marginBottom: "20px" }}>
            {statCards.map((s, i) => (
              <div key={i} style={{ background: "var(--bg-card)", border: "1px solid #2a2a2a", borderRadius: "12px", padding: "16px" }}>
                <p style={{ color: "var(--text-muted)", fontSize: "11px", margin: "0 0 6px", textTransform: "uppercase" }}>{s.label}</p>
                <p style={{ color: s.color, fontSize: "20px", fontWeight: "800", margin: 0 }}>{s.value}</p>
              </div>
            ))}
          </div>
          <div style={{ background: "var(--bg-card)", border: "1px solid #2a2a2a", borderRadius: "12px", padding: "16px", marginBottom: "16px" }}>
            <h3 style={{ color: "var(--text-primary)", marginBottom: "12px", fontSize: "15px" }}>Top Products</h3>
            {(analytics?.topProducts || []).length === 0 ? <p style={{ color: "var(--text-muted)" }}>No sales yet.</p> : (
              analytics.topProducts.map((p, i) => (
                <div key={i} style={{ display: "flex", justifyContent: "space-between", padding: "8px 0", borderBottom: "1px solid var(--border-light)" }}>
                  <span style={{ color: "var(--text-primary)", fontSize: "14px" }}>{p.name}</span>
                  <span style={{ color: "#f97316", fontWeight: "700", fontSize: "14px" }}>N{p.revenue.toLocaleString()}</span>
                </div>
              ))
            )}
          </div>
          <div style={{ background: "var(--bg-card)", border: "1px solid #2a2a2a", borderRadius: "12px", padding: "16px" }}>
            <h3 style={{ color: "var(--text-primary)", marginBottom: "12px", fontSize: "15px" }}>Performance</h3>
            {[
              { label: "Total Reviews", value: analytics?.totalReviews || 0 },
              { label: "Open Disputes", value: analytics?.disputes || 0 },
              { label: "Resolved Disputes", value: analytics?.resolvedDisputes || 0 },
              { label: "Commission Rate", value: `${analytics?.commission || 10}%` },
            ].map((item, i) => (
              <div key={i} style={{ display: "flex", justifyContent: "space-between", padding: "8px 0", borderBottom: "1px solid var(--border-light)" }}>
                <span style={{ color: "var(--text-muted)", fontSize: "13px" }}>{item.label}</span>
                <span style={{ color: "var(--text-primary)", fontWeight: "700", fontSize: "13px" }}>{item.value}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ANALYTICS */}
      {tab === "Analytics" && (
        <div>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
            <h2 style={{ color: "var(--text-primary)", margin: 0 }}>📊 Seller Analytics</h2>
            <button onClick={fetchEnhanced} disabled={enhancedLoading} style={{ padding: "8px 16px", background: "linear-gradient(135deg, #f97316, #dc2626)", color: "#fff", border: "none", borderRadius: "8px", cursor: "pointer", fontWeight: "700", fontSize: "12px" }}>
              {enhancedLoading ? "Loading..." : "🔄 Load Full Analytics"}
            </button>
          </div>

          {/* KPI CARDS */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: "10px", marginBottom: "16px" }}>
            {[
              { label: "Total Revenue", value: `₦${(enhanced?.totalRevenue || analytics?.revenue || 0).toLocaleString()}`, color: "#f97316" },
              { label: "Total Orders", value: enhanced?.totalOrders || analytics?.totalOrders || 0, color: "#3b82f6" },
              { label: "Avg Order Value", value: `₦${(enhanced?.avgOrderValue || 0).toLocaleString()}`, color: "#22c55e" },
              { label: "Repeat Buyers", value: `${enhanced?.repeatRate || 0}%`, color: "#a855f7" },
            ].map((k, i) => (
              <div key={i} style={{ background: "var(--bg-card)", border: "1px solid #2a2a2a", borderRadius: "12px", padding: "16px" }}>
                <p style={{ color: "var(--text-muted)", fontSize: "11px", margin: "0 0 4px" }}>{k.label}</p>
                <p style={{ color: k.color, fontSize: "22px", fontWeight: "800", margin: 0 }}>{k.value}</p>
              </div>
            ))}
          </div>

          {enhanced && (<>
            {/* Revenue Forecast */}
            <div style={{ background: "linear-gradient(135deg, #1a0a00, #2a1000)", border: "1px solid #f97316", borderRadius: "12px", padding: "16px", marginBottom: "16px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div>
                <p style={{ color: "#f97316", fontWeight: "700", fontSize: "13px", margin: "0 0 4px" }}>📈 Revenue Forecast (Next 7 days)</p>
                <p style={{ color: "var(--text-muted)", fontSize: "12px", margin: 0 }}>Based on your last 4 weeks trend</p>
              </div>
              <p style={{ color: "#f97316", fontWeight: "900", fontSize: "24px", margin: 0 }}>₦{enhanced.forecastNextWeek.toLocaleString()}</p>
            </div>

            {/* Low Stock Alerts */}
            {enhanced.lowStock?.length > 0 && (
              <div style={{ background: "#1a0a00", border: "1px solid #dc2626", borderRadius: "12px", padding: "16px", marginBottom: "16px" }}>
                <p style={{ color: "#dc2626", fontWeight: "700", fontSize: "13px", margin: "0 0 10px" }}>⚠️ Low Stock Alert ({enhanced.lowStock.length} products)</p>
                {enhanced.lowStock.map((p, i) => (
                  <div key={i} style={{ display: "flex", justifyContent: "space-between", padding: "6px 0", borderBottom: "1px solid #2a1010" }}>
                    <span style={{ color: "var(--text-primary)", fontSize: "13px" }}>{p.name}</span>
                    <span style={{ color: p.stock === 0 ? "#dc2626" : "#f59e0b", fontWeight: "700", fontSize: "13px" }}>{p.stock === 0 ? "Out of stock" : `${p.stock} left`}</span>
                  </div>
                ))}
              </div>
            )}

            {/* Conversion Funnel */}
            <div style={{ background: "var(--bg-card)", border: "1px solid #2a2a2a", borderRadius: "12px", padding: "16px", marginBottom: "16px" }}>
              <p style={{ color: "var(--text-primary)", fontWeight: "700", fontSize: "14px", margin: "0 0 12px" }}>🔽 Conversion Funnel</p>
              {[
                { label: "👁 Product Views", value: enhanced.funnel?.views || 0, color: "#3b82f6" },
                { label: "�� Add to Cart", value: enhanced.funnel?.carts || 0, color: "#f97316" },
                { label: "✅ Purchases", value: enhanced.funnel?.purchases || 0, color: "#22c55e" },
              ].map((s, i) => {
                const max = enhanced.funnel?.views || 1;
                const pct = Math.round((s.value / max) * 100);
                return (
                  <div key={i} style={{ marginBottom: "10px" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "4px" }}>
                      <span style={{ color: "var(--text-muted)", fontSize: "12px" }}>{s.label}</span>
                      <span style={{ color: s.color, fontWeight: "700", fontSize: "12px" }}>{s.value.toLocaleString()} ({pct}%)</span>
                    </div>
                    <div style={{ background: "#1a1a1a", borderRadius: "4px", height: "6px" }}>
                      <div style={{ width: `${pct}%`, height: "6px", borderRadius: "4px", background: s.color }} />
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Weekly Revenue Chart */}
            <div style={{ background: "var(--bg-card)", border: "1px solid #2a2a2a", borderRadius: "12px", padding: "16px", marginBottom: "16px" }}>
              <p style={{ color: "var(--text-primary)", fontWeight: "700", fontSize: "14px", margin: "0 0 12px" }}>📅 Weekly Revenue (Last 7 Weeks)</p>
              <div style={{ display: "flex", alignItems: "flex-end", gap: "6px", height: "80px" }}>
                {(enhanced.weeklyRevenue || []).map((w, i) => {
                  const max = Math.max(...enhanced.weeklyRevenue.map(x => x.revenue), 1);
                  const h = Math.max((w.revenue / max) * 70, 4);
                  return (
                    <div key={i} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: "4px" }}>
                      <div style={{ width: "100%", height: `${h}px`, background: i === 6 ? "linear-gradient(135deg, #f97316, #dc2626)" : "#333", borderRadius: "4px 4px 0 0" }} />
                      <p style={{ color: "var(--text-muted)", fontSize: "9px", margin: 0 }}>{w.week}</p>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Peak Hours */}
            <div style={{ background: "var(--bg-card)", border: "1px solid #2a2a2a", borderRadius: "12px", padding: "16px", marginBottom: "16px" }}>
              <p style={{ color: "var(--text-primary)", fontWeight: "700", fontSize: "14px", margin: "0 0 4px" }}>⏰ Peak Order Hours</p>
              <p style={{ color: "var(--text-muted)", fontSize: "12px", margin: "0 0 12px" }}>Most orders at {enhanced.peakHour}:00</p>
              <div style={{ display: "flex", alignItems: "flex-end", gap: "2px", height: "60px" }}>
                {(enhanced.peakHours || []).map((h, i) => {
                  const max = Math.max(...enhanced.peakHours.map(x => x.orders), 1);
                  const height = Math.max((h.orders / max) * 50, 2);
                  return (
                    <div key={i} style={{ flex: 1, height: `${height}px`, background: i === enhanced.peakHour ? "#f97316" : "#333", borderRadius: "2px 2px 0 0", title: `${h.hour}: ${h.orders} orders` }} />
                  );
                })}
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", marginTop: "4px" }}>
                <span style={{ color: "var(--text-muted)", fontSize: "10px" }}>12am</span>
                <span style={{ color: "var(--text-muted)", fontSize: "10px" }}>12pm</span>
                <span style={{ color: "var(--text-muted)", fontSize: "10px" }}>11pm</span>
              </div>
            </div>

            {/* Pending Escrow */}
            <div style={{ background: "var(--bg-card)", border: "1px solid #2a2a2a", borderRadius: "12px", padding: "16px", marginBottom: "16px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div>
                <p style={{ color: "var(--text-primary)", fontWeight: "700", fontSize: "13px", margin: "0 0 2px" }}>🔐 Pending Escrow</p>
                <p style={{ color: "var(--text-muted)", fontSize: "12px", margin: 0 }}>Funds held until buyers confirm delivery</p>
              </div>
              <p style={{ color: "#f59e0b", fontWeight: "900", fontSize: "20px", margin: 0 }}>₦{(enhanced.pendingEscrow || 0).toLocaleString()}</p>
            </div>
          </>)}

          {/* TOP PRODUCTS */}
          <div style={{ background: "var(--bg-card)", border: "1px solid #2a2a2a", borderRadius: "12px", padding: "16px" }}>
            <h3 style={{ color: "var(--text-primary)", fontSize: "14px", marginBottom: "12px" }}>🏆 Top Products by Revenue</h3>
            {((enhanced?.topProducts || analytics?.topProducts || []).length === 0) ? (
              <p style={{ color: "var(--text-muted)" }}>No sales yet.</p>
            ) : (
              (enhanced?.topProducts || analytics?.topProducts || []).map((p, i) => {
                const list = enhanced?.topProducts || analytics?.topProducts || [];
                const maxRev = list[0]?.revenue || 1;
                const pct = Math.round((p.revenue / maxRev) * 100);
                return (
                  <div key={i} style={{ marginBottom: "12px" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "4px" }}>
                      <span style={{ color: "var(--text-primary)", fontSize: "13px" }}>{p.name}</span>
                      <span style={{ color: "#f97316", fontWeight: "700", fontSize: "13px" }}>₦{p.revenue.toLocaleString()}</span>
                    </div>
                    <div style={{ background: "#333", borderRadius: "4px", height: "6px" }}>
                      <div style={{ background: "linear-gradient(135deg, #f97316, #dc2626)", borderRadius: "4px", height: "6px", width: `${pct}%` }} />
                    </div>
                    <span style={{ color: "var(--text-muted)", fontSize: "11px" }}>{p.units} units sold</span>
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}

      {/* PRODUCTS */}
      {tab === "Products" && (
        <div>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
            <h2 style={{ color: "var(--text-primary)", margin: 0 }}>My Products</h2>
            <button onClick={() => setShowAddProduct(!showAddProduct)} style={{ padding: "10px 20px", background: "linear-gradient(135deg, #f97316, #dc2626)", color: "var(--text-primary)", border: "none", borderRadius: "10px", cursor: "pointer", fontWeight: "700" }}>
              {showAddProduct ? "Cancel" : "+ Add Product"}
            </button>
          </div>
          {showAddProduct && (
            <div style={{ background: "var(--bg-card)", border: "1px solid #2a2a2a", borderRadius: "12px", padding: "20px", marginBottom: "20px" }}>
              <h3 style={{ color: "#f97316", marginBottom: "16px" }}>Add New Product</h3>
              <input placeholder="Product Name *" value={newProduct.name} onChange={e => setNewProduct({...newProduct, name: e.target.value})} style={inp} />
              <input placeholder="Price (N) *" type="number" value={newProduct.price} onChange={e => setNewProduct({...newProduct, price: e.target.value})} style={inp} />
              <input placeholder="Stock *" type="number" value={newProduct.stock} onChange={e => setNewProduct({...newProduct, stock: e.target.value})} style={inp} />
              <input placeholder="Category" value={newProduct.category} onChange={e => setNewProduct({...newProduct, category: e.target.value})} style={inp} />
              <textarea placeholder="Description" value={newProduct.description} onChange={e => setNewProduct({...newProduct, description: e.target.value})} style={{ ...inp, height: "80px", resize: "vertical" }} />
              <AIDescriptionGenerator
                onGenerated={(desc) => {
                  setNewProduct(prev => ({...prev, description: desc}));
                  setMsg("✅ AI description applied!");
                }}
              />
              <label style={{ display: "inline-flex", alignItems: "center", gap: "8px", padding: "10px 20px", background: uploading ? "#555" : "linear-gradient(135deg, #3b82f6, #1d4ed8)", color: "#fff", borderRadius: "8px", cursor: uploading ? "not-allowed" : "pointer", marginBottom: "4px", fontWeight: "600", fontSize: "14px" }}>
                {uploading ? "⏳ Uploading..." : "📷 Upload Images"}
                <input type="file" accept=".jpg,.jpeg,.png,.webp" multiple onChange={handleImageUpload} style={{ display: "none" }} disabled={uploading} />
              </label>
              <p style={{ color: "var(--text-muted)", fontSize: "11px", margin: "4px 0 12px" }}>Max 5MB per image • JPG, PNG, WebP only</p>
              {images.length > 0 && (
                <div style={{ display: "flex", gap: "8px", flexWrap: "wrap", marginBottom: "8px" }}>
                  {images.map((url, i) => (
                    <div key={i} style={{ position: "relative" }}>
                      <img src={url} alt="" style={{ width: "60px", height: "60px", borderRadius: "6px", objectFit: "cover", border: "1px solid var(--border-color)" }} />
                      <button onClick={() => setImages(images.filter((_, j) => j !== i))} style={{ position: "absolute", top: "-6px", right: "-6px", background: "#dc2626", border: "none", color: "var(--text-primary)", borderRadius: "50%", width: "16px", height: "16px", fontSize: "10px", cursor: "pointer", lineHeight: 1 }}>✕</button>
                    </div>
                  ))}
                </div>
              )}

              {images.length > 0 && (
                <div style={{ background: "#0a2a0a", border: "1px solid #22c55e", borderRadius: "8px", padding: "10px", marginBottom: "12px" }}>
                  <p style={{ color: "#22c55e", margin: 0, fontSize: "13px", fontWeight: "600" }}>✅ {images.length} image{images.length > 1 ? "s" : ""} ready to upload with product</p>
                </div>
              )}
              {/* VARIANTS */}
              <div style={{ marginBottom: "16px" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "10px" }}>
                  <p style={{ color: "var(--text-primary)", fontWeight: "700", fontSize: "14px", margin: 0 }}>🎨 Product Variants</p>
                  <button onClick={addVariant} style={{ padding: "6px 14px", background: "#1a2a1a", border: "1px solid #22c55e", color: "#22c55e", borderRadius: "8px", cursor: "pointer", fontWeight: "700", fontSize: "12px" }}>+ Add Variant</button>
                </div>
                <p style={{ color: "var(--text-muted)", fontSize: "11px", margin: "0 0 10px" }}>Add variants like different colors, sizes, or storage options. Each can have its own price and stock.</p>
                {variants.map((v, i) => (
                  <div key={i} style={{ background: "#111", border: "1px solid #2a2a2a", borderRadius: "10px", padding: "14px", marginBottom: "10px" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "10px" }}>
                      <p style={{ color: "#f97316", fontWeight: "700", fontSize: "13px", margin: 0 }}>Variant {i + 1}</p>
                      {variants.length > 1 && <button onClick={() => removeVariant(i)} style={{ background: "#dc2626", border: "none", color: "#fff", borderRadius: "6px", padding: "4px 10px", cursor: "pointer", fontSize: "11px" }}>Remove</button>}
                    </div>
                    <input placeholder="Variant name (e.g. 128GB Black)" value={v.name} onChange={e => updateVariant(i, "name", e.target.value)} style={{ ...inp, marginBottom: "8px" }} />
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px", marginBottom: "8px" }}>
                      <input placeholder="Color (e.g. Black)" value={v.color} onChange={e => updateVariant(i, "color", e.target.value)} style={{ ...inp, marginBottom: 0 }} />
                      <input placeholder="Size (e.g. XL)" value={v.size} onChange={e => updateVariant(i, "size", e.target.value)} style={{ ...inp, marginBottom: 0 }} />
                      <input placeholder="Storage (e.g. 128GB)" value={v.storage} onChange={e => updateVariant(i, "storage", e.target.value)} style={{ ...inp, marginBottom: 0 }} />
                      <select value={v.condition} onChange={e => updateVariant(i, "condition", e.target.value)} style={{ ...inp, marginBottom: 0, appearance: "none" }}>
                        <option value="New">New</option>
                        <option value="Used">Used</option>
                        <option value="Refurbished">Refurbished</option>
                      </select>
                    </div>
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px" }}>
                      <input placeholder="Price (₦) *" type="number" value={v.price} onChange={e => updateVariant(i, "price", e.target.value)} style={{ ...inp, marginBottom: 0 }} />
                      <input placeholder="Stock *" type="number" value={v.stock} onChange={e => updateVariant(i, "stock", e.target.value)} style={{ ...inp, marginBottom: 0 }} />
                    </div>
                  </div>
                ))}
              </div>

              <button onClick={addProduct} style={{ width: "100%", padding: "12px", background: "linear-gradient(135deg, #f97316, #dc2626)", color: "#fff", border: "none", borderRadius: "10px", cursor: "pointer", fontWeight: "700", fontSize: "15px" }}>Add Product</button>
            </div>
          )}
          <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
            {(data?.products || []).length === 0 ? (
              <EmptyState icon="📦" title="No products yet" subtitle="Add your first product to start selling on TechMart" action="+ Add Product" onAction={() => setShowAddProduct(true)} />
            ) : (data?.products || []).map(p => (
              <div key={p._id} style={{ background: "var(--bg-card)", border: "1px solid #2a2a2a", borderRadius: "12px", padding: "16px", display: "flex", gap: "16px", alignItems: "center" }}>
                <img src={p.images?.[0] || "https://placehold.co/60x60?text=No+Image"} style={{ width: "60px", height: "60px", objectFit: "cover", borderRadius: "8px", flexShrink: 0 }} />
                <div style={{ flex: 1 }}>
                  <p style={{ color: "var(--text-primary)", fontWeight: "700", margin: "0 0 2px" }}>{p.name}</p>
                  <p style={{ color: "#f97316", fontWeight: "700", margin: "0 0 2px" }}>N{p.price?.toLocaleString()}</p>
                  <p style={{ color: "var(--text-muted)", fontSize: "12px", margin: 0 }}>Stock: {p.stock} | Rating: {p.rating || 0}</p>
                </div>
                <button onClick={() => deleteProduct(p._id)} style={{ background: "#dc2626", color: "var(--text-primary)", border: "none", borderRadius: "8px", padding: "8px 12px", cursor: "pointer", fontSize: "13px" }}>Delete</button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* STOREFRONT */}
      {tab === "Storefront" && (
        <div>
          <h2 style={{ color: "var(--text-primary)", marginBottom: "16px" }}>Customize Your Storefront</h2>
          <div style={{ background: "var(--bg-card)", border: "1px solid #2a2a2a", borderRadius: "12px", padding: "20px", marginBottom: "16px" }}>
            <div style={{ background: storefront.storeColor || "#f97316", borderRadius: "12px", padding: "24px", marginBottom: "20px", textAlign: "center" }}>
              {storefront.storeLogo && <img src={storefront.storeLogo} style={{ width: "60px", height: "60px", borderRadius: "50%", objectFit: "cover", marginBottom: "8px" }} />}
              <h2 style={{ color: "var(--text-primary)", margin: 0 }}>{seller.storeName}</h2>
              <p style={{ color: "rgba(255,255,255,0.8)", fontSize: "14px" }}>{storefront.storeDescription || "Add your store description"}</p>
            </div>
            <input placeholder="Store Logo URL" value={storefront.storeLogo} onChange={e => setStorefront({...storefront, storeLogo: e.target.value})} style={inp} />
            <input placeholder="Store Banner URL" value={storefront.storeBanner} onChange={e => setStorefront({...storefront, storeBanner: e.target.value})} style={inp} />
            <div style={{ marginBottom: "12px" }}>
              <label style={{ color: "var(--text-secondary)", fontSize: "13px", display: "block", marginBottom: "6px" }}>Store Color</label>
              <input type="color" value={storefront.storeColor} onChange={e => setStorefront({...storefront, storeColor: e.target.value})} style={{ width: "60px", height: "40px", border: "none", borderRadius: "8px", cursor: "pointer" }} />
            </div>
            <textarea placeholder="Store Description" value={storefront.storeDescription} onChange={e => setStorefront({...storefront, storeDescription: e.target.value})} style={{ ...inp, height: "100px", resize: "vertical" }} />
            <button onClick={saveStorefront} style={{ width: "100%", padding: "12px", background: "linear-gradient(135deg, #f97316, #dc2626)", color: "var(--text-primary)", border: "none", borderRadius: "10px", cursor: "pointer", fontWeight: "700" }}>Save Storefront</button>
            <p style={{ color: "var(--text-muted)", fontSize: "13px", marginTop: "12px", textAlign: "center" }}>
              Your store: <a href={`/store/${seller.id}`} style={{ color: "#f97316" }}>View Storefront</a>
            </p>
          </div>
        </div>
      )}

      {/* PAYOUTS */}
      {/* WALLET TAB */}
      {tab === "Wallet" && (
        <div>
          <h2 style={{ color: "var(--text-primary)", marginBottom: "16px" }}>💰 Seller Wallet</h2>
          {!sellerWallet ? (
            <button onClick={async () => {
              try {
                const res = await axios.get(`${API}/api/seller/wallet`, { headers });
                setSellerWallet(res.data);
                const banksRes = await axios.get(`${API}/api/pay/banks`);
                setBanks(banksRes.data || []);
              } catch { setMsg("Failed to load wallet"); }
            }} style={{ padding: "12px 24px", background: "linear-gradient(135deg,#f97316,#dc2626)", color: "var(--text-primary)", border: "none", borderRadius: "10px", cursor: "pointer", fontWeight: "700", marginBottom: "16px" }}>
              Load Wallet
            </button>
          ) : (
            <div>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: "10px", marginBottom: "20px" }}>
                {[
                  { label: "Available Balance", value: `N${(sellerWallet.balance||0).toLocaleString()}`, color: "#22c55e" },
                  { label: "Total Earnings", value: `N${(sellerWallet.totalEarnings||0).toLocaleString()}`, color: "#f97316" },
                  { label: "Total Withdrawn", value: `N${(sellerWallet.totalWithdrawn||0).toLocaleString()}`, color: "#3b82f6" },
                ].map((k,i) => (
                  <div key={i} style={{ background: "var(--bg-card)", border: "1px solid #2a2a2a", borderRadius: "12px", padding: "16px" }}>
                    <p style={{ color: "var(--text-muted)", fontSize: "11px", margin: "0 0 4px" }}>{k.label}</p>
                    <p style={{ color: k.color, fontSize: "20px", fontWeight: "800", margin: 0 }}>{k.value}</p>
                  </div>
                ))}
              </div>

              <div style={{ background: "var(--bg-card)", border: "1px solid #2a2a2a", borderRadius: "12px", padding: "20px", marginBottom: "16px" }}>
                <h3 style={{ color: "var(--text-primary)", marginBottom: "16px", fontSize: "15px" }}>Withdraw to Bank</h3>
                <select value={withdrawForm.bankCode} onChange={async e => {
                  const bank = banks.find(b => b.code === e.target.value);
                  setWithdrawForm({...withdrawForm, bankCode: e.target.value, bankName: bank?.name || "", accountName: ""});
                }} style={{ ...inp, marginBottom: "12px" }}>
                  <option value="">Select Bank</option>
                  {banks.map(b => <option key={b.code} value={b.code}>{b.name}</option>)}
                </select>
                <div style={{ display: "flex", gap: "8px" }}>
                  <input placeholder="Account Number" value={withdrawForm.accountNumber} onChange={e => setWithdrawForm({...withdrawForm, accountNumber: e.target.value, accountName: ""})} style={{ ...inp, flex: 1 }} maxLength={10} />
                  <button onClick={async () => {
                    if (!withdrawForm.bankCode || withdrawForm.accountNumber.length !== 10) return;
                    setVerifyingAccount(true);
                    try {
                      const res = await axios.post(`${API}/api/pay/verify-account`, { accountNumber: withdrawForm.accountNumber, bankCode: withdrawForm.bankCode }, { headers });
                      setWithdrawForm(prev => ({...prev, accountName: res.data.accountName}));
                    } catch { setMsg("Could not verify account"); }
                    finally { setVerifyingAccount(false); }
                  }} disabled={verifyingAccount || withdrawForm.accountNumber.length !== 10} style={{ padding: "12px 16px", background: "#333", color: "var(--text-primary)", border: "none", borderRadius: "10px", cursor: "pointer", fontWeight: "600", whiteSpace: "nowrap", height: "48px" }}>
                    {verifyingAccount ? "..." : "Verify"}
                  </button>
                </div>
                {withdrawForm.accountName && (
                  <div style={{ background: "#0a2a0a", border: "1px solid #22c55e", borderRadius: "8px", padding: "10px", marginBottom: "12px" }}>
                    <p style={{ color: "#22c55e", margin: 0, fontSize: "13px" }}>✅ {withdrawForm.accountName}</p>
                  </div>
                )}
                <input placeholder="Amount (min N1,000)" type="number" value={withdrawForm.amount} onChange={e => setWithdrawForm({...withdrawForm, amount: e.target.value})} style={inp} />
                <button onClick={async () => {
                  if (!withdrawForm.accountName) return setMsg("Please verify your account first");
                  if (!withdrawForm.amount || Number(withdrawForm.amount) < 1000) return setMsg("Minimum withdrawal is N1,000");
                  setWithdrawLoading(true);
                  try {
                    const res = await axios.post(`${API}/api/seller/withdraw`, withdrawForm, { headers });
                    setMsg(res.data.message);
                    setSellerWallet(prev => ({...prev, balance: prev.balance - Number(withdrawForm.amount)}));
                    setWithdrawForm({ amount: "", bankCode: "", accountNumber: "", accountName: "", bankName: "" });
                  } catch (err) { setMsg(err.response?.data?.error || "Withdrawal failed"); }
                  finally { setWithdrawLoading(false); }
                }} disabled={withdrawLoading || !withdrawForm.accountName} style={{ width: "100%", padding: "14px", background: withdrawForm.accountName ? "linear-gradient(135deg,#f97316,#dc2626)" : "#333", color: "var(--text-primary)", border: "none", borderRadius: "10px", cursor: withdrawForm.accountName ? "pointer" : "not-allowed", fontWeight: "700" }}>
                  {withdrawLoading ? "Processing..." : `Withdraw N${Number(withdrawForm.amount||0).toLocaleString()}`}
                </button>
              </div>

              <div style={{ background: "var(--bg-card)", border: "1px solid #2a2a2a", borderRadius: "12px", padding: "16px" }}>
                <h3 style={{ color: "var(--text-primary)", marginBottom: "12px", fontSize: "15px" }}>Recent Transactions</h3>
                {(sellerWallet.recentTransactions||[]).map((t,i) => (
                  <div key={i} style={{ display: "flex", justifyContent: "space-between", padding: "10px 0", borderBottom: "1px solid var(--border-light)" }}>
                    <div>
                      <p style={{ color: "var(--text-primary)", fontSize: "13px", margin: "0 0 2px" }}>{t.description}</p>
                      <p style={{ color: "var(--text-muted)", fontSize: "11px", margin: 0 }}>{new Date(t.createdAt).toLocaleDateString()}</p>
                    </div>
                    <p style={{ color: t.type==="credit"?"#22c55e":"#f87171", fontWeight: "700", margin: 0 }}>{t.type==="credit"?"+":"-"}N{t.amount?.toLocaleString()}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {tab === "Payouts" && (
        <div>
          <h2 style={{ color: "var(--text-primary)", marginBottom: "16px" }}>Payout Requests</h2>
          <div style={{ background: "var(--bg-card)", border: "1px solid #2a2a2a", borderRadius: "12px", padding: "20px", marginBottom: "20px" }}>
            <h3 style={{ color: "#f97316", marginBottom: "16px" }}>Request Payout</h3>
            <p style={{ color: "var(--text-muted)", fontSize: "13px", marginBottom: "12px" }}>Available: N{(analytics?.netRevenue || 0).toLocaleString()}</p>
            <input placeholder="Amount (N)" type="number" value={newPayout.amount} onChange={e => setNewPayout({...newPayout, amount: e.target.value})} style={inp} />
            <input placeholder="Bank Name" value={newPayout.bankName} onChange={e => setNewPayout({...newPayout, bankName: e.target.value})} style={inp} />
            <input placeholder="Account Number" value={newPayout.accountNumber} onChange={e => setNewPayout({...newPayout, accountNumber: e.target.value})} style={inp} />
            <input placeholder="Account Name" value={newPayout.accountName} onChange={e => setNewPayout({...newPayout, accountName: e.target.value})} style={inp} />
            <button onClick={requestPayout} style={{ width: "100%", padding: "12px", background: "linear-gradient(135deg, #f97316, #dc2626)", color: "var(--text-primary)", border: "none", borderRadius: "10px", cursor: "pointer", fontWeight: "700" }}>Request Payout</button>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
            {payouts.length === 0 ? <EmptyState icon="💸" title="No payout requests" subtitle="Request a payout from your seller wallet" /> : payouts.map(p => (
              <div key={p._id} style={{ background: "var(--bg-card)", border: "1px solid #2a2a2a", borderRadius: "12px", padding: "16px" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <div>
                    <p style={{ color: "var(--text-primary)", fontWeight: "700", margin: "0 0 4px" }}>N{p.amount.toLocaleString()}</p>
                    <p style={{ color: "var(--text-muted)", fontSize: "13px", margin: "0 0 2px" }}>{p.bankName} — {p.accountNumber}</p>
                    <p style={{ color: "var(--text-muted)", fontSize: "12px", margin: 0 }}>{new Date(p.createdAt).toLocaleDateString()}</p>
                  </div>
                  <span style={{ padding: "4px 12px", borderRadius: "999px", fontSize: "12px", fontWeight: "700", background: p.status === "paid" ? "#0a2a1a" : p.status === "rejected" ? "#2a1010" : "#1a1a0a", color: p.status === "paid" ? "#22c55e" : p.status === "rejected" ? "#f87171" : "#fbbf24" }}>{p.status.toUpperCase()}</span>
                </div>
                {p.note && <p style={{ color: "var(--text-secondary)", fontSize: "13px", marginTop: "8px" }}>Note: {p.note}</p>}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* DISPUTES */}
      {tab === "Disputes" && (
        <div>
          <h2 style={{ color: "var(--text-primary)", marginBottom: "16px" }}>Customer Disputes</h2>
          {selectedDispute ? (
            <div>
              <button onClick={() => setSelectedDispute(null)} style={{ background: "var(--bg-card)", border: "1px solid var(--border-color)", color: "var(--text-primary)", padding: "8px 16px", borderRadius: "8px", cursor: "pointer", marginBottom: "16px" }}>← Back</button>
              <div style={{ background: "var(--bg-card)", border: "1px solid #2a2a2a", borderRadius: "12px", padding: "16px", marginBottom: "16px" }}>
                <h3 style={{ color: "var(--text-primary)", margin: "0 0 8px" }}>{selectedDispute.subject}</h3>
                <p style={{ color: "var(--text-muted)", fontSize: "13px", margin: 0 }}>From: {selectedDispute.customerEmail}</p>
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: "10px", marginBottom: "16px" }}>
                {selectedDispute.messages.map((m, i) => (
                  <div key={i} style={{ alignSelf: m.senderType === "seller" ? "flex-end" : "flex-start", background: m.senderType === "seller" ? "#1a0a00" : "#1a1a1a", border: `1px solid ${m.senderType === "seller" ? "#f97316" : "#333"}`, borderRadius: "10px", padding: "12px", maxWidth: "80%" }}>
                    <p style={{ color: "var(--text-muted)", fontSize: "11px", margin: "0 0 4px" }}>{m.sender}</p>
                    <p style={{ color: "var(--text-primary)", fontSize: "14px", margin: 0 }}>{m.message}</p>
                  </div>
                ))}
              </div>
              <div style={{ display: "flex", gap: "8px" }}>
                <input value={disputeReply} onChange={e => setDisputeReply(e.target.value)} placeholder="Type your response..." style={{ ...inp, marginBottom: 0, flex: 1 }} />
                <button onClick={replyDispute} style={{ padding: "12px 20px", background: "linear-gradient(135deg, #f97316, #dc2626)", color: "var(--text-primary)", border: "none", borderRadius: "10px", cursor: "pointer", fontWeight: "700" }}>Send</button>
              </div>
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
              {disputes.length === 0 ? <EmptyState icon="🤝" title="No disputes" subtitle="Any buyer disputes will appear here" /> : disputes.map(d => (
                <div key={d._id} onClick={() => setSelectedDispute(d)} style={{ background: "var(--bg-card)", border: "1px solid #2a2a2a", borderRadius: "12px", padding: "16px", cursor: "pointer" }}>
                  <div style={{ display: "flex", justifyContent: "space-between" }}>
                    <p style={{ color: "var(--text-primary)", fontWeight: "700", margin: "0 0 4px" }}>{d.subject}</p>
                    <span style={{ padding: "2px 8px", borderRadius: "999px", fontSize: "11px", fontWeight: "700", background: d.status === "resolved" ? "#0a2a1a" : "#2a1a0a", color: d.status === "resolved" ? "#22c55e" : "#fbbf24" }}>{d.status}</span>
                  </div>
                  <p style={{ color: "var(--text-muted)", fontSize: "13px", margin: 0 }}>{d.customerEmail} — {new Date(d.createdAt).toLocaleDateString()}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* MESSAGES */}
      {tab === "Messages" && (
        <div>
          <h2 style={{ color: "var(--text-primary)", marginBottom: "16px" }}>Customer Messages</h2>
          {selectedThread ? (
            <div>
              <button onClick={() => setSelectedThread(null)} style={{ background: "var(--bg-card)", border: "1px solid var(--border-color)", color: "var(--text-primary)", padding: "8px 16px", borderRadius: "8px", cursor: "pointer", marginBottom: "16px" }}>← Back</button>
              <div style={{ background: "var(--bg-card)", border: "1px solid #2a2a2a", borderRadius: "12px", padding: "16px", marginBottom: "16px" }}>
                <p style={{ color: "var(--text-primary)", fontWeight: "700", margin: "0 0 4px" }}>{selectedThread.productName}</p>
                <p style={{ color: "var(--text-muted)", fontSize: "13px", margin: 0 }}>From: {selectedThread.customerName} ({selectedThread.customerEmail})</p>
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: "10px", marginBottom: "16px" }}>
                {selectedThread.messages.map((m, i) => (
                  <div key={i} style={{ alignSelf: m.senderType === "seller" ? "flex-end" : "flex-start", background: m.senderType === "seller" ? "#1a0a00" : "#1a1a1a", border: `1px solid ${m.senderType === "seller" ? "#f97316" : "#333"}`, borderRadius: "10px", padding: "12px", maxWidth: "80%" }}>
                    <p style={{ color: "var(--text-muted)", fontSize: "11px", margin: "0 0 4px" }}>{m.sender}</p>
                    <p style={{ color: "var(--text-primary)", fontSize: "14px", margin: 0 }}>{m.message}</p>
                  </div>
                ))}
              </div>
              <div style={{ display: "flex", gap: "8px" }}>
                <input value={msgReply} onChange={e => setMsgReply(e.target.value)} placeholder="Type your reply..." style={{ ...inp, marginBottom: 0, flex: 1 }} />
                <button onClick={replyMessage} style={{ padding: "12px 20px", background: "linear-gradient(135deg, #f97316, #dc2626)", color: "var(--text-primary)", border: "none", borderRadius: "10px", cursor: "pointer", fontWeight: "700" }}>Send</button>
              </div>
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
              {messages.length === 0 ? <EmptyState icon="💬" title="No messages yet" subtitle="Messages from buyers will appear here" /> : messages.map(t => (
                <div key={t._id} onClick={() => setSelectedThread(t)} style={{ background: "var(--bg-card)", border: "1px solid #2a2a2a", borderRadius: "12px", padding: "16px", cursor: "pointer" }}>
                  <p style={{ color: "var(--text-primary)", fontWeight: "700", margin: "0 0 4px" }}>{t.productName}</p>
                  <p style={{ color: "var(--text-muted)", fontSize: "13px", margin: "0 0 2px" }}>{t.customerName} — {t.messages.length} message(s)</p>
                  <p style={{ color: "var(--text-secondary)", fontSize: "13px", margin: 0 }}>{t.messages[t.messages.length-1]?.message?.substring(0, 60)}...</p>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

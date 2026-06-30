import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import axios from "axios";
import AIDescriptionGenerator from "../../components/AIDescriptionGenerator";
const API = import.meta.env.VITE_API_URL || "https://techmart-backend-ecbi.onrender.com";

export default function SellerDashboard() {
  const navigate = useNavigate();
  const token = localStorage.getItem("sellerToken");
  const seller = JSON.parse(localStorage.getItem("seller") || "{}");
  const headers = { Authorization: `Bearer ${token}` };
  const [tab, setTab] = useState("Overview");
  const [data, setData] = useState(null);
  const [analytics, setAnalytics] = useState(null);
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
    } catch { setMsg("Image upload failed"); }
    finally { setUploading(false); }
  };

  const addProduct = async () => {
    setMsg("");
    if (!newProduct.name || !newProduct.price || !newProduct.stock) { setMsg("Name, price and stock are required"); return; }
    try {
      const res = await axios.post(`${API}/api/seller/products`, { ...newProduct, images }, { headers });
      setData(prev => ({ ...prev, products: [res.data.data, ...(prev?.products || [])] }));
      setShowAddProduct(false);
      setNewProduct({ name: "", price: "", description: "", category: "", stock: "" });
      setImages([]);
      setMsg("Product added!");
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

  if (loading) return <div style={{ minHeight: "100vh", background: "#0a0a0a", display: "flex", alignItems: "center", justifyContent: "center", color: "#fff" }}>Loading...</div>;

  const inp = { width: "100%", padding: "12px 16px", background: "#111", border: "1px solid #333", borderRadius: "10px", color: "#fff", fontSize: "14px", outline: "none", boxSizing: "border-box", marginBottom: "12px" };
  const TABS = ["Overview", "Analytics", "Products", "Storefront", "Payouts", "Disputes", "Messages"];

  const statCards = [
    { label: "Revenue", value: `N${(analytics?.revenue || 0).toLocaleString()}`, color: "#f97316" },
    { label: "Net (after commission)", value: `N${(analytics?.netRevenue || 0).toLocaleString()}`, color: "#22c55e" },
    { label: "Orders", value: analytics?.totalOrders || 0, color: "#3b82f6" },
    { label: "Products", value: analytics?.totalProducts || 0, color: "#a855f7" },
    { label: "Avg Rating", value: analytics?.avgRating || "N/A", color: "#f59e0b" },
    { label: "Fulfillment", value: `${analytics?.fulfillmentRate || 0}%`, color: "#22c55e" },
  ];

  return (
    <div style={{ minHeight: "100vh", background: "#0a0a0a", padding: "16px", paddingBottom: "40px" }}>
      {/* HEADER */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px", flexWrap: "wrap", gap: "12px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
          {data?.seller?.storeLogo && <img src={data.seller.storeLogo} style={{ width: "40px", height: "40px", borderRadius: "8px", objectFit: "cover" }} />}
          <div>
            <h1 style={{ color: "#f97316", fontSize: "20px", fontWeight: "900", margin: 0 }}>{seller.storeName}</h1>
            <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
              {data?.seller?.verified && <span style={{ background: "#1d4ed8", color: "#fff", fontSize: "10px", fontWeight: "700", padding: "2px 8px", borderRadius: "999px" }}>VERIFIED</span>}
              <p style={{ color: "#888", fontSize: "12px", margin: 0 }}>{seller.email}</p>
            </div>
          </div>
        </div>
        <button onClick={() => { localStorage.removeItem("sellerToken"); localStorage.removeItem("seller"); navigate("/seller/login"); }}
          style={{ background: "#1a1a1a", border: "1px solid #333", color: "#888", padding: "8px 16px", borderRadius: "8px", cursor: "pointer", fontSize: "13px" }}>
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
              <div key={i} style={{ background: "#1a1a1a", border: "1px solid #2a2a2a", borderRadius: "12px", padding: "16px" }}>
                <p style={{ color: "#888", fontSize: "11px", margin: "0 0 6px", textTransform: "uppercase" }}>{s.label}</p>
                <p style={{ color: s.color, fontSize: "20px", fontWeight: "800", margin: 0 }}>{s.value}</p>
              </div>
            ))}
          </div>
          <div style={{ background: "#1a1a1a", border: "1px solid #2a2a2a", borderRadius: "12px", padding: "16px", marginBottom: "16px" }}>
            <h3 style={{ color: "#fff", marginBottom: "12px", fontSize: "15px" }}>Top Products</h3>
            {(analytics?.topProducts || []).length === 0 ? <p style={{ color: "#888" }}>No sales yet.</p> : (
              analytics.topProducts.map((p, i) => (
                <div key={i} style={{ display: "flex", justifyContent: "space-between", padding: "8px 0", borderBottom: "1px solid #222" }}>
                  <span style={{ color: "#fff", fontSize: "14px" }}>{p.name}</span>
                  <span style={{ color: "#f97316", fontWeight: "700", fontSize: "14px" }}>N{p.revenue.toLocaleString()}</span>
                </div>
              ))
            )}
          </div>
          <div style={{ background: "#1a1a1a", border: "1px solid #2a2a2a", borderRadius: "12px", padding: "16px" }}>
            <h3 style={{ color: "#fff", marginBottom: "12px", fontSize: "15px" }}>Performance</h3>
            {[
              { label: "Total Reviews", value: analytics?.totalReviews || 0 },
              { label: "Open Disputes", value: analytics?.disputes || 0 },
              { label: "Resolved Disputes", value: analytics?.resolvedDisputes || 0 },
              { label: "Commission Rate", value: `${analytics?.commission || 10}%` },
            ].map((item, i) => (
              <div key={i} style={{ display: "flex", justifyContent: "space-between", padding: "8px 0", borderBottom: "1px solid #222" }}>
                <span style={{ color: "#888", fontSize: "13px" }}>{item.label}</span>
                <span style={{ color: "#fff", fontWeight: "700", fontSize: "13px" }}>{item.value}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ANALYTICS */}
      {tab === "Analytics" && (
        <div>
          <h2 style={{ color: "#fff", marginBottom: "16px" }}>Revenue Analytics (Last 30 Days)</h2>
          <div style={{ background: "#1a1a1a", border: "1px solid #2a2a2a", borderRadius: "12px", padding: "16px", marginBottom: "16px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "16px" }}>
              <div>
                <p style={{ color: "#888", fontSize: "12px", margin: 0 }}>Gross Revenue</p>
                <p style={{ color: "#f97316", fontSize: "24px", fontWeight: "800", margin: 0 }}>N{(analytics?.revenue || 0).toLocaleString()}</p>
              </div>
              <div>
                <p style={{ color: "#888", fontSize: "12px", margin: 0 }}>Commission ({analytics?.commission}%)</p>
                <p style={{ color: "#dc2626", fontSize: "24px", fontWeight: "800", margin: 0 }}>-N{(analytics?.commissionAmount || 0).toLocaleString()}</p>
              </div>
              <div>
                <p style={{ color: "#888", fontSize: "12px", margin: 0 }}>Net Revenue</p>
                <p style={{ color: "#22c55e", fontSize: "24px", fontWeight: "800", margin: 0 }}>N{(analytics?.netRevenue || 0).toLocaleString()}</p>
              </div>
            </div>
            <h3 style={{ color: "#fff", fontSize: "14px", marginBottom: "12px" }}>Daily Revenue</h3>
            {Object.keys(analytics?.revenueByDate || {}).length === 0 ? (
              <p style={{ color: "#888" }}>No revenue data yet.</p>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: "6px", maxHeight: "300px", overflowY: "auto" }}>
                {Object.entries(analytics?.revenueByDate || {}).reverse().map(([date, rev], i) => (
                  <div key={i} style={{ display: "flex", justifyContent: "space-between", padding: "6px 0", borderBottom: "1px solid #222" }}>
                    <span style={{ color: "#888", fontSize: "13px" }}>{date}</span>
                    <span style={{ color: "#f97316", fontWeight: "700", fontSize: "13px" }}>N{rev.toLocaleString()}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* PRODUCTS */}
      {tab === "Products" && (
        <div>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
            <h2 style={{ color: "#fff", margin: 0 }}>My Products</h2>
            <button onClick={() => setShowAddProduct(!showAddProduct)} style={{ padding: "10px 20px", background: "linear-gradient(135deg, #f97316, #dc2626)", color: "#fff", border: "none", borderRadius: "10px", cursor: "pointer", fontWeight: "700" }}>
              {showAddProduct ? "Cancel" : "+ Add Product"}
            </button>
          </div>
          {showAddProduct && (
            <div style={{ background: "#1a1a1a", border: "1px solid #2a2a2a", borderRadius: "12px", padding: "20px", marginBottom: "20px" }}>
              <h3 style={{ color: "#f97316", marginBottom: "16px" }}>Add New Product</h3>
              <input placeholder="Product Name *" value={newProduct.name} onChange={e => setNewProduct({...newProduct, name: e.target.value})} style={inp} />
              <input placeholder="Price (N) *" type="number" value={newProduct.price} onChange={e => setNewProduct({...newProduct, price: e.target.value})} style={inp} />
              <input placeholder="Stock *" type="number" value={newProduct.stock} onChange={e => setNewProduct({...newProduct, stock: e.target.value})} style={inp} />
              <input placeholder="Category" value={newProduct.category} onChange={e => setNewProduct({...newProduct, category: e.target.value})} style={inp} />
              <textarea placeholder="Description" value={newProduct.description} onChange={e => setNewProduct({...newProduct, description: e.target.value})} style={{ ...inp, height: "80px", resize: "vertical" }} />
              <AIDescriptionGenerator
                onGenerated={(desc) => setNewProduct(prev => ({...prev, description: desc}))}
              />
              <label style={{ display: "inline-block", padding: "10px 20px", background: "#333", color: "#fff", borderRadius: "8px", cursor: "pointer", marginBottom: "12px" }}>
                {uploading ? "Uploading..." : "Upload Images"}
                <input type="file" accept="image/*" multiple onChange={handleImageUpload} style={{ display: "none" }} disabled={uploading} />
              </label>
              {images.length > 0 && (
                <div style={{ display: "flex", gap: "8px", flexWrap: "wrap", marginBottom: "12px" }}>
                  {images.map((url, i) => <img key={i} src={url} style={{ width: "60px", height: "60px", objectFit: "cover", borderRadius: "8px" }} />)}
                </div>
              )}
              <button onClick={addProduct} style={{ width: "100%", padding: "12px", background: "linear-gradient(135deg, #f97316, #dc2626)", color: "#fff", border: "none", borderRadius: "10px", cursor: "pointer", fontWeight: "700" }}>Add Product</button>
            </div>
          )}
          <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
            {(data?.products || []).length === 0 ? (
              <p style={{ color: "#888", textAlign: "center", padding: "40px" }}>No products yet.</p>
            ) : (data?.products || []).map(p => (
              <div key={p._id} style={{ background: "#1a1a1a", border: "1px solid #2a2a2a", borderRadius: "12px", padding: "16px", display: "flex", gap: "16px", alignItems: "center" }}>
                <img src={p.images?.[0] || "https://placehold.co/60x60?text=No+Image"} style={{ width: "60px", height: "60px", objectFit: "cover", borderRadius: "8px", flexShrink: 0 }} />
                <div style={{ flex: 1 }}>
                  <p style={{ color: "#fff", fontWeight: "700", margin: "0 0 2px" }}>{p.name}</p>
                  <p style={{ color: "#f97316", fontWeight: "700", margin: "0 0 2px" }}>N{p.price?.toLocaleString()}</p>
                  <p style={{ color: "#888", fontSize: "12px", margin: 0 }}>Stock: {p.stock} | Rating: {p.rating || 0}</p>
                </div>
                <button onClick={() => deleteProduct(p._id)} style={{ background: "#dc2626", color: "#fff", border: "none", borderRadius: "8px", padding: "8px 12px", cursor: "pointer", fontSize: "13px" }}>Delete</button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* STOREFRONT */}
      {tab === "Storefront" && (
        <div>
          <h2 style={{ color: "#fff", marginBottom: "16px" }}>Customize Your Storefront</h2>
          <div style={{ background: "#1a1a1a", border: "1px solid #2a2a2a", borderRadius: "12px", padding: "20px", marginBottom: "16px" }}>
            <div style={{ background: storefront.storeColor || "#f97316", borderRadius: "12px", padding: "24px", marginBottom: "20px", textAlign: "center" }}>
              {storefront.storeLogo && <img src={storefront.storeLogo} style={{ width: "60px", height: "60px", borderRadius: "50%", objectFit: "cover", marginBottom: "8px" }} />}
              <h2 style={{ color: "#fff", margin: 0 }}>{seller.storeName}</h2>
              <p style={{ color: "rgba(255,255,255,0.8)", fontSize: "14px" }}>{storefront.storeDescription || "Add your store description"}</p>
            </div>
            <input placeholder="Store Logo URL" value={storefront.storeLogo} onChange={e => setStorefront({...storefront, storeLogo: e.target.value})} style={inp} />
            <input placeholder="Store Banner URL" value={storefront.storeBanner} onChange={e => setStorefront({...storefront, storeBanner: e.target.value})} style={inp} />
            <div style={{ marginBottom: "12px" }}>
              <label style={{ color: "#aaa", fontSize: "13px", display: "block", marginBottom: "6px" }}>Store Color</label>
              <input type="color" value={storefront.storeColor} onChange={e => setStorefront({...storefront, storeColor: e.target.value})} style={{ width: "60px", height: "40px", border: "none", borderRadius: "8px", cursor: "pointer" }} />
            </div>
            <textarea placeholder="Store Description" value={storefront.storeDescription} onChange={e => setStorefront({...storefront, storeDescription: e.target.value})} style={{ ...inp, height: "100px", resize: "vertical" }} />
            <button onClick={saveStorefront} style={{ width: "100%", padding: "12px", background: "linear-gradient(135deg, #f97316, #dc2626)", color: "#fff", border: "none", borderRadius: "10px", cursor: "pointer", fontWeight: "700" }}>Save Storefront</button>
            <p style={{ color: "#888", fontSize: "13px", marginTop: "12px", textAlign: "center" }}>
              Your store: <a href={`/store/${seller.id}`} style={{ color: "#f97316" }}>View Storefront</a>
            </p>
          </div>
        </div>
      )}

      {/* PAYOUTS */}
      {tab === "Payouts" && (
        <div>
          <h2 style={{ color: "#fff", marginBottom: "16px" }}>Payout Requests</h2>
          <div style={{ background: "#1a1a1a", border: "1px solid #2a2a2a", borderRadius: "12px", padding: "20px", marginBottom: "20px" }}>
            <h3 style={{ color: "#f97316", marginBottom: "16px" }}>Request Payout</h3>
            <p style={{ color: "#888", fontSize: "13px", marginBottom: "12px" }}>Available: N{(analytics?.netRevenue || 0).toLocaleString()}</p>
            <input placeholder="Amount (N)" type="number" value={newPayout.amount} onChange={e => setNewPayout({...newPayout, amount: e.target.value})} style={inp} />
            <input placeholder="Bank Name" value={newPayout.bankName} onChange={e => setNewPayout({...newPayout, bankName: e.target.value})} style={inp} />
            <input placeholder="Account Number" value={newPayout.accountNumber} onChange={e => setNewPayout({...newPayout, accountNumber: e.target.value})} style={inp} />
            <input placeholder="Account Name" value={newPayout.accountName} onChange={e => setNewPayout({...newPayout, accountName: e.target.value})} style={inp} />
            <button onClick={requestPayout} style={{ width: "100%", padding: "12px", background: "linear-gradient(135deg, #f97316, #dc2626)", color: "#fff", border: "none", borderRadius: "10px", cursor: "pointer", fontWeight: "700" }}>Request Payout</button>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
            {payouts.length === 0 ? <p style={{ color: "#888" }}>No payout requests yet.</p> : payouts.map(p => (
              <div key={p._id} style={{ background: "#1a1a1a", border: "1px solid #2a2a2a", borderRadius: "12px", padding: "16px" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <div>
                    <p style={{ color: "#fff", fontWeight: "700", margin: "0 0 4px" }}>N{p.amount.toLocaleString()}</p>
                    <p style={{ color: "#888", fontSize: "13px", margin: "0 0 2px" }}>{p.bankName} — {p.accountNumber}</p>
                    <p style={{ color: "#888", fontSize: "12px", margin: 0 }}>{new Date(p.createdAt).toLocaleDateString()}</p>
                  </div>
                  <span style={{ padding: "4px 12px", borderRadius: "999px", fontSize: "12px", fontWeight: "700", background: p.status === "paid" ? "#0a2a1a" : p.status === "rejected" ? "#2a1010" : "#1a1a0a", color: p.status === "paid" ? "#22c55e" : p.status === "rejected" ? "#f87171" : "#fbbf24" }}>{p.status.toUpperCase()}</span>
                </div>
                {p.note && <p style={{ color: "#aaa", fontSize: "13px", marginTop: "8px" }}>Note: {p.note}</p>}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* DISPUTES */}
      {tab === "Disputes" && (
        <div>
          <h2 style={{ color: "#fff", marginBottom: "16px" }}>Customer Disputes</h2>
          {selectedDispute ? (
            <div>
              <button onClick={() => setSelectedDispute(null)} style={{ background: "#1a1a1a", border: "1px solid #333", color: "#fff", padding: "8px 16px", borderRadius: "8px", cursor: "pointer", marginBottom: "16px" }}>← Back</button>
              <div style={{ background: "#1a1a1a", border: "1px solid #2a2a2a", borderRadius: "12px", padding: "16px", marginBottom: "16px" }}>
                <h3 style={{ color: "#fff", margin: "0 0 8px" }}>{selectedDispute.subject}</h3>
                <p style={{ color: "#888", fontSize: "13px", margin: 0 }}>From: {selectedDispute.customerEmail}</p>
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: "10px", marginBottom: "16px" }}>
                {selectedDispute.messages.map((m, i) => (
                  <div key={i} style={{ alignSelf: m.senderType === "seller" ? "flex-end" : "flex-start", background: m.senderType === "seller" ? "#1a0a00" : "#1a1a1a", border: `1px solid ${m.senderType === "seller" ? "#f97316" : "#333"}`, borderRadius: "10px", padding: "12px", maxWidth: "80%" }}>
                    <p style={{ color: "#888", fontSize: "11px", margin: "0 0 4px" }}>{m.sender}</p>
                    <p style={{ color: "#fff", fontSize: "14px", margin: 0 }}>{m.message}</p>
                  </div>
                ))}
              </div>
              <div style={{ display: "flex", gap: "8px" }}>
                <input value={disputeReply} onChange={e => setDisputeReply(e.target.value)} placeholder="Type your response..." style={{ ...inp, marginBottom: 0, flex: 1 }} />
                <button onClick={replyDispute} style={{ padding: "12px 20px", background: "linear-gradient(135deg, #f97316, #dc2626)", color: "#fff", border: "none", borderRadius: "10px", cursor: "pointer", fontWeight: "700" }}>Send</button>
              </div>
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
              {disputes.length === 0 ? <p style={{ color: "#888" }}>No disputes yet.</p> : disputes.map(d => (
                <div key={d._id} onClick={() => setSelectedDispute(d)} style={{ background: "#1a1a1a", border: "1px solid #2a2a2a", borderRadius: "12px", padding: "16px", cursor: "pointer" }}>
                  <div style={{ display: "flex", justifyContent: "space-between" }}>
                    <p style={{ color: "#fff", fontWeight: "700", margin: "0 0 4px" }}>{d.subject}</p>
                    <span style={{ padding: "2px 8px", borderRadius: "999px", fontSize: "11px", fontWeight: "700", background: d.status === "resolved" ? "#0a2a1a" : "#2a1a0a", color: d.status === "resolved" ? "#22c55e" : "#fbbf24" }}>{d.status}</span>
                  </div>
                  <p style={{ color: "#888", fontSize: "13px", margin: 0 }}>{d.customerEmail} — {new Date(d.createdAt).toLocaleDateString()}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* MESSAGES */}
      {tab === "Messages" && (
        <div>
          <h2 style={{ color: "#fff", marginBottom: "16px" }}>Customer Messages</h2>
          {selectedThread ? (
            <div>
              <button onClick={() => setSelectedThread(null)} style={{ background: "#1a1a1a", border: "1px solid #333", color: "#fff", padding: "8px 16px", borderRadius: "8px", cursor: "pointer", marginBottom: "16px" }}>← Back</button>
              <div style={{ background: "#1a1a1a", border: "1px solid #2a2a2a", borderRadius: "12px", padding: "16px", marginBottom: "16px" }}>
                <p style={{ color: "#fff", fontWeight: "700", margin: "0 0 4px" }}>{selectedThread.productName}</p>
                <p style={{ color: "#888", fontSize: "13px", margin: 0 }}>From: {selectedThread.customerName} ({selectedThread.customerEmail})</p>
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: "10px", marginBottom: "16px" }}>
                {selectedThread.messages.map((m, i) => (
                  <div key={i} style={{ alignSelf: m.senderType === "seller" ? "flex-end" : "flex-start", background: m.senderType === "seller" ? "#1a0a00" : "#1a1a1a", border: `1px solid ${m.senderType === "seller" ? "#f97316" : "#333"}`, borderRadius: "10px", padding: "12px", maxWidth: "80%" }}>
                    <p style={{ color: "#888", fontSize: "11px", margin: "0 0 4px" }}>{m.sender}</p>
                    <p style={{ color: "#fff", fontSize: "14px", margin: 0 }}>{m.message}</p>
                  </div>
                ))}
              </div>
              <div style={{ display: "flex", gap: "8px" }}>
                <input value={msgReply} onChange={e => setMsgReply(e.target.value)} placeholder="Type your reply..." style={{ ...inp, marginBottom: 0, flex: 1 }} />
                <button onClick={replyMessage} style={{ padding: "12px 20px", background: "linear-gradient(135deg, #f97316, #dc2626)", color: "#fff", border: "none", borderRadius: "10px", cursor: "pointer", fontWeight: "700" }}>Send</button>
              </div>
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
              {messages.length === 0 ? <p style={{ color: "#888" }}>No messages yet.</p> : messages.map(t => (
                <div key={t._id} onClick={() => setSelectedThread(t)} style={{ background: "#1a1a1a", border: "1px solid #2a2a2a", borderRadius: "12px", padding: "16px", cursor: "pointer" }}>
                  <p style={{ color: "#fff", fontWeight: "700", margin: "0 0 4px" }}>{t.productName}</p>
                  <p style={{ color: "#888", fontSize: "13px", margin: "0 0 2px" }}>{t.customerName} — {t.messages.length} message(s)</p>
                  <p style={{ color: "#aaa", fontSize: "13px", margin: 0 }}>{t.messages[t.messages.length-1]?.message?.substring(0, 60)}...</p>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

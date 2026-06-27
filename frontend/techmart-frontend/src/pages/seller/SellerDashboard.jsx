import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
const API = "https://techmart-backend-ecbi.onrender.com";

export default function SellerDashboard() {
  const navigate = useNavigate();
  const token = localStorage.getItem("sellerToken");
  const seller = JSON.parse(localStorage.getItem("seller") || "{}");
  const headers = { Authorization: `Bearer ${token}` };
  const [tab, setTab] = useState("Overview");
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showAddProduct, setShowAddProduct] = useState(false);
  const [newProduct, setNewProduct] = useState({ name: "", price: "", description: "", category: "", stock: "" });
  const [images, setImages] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [msg, setMsg] = useState("");

  useEffect(() => {
    if (!token) { navigate("/seller/login"); return; }
    fetchDashboard();
  }, []);

  const fetchDashboard = async () => {
    try {
      setLoading(true);
      const res = await axios.get(`${API}/api/seller/dashboard`, { headers });
      setData(res.data);
    } catch (err) {
      if (err.response?.status === 401) { navigate("/seller/login"); }
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
    } catch (err) { setMsg("Image upload failed"); }
    finally { setUploading(false); }
  };

  const addProduct = async () => {
    setMsg("");
    if (!newProduct.name || !newProduct.price || !newProduct.stock) { setMsg("Name, price and stock are required"); return; }
    try {
      const formData = new FormData();
      Object.entries(newProduct).forEach(([k, v]) => formData.append(k, v));
      images.forEach(url => formData.append("imageUrls", url));
      const res = await axios.post(`${API}/api/seller/products`, { ...newProduct, images }, { headers });
      setData(prev => ({ ...prev, products: [res.data.data, ...(prev?.products || [])] }));
      setShowAddProduct(false);
      setNewProduct({ name: "", price: "", description: "", category: "", stock: "" });
      setImages([]);
      setMsg("Product added successfully!");
    } catch (err) { setMsg(err.response?.data?.error || "Failed to add product"); }
  };

  const deleteProduct = async (id) => {
    if (!window.confirm("Delete this product?")) return;
    try {
      await axios.delete(`${API}/api/seller/products/${id}`, { headers });
      setData(prev => ({ ...prev, products: prev.products.filter(p => p._id !== id) }));
    } catch (err) { setMsg("Failed to delete product"); }
  };

  if (loading) return <div style={{ minHeight: "100vh", background: "#0a0a0a", display: "flex", alignItems: "center", justifyContent: "center", color: "#fff" }}>Loading...</div>;

  const inp = { width: "100%", padding: "12px 16px", background: "#111", border: "1px solid #333", borderRadius: "10px", color: "#fff", fontSize: "14px", outline: "none", boxSizing: "border-box", marginBottom: "12px" };
  const TABS = ["Overview", "Products", "Orders"];

  return (
    <div style={{ minHeight: "100vh", background: "#0a0a0a", padding: "16px" }}>
      {/* HEADER */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "24px", flexWrap: "wrap", gap: "12px" }}>
        <div>
          <h1 style={{ color: "#f97316", fontSize: "22px", fontWeight: "900", margin: 0 }}>TechMart Seller</h1>
          <p style={{ color: "#888", fontSize: "13px", margin: 0 }}>{seller.storeName}</p>
        </div>
        <button onClick={() => { localStorage.removeItem("sellerToken"); localStorage.removeItem("seller"); navigate("/seller/login"); }}
          style={{ background: "#1a1a1a", border: "1px solid #333", color: "#888", padding: "8px 16px", borderRadius: "8px", cursor: "pointer", fontSize: "13px" }}>
          Logout
        </button>
      </div>

      {/* TABS */}
      <div style={{ display: "flex", gap: "8px", marginBottom: "24px", flexWrap: "wrap" }}>
        {TABS.map(t => (
          <button key={t} onClick={() => setTab(t)} style={{ padding: "8px 16px", borderRadius: "8px", border: "none", cursor: "pointer", fontWeight: "600", fontSize: "14px", background: tab === t ? "linear-gradient(135deg, #f97316, #dc2626)" : "#1a1a1a", color: tab === t ? "#fff" : "#888" }}>{t}</button>
        ))}
      </div>

      {msg && <div style={{ background: msg.includes("success") ? "#0a2a1a" : "#2a1010", border: `1px solid ${msg.includes("success") ? "#22c55e" : "#dc2626"}`, color: msg.includes("success") ? "#86efac" : "#f87171", padding: "12px 16px", borderRadius: "10px", fontSize: "14px", marginBottom: "16px" }}>{msg}</div>}

      {/* OVERVIEW */}
      {tab === "Overview" && (
        <div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))", gap: "16px", marginBottom: "24px" }}>
            {[
              { label: "Total Products", value: data?.totalProducts || 0, color: "#f97316" },
              { label: "Total Orders", value: data?.totalOrders || 0, color: "#22c55e" },
              { label: "Revenue", value: `N${(data?.revenue || 0).toLocaleString()}`, color: "#3b82f6" },
              { label: "Commission", value: `${data?.seller?.commission || 10}%`, color: "#a855f7" },
            ].map((stat, i) => (
              <div key={i} style={{ background: "#1a1a1a", border: "1px solid #2a2a2a", borderRadius: "12px", padding: "20px" }}>
                <p style={{ color: "#888", fontSize: "12px", margin: "0 0 8px", textTransform: "uppercase" }}>{stat.label}</p>
                <p style={{ color: stat.color, fontSize: "24px", fontWeight: "800", margin: 0 }}>{stat.value}</p>
              </div>
            ))}
          </div>
          <div style={{ background: "#1a1a1a", border: "1px solid #2a2a2a", borderRadius: "12px", padding: "20px" }}>
            <h3 style={{ color: "#fff", marginBottom: "12px" }}>Store Info</h3>
            <p style={{ color: "#888", fontSize: "14px", margin: "4px 0" }}>Store: <span style={{ color: "#fff" }}>{data?.seller?.storeName}</span></p>
            <p style={{ color: "#888", fontSize: "14px", margin: "4px 0" }}>Email: <span style={{ color: "#fff" }}>{data?.seller?.email}</span></p>
            <p style={{ color: "#888", fontSize: "14px", margin: "4px 0" }}>Status: <span style={{ color: "#22c55e", fontWeight: "700" }}>Approved</span></p>
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
              <p style={{ color: "#888", textAlign: "center", padding: "40px" }}>No products yet. Add your first product!</p>
            ) : (data?.products || []).map(p => (
              <div key={p._id} style={{ background: "#1a1a1a", border: "1px solid #2a2a2a", borderRadius: "12px", padding: "16px", display: "flex", gap: "16px", alignItems: "center" }}>
                <img src={p.images?.[0] || "https://placehold.co/60x60?text=No+Image"} style={{ width: "60px", height: "60px", objectFit: "cover", borderRadius: "8px", flexShrink: 0 }} />
                <div style={{ flex: 1 }}>
                  <p style={{ color: "#fff", fontWeight: "700", margin: "0 0 4px" }}>{p.name}</p>
                  <p style={{ color: "#f97316", fontWeight: "700", margin: "0 0 4px" }}>N{p.price?.toLocaleString()}</p>
                  <p style={{ color: "#888", fontSize: "13px", margin: 0 }}>Stock: {p.stock}</p>
                </div>
                <button onClick={() => deleteProduct(p._id)} style={{ background: "#dc2626", color: "#fff", border: "none", borderRadius: "8px", padding: "8px 12px", cursor: "pointer", fontSize: "13px" }}>Delete</button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ORDERS */}
      {tab === "Orders" && (
        <div>
          <h2 style={{ color: "#fff", marginBottom: "16px" }}>My Orders</h2>
          <p style={{ color: "#888" }}>Orders containing your products will appear here.</p>
        </div>
      )}
    </div>
  );
}

import { useEffect, useState } from "react";
import { OrderCardSkeleton, TransactionSkeleton, ProfileSkeleton } from "../components/Skeleton";
import { useNavigate, Link } from "react-router-dom";
import axios from "axios";
const API = import.meta.env.VITE_API_URL || "https://techmart-backend-ecbi.onrender.com";

export default function Account() {
  const navigate = useNavigate();
  const user = (() => { try { return JSON.parse(localStorage.getItem("user")); } catch { return null; } })();
  const token = localStorage.getItem("token");
  const headers = { Authorization: `Bearer ${token}` };
  const [tab, setTab] = useState("Wallet");
  const [wallet, setWallet] = useState({ balance: 0, transactions: [] });
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!token || !user) { navigate("/login"); return; }
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [walletRes, ordersRes] = await Promise.all([
        axios.get(`${API}/api/pay/dashboard`, { headers }),
        axios.get(`${API}/api/orders/me`, { headers }).catch(() => ({ data: [] })),
      ]);
      setWallet({ balance: walletRes.data.balance || 0, transactions: walletRes.data.recentTransactions || [] });
      setOrders(ordersRes.data || []);
    } catch (err) {
      console.error(err);
    } finally { setLoading(false); }
  };

  const TABS = ["Wallet", "Orders", "Profile"];

  if (loading) return (
    <div style={{ maxWidth: "800px", margin: "0 auto", padding: "16px", minHeight: "100vh" }}>
      <OrderCardSkeleton count={3} />
    </div>
  );

  return (
    <div style={{ maxWidth: "800px", margin: "0 auto", padding: "16px", minHeight: "100vh" }}>
      {/* HEADER */}
      <div style={{ display: "flex", alignItems: "center", gap: "16px", marginBottom: "24px" }}>
        <div style={{ width: "52px", height: "52px", borderRadius: "50%", background: "linear-gradient(135deg, #f97316, #dc2626)", display: "flex", alignItems: "center", justifyContent: "center", color: "var(--text-primary)", fontSize: "22px", fontWeight: "800", flexShrink: 0 }}>
          {user?.name?.charAt(0).toUpperCase()}
        </div>
        <div>
          <h1 style={{ color: "var(--text-primary)", fontSize: "20px", fontWeight: "800", margin: 0 }}>{user?.name}</h1>
          <p style={{ color: "var(--text-muted)", fontSize: "13px", margin: 0 }}>{user?.email}</p>
        </div>
      </div>

      {/* TABS */}
      <div style={{ display: "flex", gap: "8px", marginBottom: "24px", flexWrap: "wrap" }}>
        {TABS.map(t => (
          <button key={t} onClick={() => setTab(t)} style={{ padding: "8px 20px", borderRadius: "8px", border: "none", cursor: "pointer", fontWeight: "600", fontSize: "14px", background: tab === t ? "linear-gradient(135deg, #f97316, #dc2626)" : "#1a1a1a", color: tab === t ? "#fff" : "#888" }}>{t}</button>
        ))}
      </div>

      {/* WALLET TAB */}
      {tab === "Wallet" && (
        <div>
          {/* Balance Card */}
          <div style={{ background: "linear-gradient(135deg, #f97316, #dc2626)", borderRadius: "16px", padding: "28px", marginBottom: "20px", textAlign: "center" }}>
            <p style={{ color: "rgba(255,255,255,0.8)", fontSize: "14px", margin: "0 0 8px" }}>TechMart Wallet Balance</p>
            <p style={{ color: "var(--text-primary)", fontSize: "36px", fontWeight: "900", margin: "0 0 8px" }}>₦{(wallet.balance || 0).toLocaleString()}</p>
            <p style={{ color: "rgba(255,255,255,0.7)", fontSize: "12px", margin: 0 }}>Earn 2% cashback on every order</p>
            <Link to="/pay" style={{ display: "inline-block", marginTop: "12px", padding: "8px 20px", background: "rgba(255,255,255,0.2)", color: "var(--text-primary)", borderRadius: "999px", textDecoration: "none", fontWeight: "700", fontSize: "13px" }}>Open TechMart Pay →</Link>
          </div>

          {/* How it works */}
          <div style={{ background: "var(--bg-card)", border: "1px solid #2a2a2a", borderRadius: "12px", padding: "16px", marginBottom: "20px" }}>
            <h3 style={{ color: "var(--text-primary)", fontSize: "15px", fontWeight: "700", margin: "0 0 12px" }}>How TechMart Wallet Works</h3>
            <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
              {[
                { icon: "🛒", text: "Shop on TechMart and earn 2% cashback automatically" },
                { icon: "💰", text: "Cashback is credited to your wallet after payment" },
                { icon: "⚡", text: "Use your wallet balance to pay for future orders" },
              ].map((item, i) => (
                <div key={i} style={{ display: "flex", gap: "12px", alignItems: "flex-start" }}>
                  <span style={{ fontSize: "18px" }}>{item.icon}</span>
                  <p style={{ color: "var(--text-secondary)", fontSize: "14px", margin: 0 }}>{item.text}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Transaction History */}
          <div style={{ background: "var(--bg-card)", border: "1px solid #2a2a2a", borderRadius: "12px", padding: "16px" }}>
            <h3 style={{ color: "var(--text-primary)", fontSize: "15px", fontWeight: "700", margin: "0 0 16px" }}>Transaction History</h3>
            {wallet.transactions.length === 0 ? (
              <p style={{ color: "var(--text-muted)", textAlign: "center", padding: "20px 0" }}>No transactions yet. Start shopping to earn cashback!</p>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                {[...wallet.transactions].reverse().map((tx, i) => (
                  <div key={i} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", paddingBottom: "12px", borderBottom: "1px solid var(--border-light)" }}>
                    <div>
                      <p style={{ color: "var(--text-primary)", fontSize: "14px", fontWeight: "600", margin: "0 0 2px" }}>{tx.description}</p>
                      <p style={{ color: "var(--text-muted)", fontSize: "12px", margin: 0 }}>{new Date(tx.createdAt).toLocaleDateString()}</p>
                    </div>
                    <p style={{ color: tx.type === "credit" ? "#22c55e" : "#f87171", fontWeight: "700", fontSize: "15px", margin: 0 }}>
                      {tx.type === "credit" ? "+" : "-"}₦{tx.amount.toLocaleString()}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ORDERS TAB */}
      {tab === "Orders" && (
        <div>
          <h2 style={{ color: "var(--text-primary)", marginBottom: "16px" }}>My Orders</h2>
          {orders.length === 0 ? (
            <div style={{ background: "var(--bg-card)", border: "1px solid #2a2a2a", borderRadius: "12px", padding: "40px", textAlign: "center" }}>
              <p style={{ fontSize: "40px", margin: "0 0 12px" }}>📦</p>
              <p style={{ color: "var(--text-muted)" }}>No orders yet.</p>
              <Link to="/"><button style={{ marginTop: "12px", padding: "10px 24px", background: "linear-gradient(135deg, #f97316, #dc2626)", color: "var(--text-primary)", border: "none", borderRadius: "10px", cursor: "pointer", fontWeight: "700" }}>Shop Now</button></Link>
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
              {orders.map(o => (
                <div key={o._id} style={{ background: "var(--bg-card)", border: "1px solid #2a2a2a", borderRadius: "12px", padding: "16px" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "12px" }}>
                    <p style={{ color: "var(--text-muted)", fontSize: "12px", margin: 0 }}>{o.reference}</p>
                    <span style={{ padding: "4px 10px", borderRadius: "999px", fontSize: "12px", fontWeight: "700", background: o.status === "Delivered" ? "#0a2a1a" : "#1a1a0a", color: o.status === "Delivered" ? "#22c55e" : "#fbbf24" }}>{o.status}</span>
                  </div>
                  <p style={{ color: "var(--text-primary)", fontWeight: "700", fontSize: "15px", margin: "0 0 4px" }}>₦{o.amount?.toLocaleString()}</p>
                  <p style={{ color: "var(--text-muted)", fontSize: "13px", margin: 0 }}>{o.items?.length} item(s) · {new Date(o.createdAt).toLocaleDateString()}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* PROFILE TAB */}
      {tab === "Profile" && (
        <div style={{ background: "var(--bg-card)", border: "1px solid #2a2a2a", borderRadius: "12px", padding: "24px" }}>
          <h2 style={{ color: "var(--text-primary)", marginBottom: "20px" }}>Profile</h2>
          <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
            {[
              { label: "Full Name", value: user?.name },
              { label: "Email", value: user?.email },
              { label: "Phone", value: user?.phone || "Not set" },
              { label: "Member Since", value: user?.createdAt ? new Date(user.createdAt).toLocaleDateString() : "TechMart Member" },
            ].map((item, i) => (
              <div key={i} style={{ paddingBottom: "16px", borderBottom: "1px solid var(--border-light)" }}>
                <p style={{ color: "var(--text-muted)", fontSize: "12px", textTransform: "uppercase", letterSpacing: "0.5px", margin: "0 0 4px" }}>{item.label}</p>
                <p style={{ color: "var(--text-primary)", fontSize: "15px", fontWeight: "600", margin: 0 }}>{item.value}</p>
              </div>
            ))}
          </div>
          <button onClick={() => { const t = localStorage.getItem("token"); if (t) fetch(`${import.meta.env.VITE_API_URL || "https://techmart-backend-ecbi.onrender.com"}/api/auth/logout`, { method: "POST", headers: { Authorization: `Bearer ${t}` } }).catch(() => {}); localStorage.removeItem("token"); localStorage.removeItem("user"); localStorage.removeItem("deviceToken"); window.dispatchEvent(new StorageEvent("storage", { key: "token", newValue: null })); navigate("/login"); }}
            style={{ marginTop: "20px", width: "100%", padding: "12px", background: "var(--bg-card)", border: "1px solid #dc2626", color: "#dc2626", borderRadius: "10px", cursor: "pointer", fontWeight: "700", fontSize: "14px" }}>
            Logout
          </button>
        </div>
      )}
    </div>
  );
}

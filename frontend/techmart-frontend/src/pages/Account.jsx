import { useEffect, useState } from "react";
import { useToast } from "../App";
import { OrderCardSkeleton, TransactionSkeleton, ProfileSkeleton } from "../components/Skeleton";
import { useNavigate, Link } from "react-router-dom";
import axios from "axios";
const API = import.meta.env.VITE_API_URL || "https://techmart-backend-ecbi.onrender.com";

export default function Account() {
  const showToast = useToast();
  const navigate = useNavigate();
  const user = (() => { try { return JSON.parse(localStorage.getItem("user")); } catch { return null; } })();
  const token = localStorage.getItem("token");
  const headers = { Authorization: `Bearer ${token}` };
  const [tab, setTab] = useState("Wallet");
  const [wallet, setWallet] = useState({ balance: 0, transactions: [] });

  const [networkStatus, setNetworkStatus] = useState(null);
  const [networkLoading, setNetworkLoading] = useState(false);
  const [networkError, setNetworkError] = useState("");
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

      setNetworkLoading(true);
      try {
        const networkRes = await axios.get(`${API}/api/network/status`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        setNetworkStatus(networkRes.data);
        setNetworkError("");
      } catch (networkErr) {
        console.error("Network status error:", networkErr);
        setNetworkError("Unable to load your TechMart Network status.");
      } finally {
        setNetworkLoading(false);
      }
      setOrders(ordersRes.data || []);
    } catch (err) {
      console.error(err);
    } finally { setLoading(false); }
  };

  const TABS = ["Wallet", "Network", "Orders", "Profile"];

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
      {tab === "Network" && (
        <div style={{
          maxWidth: "900px",
          margin: "0 auto",
          padding: "10px 0 40px"
        }}>
          <div style={{
            padding: "24px",
            borderRadius: "20px",
            background: "linear-gradient(135deg, #111827, #172554, #1e1b4b)",
            border: "1px solid rgba(99,102,241,0.35)",
            boxShadow: "0 15px 45px rgba(0,0,0,0.25)",
            marginBottom: "20px"
          }}>
            <div style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "flex-start",
              gap: "20px",
              flexWrap: "wrap"
            }}>
              <div>
                <div style={{
                  fontSize: "12px",
                  fontWeight: "800",
                  letterSpacing: "1.5px",
                  color: "#818cf8",
                  marginBottom: "8px"
                }}>
                  🔗 TECHMART NETWORK
                </div>

                <h2 style={{
                  margin: "0 0 8px",
                  color: "#fff",
                  fontSize: "26px",
                  fontWeight: "800"
                }}>
                  Your TechMart Membership
                </h2>

                <p style={{
                  margin: 0,
                  color: "rgba(255,255,255,0.72)",
                  lineHeight: 1.6,
                  fontSize: "14px",
                  maxWidth: "600px"
                }}>
                  Shop, save, earn loyalty rewards, use your wallet, access BNPL,
                  grow your savings and unlock increasingly valuable TechMart benefits.
                </p>
              </div>

              {networkStatus && (
                <div style={{
                  minWidth: "120px",
                  padding: "14px 18px",
                  borderRadius: "14px",
                  background: "rgba(99,102,241,0.18)",
                  border: "1px solid rgba(129,140,248,0.35)",
                  textAlign: "center"
                }}>
                  <div style={{
                    color: "#a5b4fc",
                    fontSize: "11px",
                    fontWeight: "800",
                    textTransform: "uppercase"
                  }}>
                    Current Tier
                  </div>

                  <div style={{
                    color: "#fff",
                    fontSize: "22px",
                    fontWeight: "900",
                    marginTop: "4px"
                  }}>
                    {networkStatus.tier || networkStatus.networkTier || "Member"}
                  </div>
                </div>
              )}
            </div>
          </div>

          {networkLoading && (
            <div style={{
              padding: "30px",
              textAlign: "center",
              color: "var(--text-muted)"
            }}>
              Loading your Network benefits...
            </div>
          )}

          {networkError && !networkLoading && (
            <div style={{
              padding: "18px",
              borderRadius: "12px",
              background: "rgba(239,68,68,0.08)",
              border: "1px solid rgba(239,68,68,0.25)",
              color: "#fca5a5",
              marginBottom: "18px"
            }}>
              {networkError}
            </div>
          )}

          {networkStatus && !networkLoading && (
            <>
              <div style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
                gap: "12px",
                marginBottom: "18px"
              }}>
                <div style={{
                  padding: "18px",
                  borderRadius: "14px",
                  background: "var(--card-bg, #111)",
                  border: "1px solid rgba(255,255,255,0.08)"
                }}>
                  <div style={{ color: "var(--text-muted)", fontSize: "12px" }}>
                    Network Score
                  </div>
                  <div style={{
                    color: "var(--text-primary)",
                    fontSize: "28px",
                    fontWeight: "900",
                    marginTop: "5px"
                  }}>
                    {Number(networkStatus.score ?? networkStatus.networkScore ?? 0).toLocaleString()}
                  </div>
                </div>

                <div style={{
                  padding: "18px",
                  borderRadius: "14px",
                  background: "var(--card-bg, #111)",
                  border: "1px solid rgba(255,255,255,0.08)"
                }}>
                  <div style={{ color: "var(--text-muted)", fontSize: "12px" }}>
                    Lifetime Spend
                  </div>
                  <div style={{
                    color: "var(--text-primary)",
                    fontSize: "22px",
                    fontWeight: "900",
                    marginTop: "8px"
                  }}>
                    ₦{Number(
                      networkStatus.lifetimeSpend ??
                      networkStatus.networkLifetimeSpend ??
                      0
                    ).toLocaleString()}
                  </div>
                </div>

                <div style={{
                  padding: "18px",
                  borderRadius: "14px",
                  background: "var(--card-bg, #111)",
                  border: "1px solid rgba(255,255,255,0.08)"
                }}>
                  <div style={{ color: "var(--text-muted)", fontSize: "12px" }}>
                    Referrals
                  </div>
                  <div style={{
                    color: "var(--text-primary)",
                    fontSize: "28px",
                    fontWeight: "900",
                    marginTop: "5px"
                  }}>
                    {Number(
                      networkStatus.referralCount ??
                      networkStatus.networkReferralCount ??
                      0
                    ).toLocaleString()}
                  </div>
                </div>
              </div>

              {(() => {
                const score = Number(
                  networkStatus.score ??
                  networkStatus.networkScore ??
                  0
                );

                const nextThreshold = Number(
                  networkStatus.nextTierThreshold ??
                  networkStatus.nextThreshold ??
                  0
                );

                const progress = nextThreshold > 0
                  ? Math.min(100, (score / nextThreshold) * 100)
                  : 100;

                return (
                  <div style={{
                    padding: "20px",
                    borderRadius: "16px",
                    background: "var(--card-bg, #111)",
                    border: "1px solid rgba(255,255,255,0.08)",
                    marginBottom: "18px"
                  }}>
                    <div style={{
                      display: "flex",
                      justifyContent: "space-between",
                      gap: "12px",
                      marginBottom: "10px"
                    }}>
                      <span style={{
                        color: "var(--text-primary)",
                        fontWeight: "800"
                      }}>
                        Network Progress
                      </span>

                      <span style={{
                        color: "#818cf8",
                        fontWeight: "800",
                        fontSize: "13px"
                      }}>
                        {nextThreshold > 0
                          ? `${Math.round(progress)}%`
                          : "Maximum tier"}
                      </span>
                    </div>

                    <div style={{
                      height: "10px",
                      borderRadius: "999px",
                      background: "rgba(255,255,255,0.08)",
                      overflow: "hidden"
                    }}>
                      <div style={{
                        width: `${progress}%`,
                        height: "100%",
                        borderRadius: "999px",
                        background: "linear-gradient(90deg, #6366f1, #8b5cf6, #ec4899)",
                        transition: "width 0.4s ease"
                      }} />
                    </div>

                    {nextThreshold > score && (
                      <p style={{
                        margin: "10px 0 0",
                        color: "var(--text-muted)",
                        fontSize: "12px"
                      }}>
                        {(nextThreshold - score).toLocaleString()} more Network
                        points to reach the next tier.
                      </p>
                    )}
                  </div>
                );
              })()}

              <div style={{
                padding: "20px",
                borderRadius: "16px",
                background: "var(--card-bg, #111)",
                border: "1px solid rgba(255,255,255,0.08)",
                marginBottom: "18px"
              }}>
                <h3 style={{
                  margin: "0 0 16px",
                  color: "var(--text-primary)",
                  fontSize: "17px"
                }}>
                  🎁 Your Network Benefits
                </h3>

                <div style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
                  gap: "10px"
                }}>
                  {[
                    [
                      "💰",
                      `${Number(networkStatus.benefits?.cashbackMultiplier ?? networkStatus.networkBenefits?.cashbackMultiplier ?? 1)}× Cashback`,
                      "Enhanced wallet cashback"
                    ],
                    [
                      "⭐",
                      `${Number(networkStatus.benefits?.loyaltyMultiplier ?? networkStatus.networkBenefits?.loyaltyMultiplier ?? 1)}× Loyalty`,
                      "Earn loyalty points faster"
                    ],
                    [
                      "🔥",
                      "Exclusive Deals",
                      networkStatus.benefits?.exclusiveDeals ?? networkStatus.networkBenefits?.exclusiveDeals
                        ? "Unlocked for your tier"
                        : "Reach the next tier to unlock"
                    ],
                    [
                      "🛟",
                      "Priority Support",
                      networkStatus.benefits?.prioritySupport ?? networkStatus.networkBenefits?.prioritySupport
                        ? "Priority assistance unlocked"
                        : "Available at higher tiers"
                    ]
                  ].map(([icon, title, description]) => (
                    <div key={title} style={{
                      padding: "15px",
                      borderRadius: "12px",
                      background: "rgba(255,255,255,0.035)",
                      border: "1px solid rgba(255,255,255,0.06)"
                    }}>
                      <div style={{ fontSize: "20px", marginBottom: "7px" }}>
                        {icon}
                      </div>

                      <div style={{
                        color: "var(--text-primary)",
                        fontWeight: "800",
                        fontSize: "14px"
                      }}>
                        {title}
                      </div>

                      <div style={{
                        color: "var(--text-muted)",
                        fontSize: "12px",
                        lineHeight: 1.5,
                        marginTop: "4px"
                      }}>
                        {description}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div style={{
                padding: "20px",
                borderRadius: "16px",
                background: "linear-gradient(135deg, rgba(16,185,129,0.08), rgba(59,130,246,0.08))",
                border: "1px solid rgba(16,185,129,0.18)"
              }}>
                <h3 style={{
                  margin: "0 0 12px",
                  color: "var(--text-primary)",
                  fontSize: "17px"
                }}>
                  🚀 Grow Your Network Benefits
                </h3>

                <div style={{
                  display: "grid",
                  gap: "9px",
                  color: "var(--text-muted)",
                  fontSize: "13px",
                  lineHeight: 1.5
                }}>
                  <div>🛍️ Shop on TechMart and build your Network Score.</div>
                  <div>💳 Use your TechMart Wallet and unlock stronger wallet benefits.</div>
                  <div>⭐ Earn loyalty points and redeem your rewards.</div>
                  <div>🔄 Complete eligible BNPL plans responsibly.</div>
                  <div>💰 Grow your savings and maintain your TechMart relationship.</div>
                  <div>👥 Refer friends and grow your Network activity.</div>
                </div>
              </div>
            </>
          )}
        </div>
      )}

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
              { label: "Referral Code", value: user?.referralCode || "—" },
            ].map((item, i) => (
              <div key={i} style={{ paddingBottom: "16px", borderBottom: "1px solid var(--border-light)" }}>
                <p style={{ color: "var(--text-muted)", fontSize: "12px", textTransform: "uppercase", letterSpacing: "0.5px", margin: "0 0 4px" }}>{item.label}</p>
                <p style={{ color: "var(--text-primary)", fontSize: "15px", fontWeight: "600", margin: 0 }}>{item.value}</p>
              </div>
            ))}
          </div>
          {user?.referralCode && (
            <div style={{ background: "var(--bg-secondary)", border: "1px solid #f97316", borderRadius: "12px", padding: "16px", marginTop: "16px", marginBottom: "8px" }}>
              <p style={{ color: "#f97316", fontWeight: "700", fontSize: "14px", margin: "0 0 8px" }}>🎁 Refer & Earn</p>
              <p style={{ color: "var(--text-muted)", fontSize: "13px", margin: "0 0 12px" }}>Share your code and earn ₦500 for every friend who signs up!</p>
              <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
                <div style={{ flex: 1, background: "var(--bg-card)", border: "1px solid var(--border-color)", borderRadius: "8px", padding: "10px 14px", fontFamily: "monospace", fontWeight: "700", fontSize: "16px", color: "var(--text-primary)", letterSpacing: "2px" }}>{user.referralCode}</div>
                <button onClick={() => { navigator.clipboard?.writeText(user.referralCode); showToast("Referral code copied!", "success"); }} style={{ padding: "10px 16px", background: "linear-gradient(135deg, #f97316, #dc2626)", color: "#fff", border: "none", borderRadius: "8px", cursor: "pointer", fontWeight: "700", fontSize: "13px" }}>Copy</button>
              </div>
            </div>
          )}
          <button onClick={() => { const t = localStorage.getItem("token"); if (t) fetch(`${import.meta.env.VITE_API_URL || "https://techmart-backend-ecbi.onrender.com"}/api/auth/logout`, { method: "POST", headers: { Authorization: `Bearer ${t}` } }).catch(() => {}); localStorage.removeItem("token"); localStorage.removeItem("user"); localStorage.removeItem("deviceToken"); localStorage.removeItem("cart"); localStorage.removeItem("wishlist"); localStorage.removeItem("lastCartItems"); window.dispatchEvent(new StorageEvent("storage", { key: "token", newValue: null })); window.dispatchEvent(new Event("techmart-auth-change")); navigate("/login"); }}
            style={{ marginTop: "20px", width: "100%", padding: "12px", background: "var(--bg-card)", border: "1px solid #dc2626", color: "#dc2626", borderRadius: "10px", cursor: "pointer", fontWeight: "700", fontSize: "14px" }}>
            Logout
          </button>
        </div>
      )}
    </div>
  );
}

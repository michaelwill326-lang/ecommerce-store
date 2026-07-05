import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";

const API = import.meta.env.VITE_API_URL || "https://techmart-backend-ecbi.onrender.com";

export default function TechMartPay() {
  const navigate = useNavigate();
  const token = localStorage.getItem("token");
  const headers = { Authorization: `Bearer ${token}` };
  const [tab, setTab] = useState("Dashboard");
  const [dashboard, setDashboard] = useState(null);
  const [loading, setLoading] = useState(true);
  const [msg, setMsg] = useState({ text: "", type: "" });
  const [banks, setBanks] = useState([]);

  // Send money state
  const [sendForm, setSendForm] = useState({ recipientEmail: "", amount: "", note: "" });
  const [sendLoading, setSendLoading] = useState(false);

  // Withdraw state
  const [withdrawForm, setWithdrawForm] = useState({ amount: "", bankCode: "", accountNumber: "", accountName: "" });
  const [withdrawLoading, setWithdrawLoading] = useState(false);
  const [verifyingAccount, setVerifyingAccount] = useState(false);

  // Airtime state
  const [airtimeForm, setAirtimeForm] = useState({ phone: "", amount: "", network: "" });
  const [airtimeLoading, setAirtimeLoading] = useState(false);
  // Data bundle state
  const [dataForm, setDataForm] = useState({ phone: "", network: "", planId: "", planName: "", amount: "" });
  const [dataPlans, setDataPlans] = useState([]);
  const [dataLoading, setDataLoading] = useState(false);
  const [dataPlansLoading, setDataPlansLoading] = useState(false);
  // Electricity state
  const [elecForm, setElecForm] = useState({ meterNumber: "", disco: "", meterType: "prepaid", amount: "", customerName: "" });
  const [elecLoading, setElecLoading] = useState(false);
  const [elecVerified, setElecVerified] = useState(false);
  const [elecVerifying, setElecVerifying] = useState(false);

  // Virtual account state
  const [vaLoading, setVaLoading] = useState(false);

  useEffect(() => {
    if (!token) { navigate("/login"); return; }
    fetchDashboard();
    fetchBanks();
  }, []);

  const fetchDashboard = async () => {
    try {
      const res = await axios.get(`${API}/api/pay/dashboard`, { headers });
      setDashboard(res.data);
    } catch (err) {
      if (err.response?.status === 401) navigate("/login");
    } finally { setLoading(false); }
  };

  const fetchBanks = async () => {
    try {
      const res = await axios.get(`${API}/api/pay/banks`);
      setBanks(res.data || []);
    } catch {}
  };

  const createVirtualAccount = async () => {
    setVaLoading(true);
    try {
      const res = await axios.post(`${API}/api/pay/virtual-account`, {}, { headers });
      setDashboard(prev => ({ ...prev, virtualAccount: res.data.account }));
      setMsg({ text: "Virtual account created!", type: "success" });
    } catch (err) {
      setMsg({ text: err.response?.data?.error === "Failed to create virtual account" ? "Virtual account funding is coming soon. We're setting this up with our banking partner." : err.response?.data?.error, type: "error" });
    } finally { setVaLoading(false); }
  };

  const sendMoney = async () => {
    setMsg({ text: "", type: "" });
    if (!sendForm.recipientEmail || !sendForm.amount) { setMsg({ text: "Please fill all fields", type: "error" }); return; }
    setSendLoading(true);
    try {
      const res = await axios.post(`${API}/api/pay/send`, sendForm, { headers });
      setMsg({ text: res.data.message, type: "success" });
      setSendForm({ recipientEmail: "", amount: "", note: "" });
      fetchDashboard();
    } catch (err) {
      setMsg({ text: err.response?.data?.error || "Transfer failed", type: "error" });
    } finally { setSendLoading(false); }
  };

  const verifyAccount = async () => {
    if (!withdrawForm.accountNumber || !withdrawForm.bankCode) return;
    setVerifyingAccount(true);
    try {
      const res = await axios.post(`${API}/api/pay/verify-account`, { accountNumber: withdrawForm.accountNumber, bankCode: withdrawForm.bankCode }, { headers });
      setWithdrawForm(prev => ({ ...prev, accountName: res.data.accountName }));
      setMsg({ text: `Account verified: ${res.data.accountName}`, type: "success" });
    } catch {
      setMsg({ text: "Could not verify account", type: "error" });
    } finally { setVerifyingAccount(false); }
  };

  const withdraw = async () => {
    setMsg({ text: "", type: "" });
    if (!withdrawForm.amount || !withdrawForm.bankCode || !withdrawForm.accountNumber || !withdrawForm.accountName) {
      setMsg({ text: "Please fill all fields and verify account", type: "error" }); return;
    }
    setWithdrawLoading(true);
    try {
      const res = await axios.post(`${API}/api/pay/withdraw`, withdrawForm, { headers });
      setMsg({ text: res.data.message, type: "success" });
      setWithdrawForm({ amount: "", bankCode: "", accountNumber: "", accountName: "" });
      fetchDashboard();
    } catch (err) {
      setMsg({ text: err.response?.data?.error || "Withdrawal failed", type: "error" });
    } finally { setWithdrawLoading(false); }
  };

  const buyAirtime = async () => {
    setMsg({ text: "", type: "" });
    if (!airtimeForm.phone || !airtimeForm.amount || !airtimeForm.network) {
      setMsg({ text: "Please fill all fields", type: "error" }); return;
    }
    setAirtimeLoading(true);
    try {
      const res = await axios.post(`${API}/api/pay/airtime`, airtimeForm, { headers });
      setMsg({ text: res.data.message, type: "success" });
      setAirtimeForm({ phone: "", amount: "", network: "" });
      fetchDashboard();
    } catch (err) {
      setMsg({ text: err.response?.data?.error || "Airtime purchase failed", type: "error" });
    } finally { setAirtimeLoading(false); }
  };

  const fetchDataPlans = async (network) => {
    setDataPlansLoading(true);
    setDataPlans([]);
    try {
      const res = await axios.get(`${API}/api/pay/data-plans/${network}`, { headers });
      setDataPlans(res.data.plans || []);
    } catch { setMsg({ text: "Failed to load data plans", type: "error" }); }
    finally { setDataPlansLoading(false); }
  };
  const buyData = async () => {
    if (!dataForm.phone || !dataForm.network || !dataForm.planId) {
      return setMsg({ text: "Please select network, plan and enter phone number", type: "error" });
    }
    setDataLoading(true);
    try {
      const res = await axios.post(`${API}/api/pay/data`, dataForm, { headers });
      setMsg({ text: res.data.message, type: "success" });
      setDataForm({ phone: "", network: "", planId: "", planName: "", amount: "" });
      setDataPlans([]);
      fetchDashboard();
    } catch (err) {
      setMsg({ text: err.response?.data?.error || "Data purchase failed", type: "error" });
    } finally { setDataLoading(false); }
  };
  const verifyMeter = async () => {
    if (!elecForm.meterNumber || !elecForm.disco || !elecForm.meterType) {
      return setMsg({ text: "Please select disco and enter meter number", type: "error" });
    }
    setElecVerifying(true);
    setElecVerified(false);
    try {
      const res = await axios.post(`${API}/api/pay/electricity/verify`, elecForm, { headers });
      setElecForm(prev => ({ ...prev, customerName: res.data.data?.name || res.data.data?.customer_name || "Verified" }));
      setElecVerified(true);
      setMsg({ text: "Meter verified successfully", type: "success" });
    } catch {
      setMsg({ text: "Could not verify meter. Check the number and try again.", type: "error" });
    } finally { setElecVerifying(false); }
  };
  const payElectricity = async () => {
    if (!elecVerified) return setMsg({ text: "Please verify your meter first", type: "error" });
    if (!elecForm.amount || Number(elecForm.amount) < 500) return setMsg({ text: "Minimum payment is N500", type: "error" });
    setElecLoading(true);
    try {
      const res = await axios.post(`${API}/api/pay/electricity`, elecForm, { headers });
      setMsg({ text: res.data.message, type: "success" });
      setElecForm({ meterNumber: "", disco: "", meterType: "prepaid", amount: "", customerName: "" });
      setElecVerified(false);
      fetchDashboard();
    } catch (err) {
      setMsg({ text: err.response?.data?.error || "Payment failed", type: "error" });
    } finally { setElecLoading(false); }
  };
  const TABS = ["Dashboard", "Add Money", "Send Money", "Withdraw", "Airtime", "Data", "Electricity", "History"];
  const inp = { width: "100%", padding: "12px 16px", background: "#111", border: "1px solid #333", borderRadius: "10px", color: "#fff", fontSize: "14px", outline: "none", boxSizing: "border-box", marginBottom: "12px" };

  if (loading) return (
    <div style={{ minHeight: "100vh", background: "#0a0a0a", display: "flex", alignItems: "center", justifyContent: "center" }}>
      <p style={{ color: "#fff" }}>Loading TechMart Pay...</p>
    </div>
  );

  return (
    <div style={{ minHeight: "100vh", background: "#0a0a0a", padding: "16px", paddingBottom: "60px" }}>
      <div style={{ maxWidth: "600px", margin: "0 auto" }}>

        {/* HEADER */}
        <div style={{ textAlign: "center", marginBottom: "24px" }}>
          <h1 style={{ color: "#fff", fontSize: "24px", fontWeight: "900", margin: "0 0 4px" }}>
            <span style={{ color: "#f97316" }}>TechMart</span> Pay
          </h1>
          <p style={{ color: "#888", fontSize: "13px", margin: 0 }}>Your digital wallet</p>
        </div>

        {/* BALANCE CARD */}
        <div style={{ background: "linear-gradient(135deg, #f97316, #dc2626)", borderRadius: "20px", padding: "28px", marginBottom: "20px", textAlign: "center" }}>
          <p style={{ color: "rgba(255,255,255,0.8)", fontSize: "13px", margin: "0 0 8px", textTransform: "uppercase", letterSpacing: "1px" }}>Available Balance</p>
          <p style={{ color: "#fff", fontSize: "40px", fontWeight: "900", margin: "0 0 16px" }}>₦{(dashboard?.balance || 0).toLocaleString()}</p>
          <div style={{ display: "flex", justifyContent: "center", gap: "24px" }}>
            <div style={{ textAlign: "center" }}>
              <p style={{ color: "rgba(255,255,255,0.7)", fontSize: "11px", margin: "0 0 2px" }}>TOTAL IN</p>
              <p style={{ color: "#fff", fontWeight: "700", fontSize: "14px", margin: 0 }}>₦{(dashboard?.stats?.totalIn || 0).toLocaleString()}</p>
            </div>
            <div style={{ width: "1px", background: "rgba(255,255,255,0.3)" }} />
            <div style={{ textAlign: "center" }}>
              <p style={{ color: "rgba(255,255,255,0.7)", fontSize: "11px", margin: "0 0 2px" }}>TOTAL OUT</p>
              <p style={{ color: "#fff", fontWeight: "700", fontSize: "14px", margin: 0 }}>₦{(dashboard?.stats?.totalOut || 0).toLocaleString()}</p>
            </div>
            <div style={{ width: "1px", background: "rgba(255,255,255,0.3)" }} />
            <div style={{ textAlign: "center" }}>
              <p style={{ color: "rgba(255,255,255,0.7)", fontSize: "11px", margin: "0 0 2px" }}>TRANSACTIONS</p>
              <p style={{ color: "#fff", fontWeight: "700", fontSize: "14px", margin: 0 }}>{dashboard?.stats?.transactionCount || 0}</p>
            </div>
          </div>
        </div>

        {/* QUICK ACTIONS */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "10px", marginBottom: "20px" }}>
          {[
            { icon: "➕", label: "Add Money", tab: "Add Money" },
            { icon: "📤", label: "Send", tab: "Send Money" },
            { icon: "🏦", label: "Withdraw", tab: "Withdraw" },
            { icon: "📱", label: "Airtime", tab: "Airtime" },
            { icon: "📶", label: "Data", tab: "Data" },
            { icon: "⚡", label: "Electricity", tab: "Electricity" },
          ].map((a, i) => (
            <button key={i} onClick={() => setTab(a.tab)} style={{ background: "#1a1a1a", border: "1px solid #2a2a2a", borderRadius: "12px", padding: "14px 8px", cursor: "pointer", textAlign: "center" }}>
              <p style={{ fontSize: "22px", margin: "0 0 4px" }}>{a.icon}</p>
              <p style={{ color: "#fff", fontSize: "11px", fontWeight: "600", margin: 0 }}>{a.label}</p>
            </button>
          ))}
        </div>

        {/* TABS */}
        <div style={{ display: "flex", gap: "6px", marginBottom: "20px", overflowX: "auto", paddingBottom: "4px" }}>
          {TABS.map(t => (
            <button key={t} onClick={() => setTab(t)} style={{ padding: "8px 14px", borderRadius: "8px", border: "none", cursor: "pointer", fontWeight: "600", fontSize: "12px", whiteSpace: "nowrap", background: tab === t ? "linear-gradient(135deg, #f97316, #dc2626)" : "#1a1a1a", color: tab === t ? "#fff" : "#888" }}>{t}</button>
          ))}
        </div>

        {/* MESSAGE */}
        {msg.text && (
          <div style={{ background: msg.type === "success" ? "#0a2a1a" : "#2a1010", border: `1px solid ${msg.type === "success" ? "#22c55e" : "#dc2626"}`, color: msg.type === "success" ? "#86efac" : "#f87171", padding: "12px 16px", borderRadius: "10px", fontSize: "14px", marginBottom: "16px" }}>
            {msg.text}
          </div>
        )}

        {/* DASHBOARD TAB */}
        {tab === "Dashboard" && (
          <div>
            {dashboard?.virtualAccount ? (
              <div style={{ background: "#1a1a1a", border: "1px solid #2a2a2a", borderRadius: "12px", padding: "16px", marginBottom: "16px" }}>
                <p style={{ color: "#888", fontSize: "12px", margin: "0 0 8px", textTransform: "uppercase" }}>Your Virtual Account</p>
                <p style={{ color: "#fff", fontWeight: "800", fontSize: "22px", margin: "0 0 4px", letterSpacing: "2px" }}>{dashboard.virtualAccount.accountNumber}</p>
                <p style={{ color: "#f97316", fontWeight: "700", fontSize: "14px", margin: "0 0 2px" }}>{dashboard.virtualAccount.bankName}</p>
                <p style={{ color: "#888", fontSize: "13px", margin: 0 }}>{dashboard.virtualAccount.accountName}</p>
                <p style={{ color: "#22c55e", fontSize: "12px", marginTop: "8px" }}>Transfer to this account to fund your wallet instantly</p>
              </div>
            ) : (
              <div style={{ background: "#1a1a1a", border: "1px solid #333", borderRadius: "12px", padding: "20px", marginBottom: "16px", textAlign: "center" }}>
                <p style={{ fontSize: "32px", margin: "0 0 8px" }}>🏦</p>
                <p style={{ color: "#fff", fontWeight: "700", marginBottom: "8px" }}>Get Your Virtual Account</p>
                <p style={{ color: "#888", fontSize: "13px", marginBottom: "16px" }}>Fund your wallet via bank transfer instantly</p>
                <button onClick={createVirtualAccount} disabled={vaLoading} style={{ padding: "12px 24px", background: "linear-gradient(135deg, #f97316, #dc2626)", color: "#fff", border: "none", borderRadius: "10px", cursor: "pointer", fontWeight: "700" }}>
                  {vaLoading ? "Creating..." : "Create Virtual Account"}
                </button>
              </div>
            )}
            <div style={{ background: "#1a1a1a", border: "1px solid #2a2a2a", borderRadius: "12px", padding: "16px" }}>
              <p style={{ color: "#fff", fontWeight: "700", fontSize: "15px", margin: "0 0 12px" }}>Recent Transactions</p>
              {(dashboard?.recentTransactions || []).length === 0 ? (
                <p style={{ color: "#888", textAlign: "center", padding: "20px 0" }}>No transactions yet</p>
              ) : (
                dashboard.recentTransactions.map((tx, i) => (
                  <div key={i} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "10px 0", borderBottom: "1px solid #222" }}>
                    <div>
                      <p style={{ color: "#fff", fontSize: "13px", fontWeight: "600", margin: "0 0 2px" }}>{tx.description}</p>
                      <p style={{ color: "#888", fontSize: "11px", margin: 0 }}>{new Date(tx.createdAt).toLocaleDateString()}</p>
                    </div>
                    <p style={{ color: tx.type === "credit" ? "#22c55e" : "#f87171", fontWeight: "700", fontSize: "14px", margin: 0 }}>
                      {tx.type === "credit" ? "+" : "-"}₦{tx.amount?.toLocaleString()}
                    </p>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {/* ADD MONEY TAB */}
        {tab === "Add Money" && (
          <div>
            <h2 style={{ color: "#fff", marginBottom: "16px" }}>Add Money to Wallet</h2>
            {dashboard?.virtualAccount ? (
              <div style={{ background: "#1a1a1a", border: "1px solid #22c55e", borderRadius: "12px", padding: "20px" }}>
                <p style={{ color: "#22c55e", fontWeight: "700", marginBottom: "16px" }}>Transfer to this account to fund your wallet:</p>
                <div style={{ background: "#111", borderRadius: "10px", padding: "16px", marginBottom: "12px" }}>
                  <p style={{ color: "#888", fontSize: "12px", margin: "0 0 4px" }}>Account Number</p>
                  <p style={{ color: "#fff", fontWeight: "900", fontSize: "24px", margin: "0 0 12px", letterSpacing: "3px" }}>{dashboard.virtualAccount.accountNumber}</p>
                  <p style={{ color: "#888", fontSize: "12px", margin: "0 0 4px" }}>Bank</p>
                  <p style={{ color: "#f97316", fontWeight: "700", fontSize: "16px", margin: "0 0 12px" }}>{dashboard.virtualAccount.bankName}</p>
                  <p style={{ color: "#888", fontSize: "12px", margin: "0 0 4px" }}>Account Name</p>
                  <p style={{ color: "#fff", fontWeight: "700", fontSize: "16px", margin: 0 }}>{dashboard.virtualAccount.accountName}</p>
                </div>
                <p style={{ color: "#888", fontSize: "13px", margin: 0 }}>Transfers reflect in your wallet within 1-2 minutes.</p>
              </div>
            ) : (
              <div style={{ background: "#1a1a1a", border: "1px solid #333", borderRadius: "12px", padding: "20px", textAlign: "center" }}>
                <p style={{ color: "#888", marginBottom: "16px" }}>You need a virtual account to fund your wallet via bank transfer.</p>
                <button onClick={createVirtualAccount} disabled={vaLoading} style={{ padding: "12px 24px", background: "linear-gradient(135deg, #f97316, #dc2626)", color: "#fff", border: "none", borderRadius: "10px", cursor: "pointer", fontWeight: "700" }}>
                  {vaLoading ? "Creating..." : "Create Virtual Account"}
                </button>
              </div>
            )}
          </div>
        )}

        {/* SEND MONEY TAB */}
        {tab === "Send Money" && (
          <div>
            <h2 style={{ color: "#fff", marginBottom: "16px" }}>Send Money</h2>
            <div style={{ background: "#1a1a1a", border: "1px solid #2a2a2a", borderRadius: "12px", padding: "20px" }}>
              <p style={{ color: "#888", fontSize: "13px", marginBottom: "16px" }}>Send to any TechMart user instantly</p>
              <input placeholder="Recipient email address" value={sendForm.recipientEmail} onChange={e => setSendForm({...sendForm, recipientEmail: e.target.value})} style={inp} />
              <input placeholder="Amount (N)" type="number" value={sendForm.amount} onChange={e => setSendForm({...sendForm, amount: e.target.value})} style={inp} />
              <input placeholder="Note (optional)" value={sendForm.note} onChange={e => setSendForm({...sendForm, note: e.target.value})} style={inp} />
              <p style={{ color: "#888", fontSize: "12px", margin: "0 0 16px" }}>Available: ₦{(dashboard?.balance || 0).toLocaleString()}</p>
              <button onClick={sendMoney} disabled={sendLoading} style={{ width: "100%", padding: "14px", background: "linear-gradient(135deg, #f97316, #dc2626)", color: "#fff", border: "none", borderRadius: "10px", cursor: "pointer", fontWeight: "700", fontSize: "15px" }}>
                {sendLoading ? "Sending..." : "Send Money"}
              </button>
            </div>
          </div>
        )}

        {/* WITHDRAW TAB */}
        {tab === "Withdraw" && (
          <div>
            <h2 style={{ color: "#fff", marginBottom: "16px" }}>Withdraw to Bank</h2>
            <div style={{ background: "#1a1a1a", border: "1px solid #2a2a2a", borderRadius: "12px", padding: "20px" }}>
              <p style={{ color: "#888", fontSize: "13px", marginBottom: "16px" }}>Available: ₦{(dashboard?.balance || 0).toLocaleString()}</p>
              <input placeholder="Amount (N) — minimum N500" type="number" value={withdrawForm.amount} onChange={e => setWithdrawForm({...withdrawForm, amount: e.target.value})} style={inp} />
              <select value={withdrawForm.bankCode} onChange={e => setWithdrawForm({...withdrawForm, bankCode: e.target.value, accountName: ""})} style={{ ...inp, appearance: "none" }}>
                <option value="">Select Bank</option>
                {banks.map(b => <option key={b.code} value={b.code}>{b.name}</option>)}
              </select>
              <div style={{ display: "flex", gap: "8px", marginBottom: "12px" }}>
                <input placeholder="Account Number" value={withdrawForm.accountNumber} onChange={e => setWithdrawForm({...withdrawForm, accountNumber: e.target.value, accountName: ""})} style={{ ...inp, marginBottom: 0, flex: 1 }} maxLength={10} />
                <button onClick={verifyAccount} disabled={verifyingAccount || !withdrawForm.accountNumber || !withdrawForm.bankCode} style={{ padding: "12px 14px", background: "#333", color: "#fff", border: "none", borderRadius: "10px", cursor: "pointer", fontSize: "13px", fontWeight: "600", flexShrink: 0 }}>
                  {verifyingAccount ? "..." : "Verify"}
                </button>
              </div>
              {withdrawForm.accountName && (
                <div style={{ background: "#0a2a1a", border: "1px solid #22c55e", borderRadius: "8px", padding: "10px 14px", marginBottom: "12px" }}>
                  <p style={{ color: "#22c55e", fontWeight: "700", fontSize: "14px", margin: 0 }}>{withdrawForm.accountName}</p>
                </div>
              )}
              <button onClick={withdraw} disabled={withdrawLoading || !withdrawForm.accountName} style={{ width: "100%", padding: "14px", background: "linear-gradient(135deg, #f97316, #dc2626)", color: "#fff", border: "none", borderRadius: "10px", cursor: "pointer", fontWeight: "700", fontSize: "15px", opacity: !withdrawForm.accountName ? 0.6 : 1 }}>
                {withdrawLoading ? "Processing..." : `Withdraw ₦${Number(withdrawForm.amount || 0).toLocaleString()}`}
              </button>
            </div>
          </div>
        )}

        {/* AIRTIME TAB */}
        {tab === "Airtime" && (
          <div>
            <h2 style={{ color: "#fff", marginBottom: "16px" }}>Buy Airtime</h2>
            <div style={{ background: "#1a1a1a", border: "1px solid #2a2a2a", borderRadius: "12px", padding: "20px" }}>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: "10px", marginBottom: "16px" }}>
                {["MTN", "Airtel", "Glo", "9mobile"].map(n => (
                  <button key={n} onClick={() => setAirtimeForm({...airtimeForm, network: n})} style={{ padding: "12px", borderRadius: "10px", border: `2px solid ${airtimeForm.network === n ? "#f97316" : "#333"}`, background: airtimeForm.network === n ? "#1a0a00" : "#111", color: airtimeForm.network === n ? "#f97316" : "#888", fontWeight: "700", cursor: "pointer" }}>{n}</button>
                ))}
              </div>
              <input placeholder="Phone number (e.g. 08012345678)" value={airtimeForm.phone} onChange={e => setAirtimeForm({...airtimeForm, phone: e.target.value})} style={inp} />
              <div style={{ display: "flex", gap: "8px", marginBottom: "12px", flexWrap: "wrap" }}>
                {[100, 200, 500, 1000].map(a => (
                  <button key={a} onClick={() => setAirtimeForm({...airtimeForm, amount: String(a)})} style={{ padding: "8px 16px", borderRadius: "8px", border: `1px solid ${airtimeForm.amount === String(a) ? "#f97316" : "#333"}`, background: airtimeForm.amount === String(a) ? "#1a0a00" : "#111", color: airtimeForm.amount === String(a) ? "#f97316" : "#888", cursor: "pointer", fontWeight: "600", fontSize: "13px" }}>₦{a}</button>
                ))}
              </div>
              <input placeholder="Or enter custom amount" type="number" value={airtimeForm.amount} onChange={e => setAirtimeForm({...airtimeForm, amount: e.target.value})} style={inp} />
              <p style={{ color: "#888", fontSize: "12px", margin: "0 0 16px" }}>Available: ₦{(dashboard?.balance || 0).toLocaleString()}</p>
              <button onClick={buyAirtime} disabled={airtimeLoading} style={{ width: "100%", padding: "14px", background: "linear-gradient(135deg, #f97316, #dc2626)", color: "#fff", border: "none", borderRadius: "10px", cursor: "pointer", fontWeight: "700", fontSize: "15px" }}>
                {airtimeLoading ? "Processing..." : `Buy ₦${Number(airtimeForm.amount || 0).toLocaleString()} Airtime`}
              </button>
            </div>
          </div>
        )}

        {/* DATA TAB */}
        {tab === "Data" && (
          <div>
            <h2 style={{ color: "#fff", marginBottom: "16px" }}>Buy Data Bundle</h2>
            <div style={{ background: "#1a1a1a", border: "1px solid #2a2a2a", borderRadius: "12px", padding: "20px" }}>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: "10px", marginBottom: "16px" }}>
                {["MTN", "Airtel", "Glo", "9mobile"].map(n => (
                  <button key={n} onClick={() => { setDataForm({...dataForm, network: n, planId: "", planName: "", amount: ""}); fetchDataPlans(n); }}
                    style={{ padding: "12px", borderRadius: "10px", border: `2px solid ${dataForm.network === n ? "#f97316" : "#333"}`, background: dataForm.network === n ? "#1a0a00" : "#111", color: dataForm.network === n ? "#f97316" : "#888", fontWeight: "700", cursor: "pointer" }}>{n}</button>
                ))}
              </div>
              <input placeholder="Phone number (e.g. 08012345678)" value={dataForm.phone} onChange={e => setDataForm({...dataForm, phone: e.target.value})} style={inp} />
              {dataPlansLoading && <p style={{ color: "#888", fontSize: "13px" }}>Loading plans...</p>}
              {dataPlans.length > 0 && (
                <div style={{ maxHeight: "200px", overflowY: "auto", marginBottom: "12px", border: "1px solid #2a2a2a", borderRadius: "10px" }}>
                  {dataPlans.map((plan, i) => (
                    <div key={i} onClick={() => setDataForm({...dataForm, planId: plan.id || plan.code || String(i), planName: plan.name || plan.description, amount: String(plan.price || plan.amount)})}
                      style={{ padding: "12px 16px", borderBottom: "1px solid #222", cursor: "pointer", background: dataForm.planId === (plan.id || plan.code || String(i)) ? "#1a0a00" : "transparent", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                      <span style={{ color: dataForm.planId === (plan.id || plan.code || String(i)) ? "#f97316" : "#fff", fontSize: "13px" }}>{plan.name || plan.description}</span>
                      <span style={{ color: "#22c55e", fontWeight: "700", fontSize: "13px" }}>₦{(plan.price || plan.amount || 0).toLocaleString()}</span>
                    </div>
                  ))}
                </div>
              )}
              {dataForm.planName && (
                <div style={{ background: "#0a1a0a", border: "1px solid #22c55e", borderRadius: "8px", padding: "10px 14px", marginBottom: "12px" }}>
                  <p style={{ color: "#22c55e", margin: 0, fontSize: "13px" }}>Selected: <strong>{dataForm.planName}</strong> — ₦{Number(dataForm.amount || 0).toLocaleString()}</p>
                </div>
              )}
              <p style={{ color: "#888", fontSize: "12px", margin: "0 0 16px" }}>Available: ₦{(dashboard?.balance || 0).toLocaleString()}</p>
              <button onClick={buyData} disabled={dataLoading || !dataForm.planId} style={{ width: "100%", padding: "14px", background: dataForm.planId ? "linear-gradient(135deg, #f97316, #dc2626)" : "#333", color: "#fff", border: "none", borderRadius: "10px", cursor: dataForm.planId ? "pointer" : "not-allowed", fontWeight: "700", fontSize: "15px" }}>
                {dataLoading ? "Processing..." : dataForm.planName ? `Buy ${dataForm.planName}` : "Select a plan"}
              </button>
            </div>
          </div>
        )}

        {/* ELECTRICITY TAB */}
        {tab === "Electricity" && (
          <div>
            <h2 style={{ color: "#fff", marginBottom: "16px" }}>⚡ Electricity Payment</h2>
            <div style={{ background: "#1a1a1a", border: "1px solid #2a2a2a", borderRadius: "12px", padding: "20px" }}>
              <p style={{ color: "#888", fontSize: "13px", marginBottom: "12px" }}>Select Distribution Company</p>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: "8px", marginBottom: "16px", width: "100%" }}>
                {["IKEDC", "EKEDC", "AEDC", "PHEDC", "KAEDCO", "IBEDC", "KEDCO", "EEDC"].map(d => (
                  <button key={d} onClick={() => { setElecForm({...elecForm, disco: d}); setElecVerified(false); }}
                    style={{ padding: "10px 6px", borderRadius: "8px", border: `2px solid ${elecForm.disco === d ? "#f97316" : "#333"}`, background: elecForm.disco === d ? "#1a0a00" : "#111", color: elecForm.disco === d ? "#f97316" : "#888", fontWeight: "700", cursor: "pointer", fontSize: "11px", textAlign: "center", width: "100%" }}>{d}</button>
                ))}
              </div>
              <div style={{ display: "flex", gap: "8px", marginBottom: "16px" }}>
                {["prepaid", "postpaid"].map(t => (
                  <button key={t} onClick={() => setElecForm({...elecForm, meterType: t, customerName: ""})} style={{ flex: 1, padding: "10px", borderRadius: "8px", border: `2px solid ${elecForm.meterType === t ? "#f97316" : "#333"}`, background: elecForm.meterType === t ? "#1a0a00" : "#111", color: elecForm.meterType === t ? "#f97316" : "#888", fontWeight: "700", cursor: "pointer", textTransform: "capitalize" }}>{t}</button>
                ))}
              </div>
              <input placeholder="Meter number" value={elecForm.meterNumber} onChange={e => { setElecForm({...elecForm, meterNumber: e.target.value}); setElecVerified(false); }} style={inp} />
              {!elecVerified ? (
                <button onClick={verifyMeter} disabled={elecVerifying} style={{ width: "100%", padding: "12px", background: "#1a1a2a", border: "1px solid #f97316", color: "#f97316", borderRadius: "10px", cursor: "pointer", fontWeight: "700", marginBottom: "12px" }}>
                  {elecVerifying ? "Verifying..." : "Verify Meter"}
                </button>
              ) : (
                <div style={{ background: "#0a2a0a", border: "1px solid #22c55e", borderRadius: "8px", padding: "10px 14px", marginBottom: "12px" }}>
                  <p style={{ color: "#22c55e", margin: 0, fontSize: "13px" }}>✅ Verified: <strong>{elecForm.customerName}</strong></p>
                </div>
              )}
              <div style={{ display: "flex", gap: "8px", marginBottom: "12px", flexWrap: "wrap" }}>
                {[500, 1000, 2000, 5000].map(a => (
                  <button key={a} onClick={() => setElecForm({...elecForm, amount: String(a)})} style={{ padding: "8px 16px", borderRadius: "8px", border: `1px solid ${elecForm.amount === String(a) ? "#f97316" : "#333"}`, background: elecForm.amount === String(a) ? "#1a0a00" : "#111", color: elecForm.amount === String(a) ? "#f97316" : "#888", cursor: "pointer", fontWeight: "600", fontSize: "13px" }}>₦{a.toLocaleString()}</button>
                ))}
              </div>
              <input placeholder="Or enter custom amount (min N500)" type="number" value={elecForm.amount} onChange={e => setElecForm({...elecForm, amount: e.target.value})} style={inp} />
              <p style={{ color: "#888", fontSize: "12px", margin: "0 0 16px" }}>Available: ₦{(dashboard?.balance || 0).toLocaleString()}</p>
              <button onClick={payElectricity} disabled={elecLoading || !elecVerified} style={{ width: "100%", padding: "14px", background: elecVerified ? "linear-gradient(135deg, #f97316, #dc2626)" : "#333", color: "#fff", border: "none", borderRadius: "10px", cursor: elecVerified ? "pointer" : "not-allowed", fontWeight: "700", fontSize: "15px" }}>
                {elecLoading ? "Processing..." : `Pay ₦${Number(elecForm.amount || 0).toLocaleString()} Electricity`}
              </button>
            </div>
          </div>
        )}

        {/* HISTORY TAB */}
        {tab === "History" && (
          <div>
            <h2 style={{ color: "#fff", marginBottom: "16px" }}>Transaction History</h2>
            <div style={{ background: "#1a1a1a", border: "1px solid #2a2a2a", borderRadius: "12px", padding: "16px" }}>
              {(dashboard?.recentTransactions || []).length === 0 ? (
                <p style={{ color: "#888", textAlign: "center", padding: "20px 0" }}>No transactions yet</p>
              ) : (
                dashboard.recentTransactions.map((tx, i) => (
                  <div key={i} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "12px 0", borderBottom: "1px solid #222" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                      <div style={{ width: "36px", height: "36px", borderRadius: "50%", background: tx.type === "credit" ? "#0a2a1a" : "#2a1010", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "16px" }}>
                        {tx.type === "credit" ? "⬇️" : "⬆️"}
                      </div>
                      <div>
                        <p style={{ color: "#fff", fontSize: "13px", fontWeight: "600", margin: "0 0 2px" }}>{tx.description}</p>
                        <p style={{ color: "#888", fontSize: "11px", margin: 0 }}>{new Date(tx.createdAt).toLocaleString()}</p>
                      </div>
                    </div>
                    <p style={{ color: tx.type === "credit" ? "#22c55e" : "#f87171", fontWeight: "800", fontSize: "15px", margin: 0 }}>
                      {tx.type === "credit" ? "+" : "-"}₦{tx.amount?.toLocaleString()}
                    </p>
                  </div>
                ))
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

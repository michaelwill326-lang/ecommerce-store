import { useState, useEffect } from "react";
import EmptyState from "../components/EmptyState";
import { TransactionSkeleton, SkeletonBlock } from "../components/Skeleton";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { useLocation } from "react-router-dom";
import QRCode from "qrcode";

const API = import.meta.env.VITE_API_URL || "https://techmart-backend-ecbi.onrender.com";

export default function TechMartPay() {
  const navigate = useNavigate();
  const token = localStorage.getItem("token");
  const user = JSON.parse(localStorage.getItem("user") || "null");
  const headers = { Authorization: `Bearer ${token}` };
  const location = useLocation();
  const [tab, setTab] = useState("Dashboard");
  const [qrDataUrl, setQrDataUrl] = useState("");
  const [showQr, setShowQr] = useState(false);
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
  const [bvnInput, setBvnInput] = useState("");
  const [bvnLoading, setBvnLoading] = useState(false);
  const [bvnVerified, setBvnVerified] = useState(false);
  const [insights, setInsights] = useState(null);
  const [insightsLoading, setInsightsLoading] = useState(false);
  const [budget, setBudgetInput] = useState("");
  const [budgetSaving, setBudgetSaving] = useState(false);
  const [ninVerified, setNinVerified] = useState(false);
  const [ninInput, setNinInput] = useState("");
  const [ninLoading, setNinLoading] = useState(false);
  const [kycMethod, setKycMethod] = useState("bvn");

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
  // Cable TV state
  const [ctvForm, setCtvForm] = useState({ smartcardNumber: "", provider: "", planId: "", planName: "", amount: "", customerName: "" });
  const [ctvPlans, setCtvPlans] = useState([]);
  const [ctvLoading, setCtvLoading] = useState(false);
  const [ctvPlansLoading, setCtvPlansLoading] = useState(false);
  const [ctvVerified, setCtvVerified] = useState(false);
  const [ctvVerifying, setCtvVerifying] = useState(false);
  // PIN state
  const [pinModal, setPinModal] = useState({ open: false, onSuccess: null });
  const [pinInput, setPinInput] = useState("");
  const [pinLoading, setPinLoading] = useState(false);
  const [pinError, setPinError] = useState("");
  const [showSetPin, setShowSetPin] = useState(false);
  const [newPin, setNewPin] = useState("");
  const [pinSet, setPinSet] = useState(false);

  const [showChangePin, setShowChangePin] = useState(false);
  const [oldPin, setOldPin] = useState("");
  const [changePin, setChangePin] = useState("");
  const [changeLoading, setChangeLoading] = useState(false);

  const [showForgotPin, setShowForgotPin] = useState(false);


  const [resetOtp, setResetOtp] = useState("");
  const [resetPin, setResetPin] = useState("");
  const [resetLoading, setResetLoading] = useState(false);
const [otpTimer, setOtpTimer] = useState(600);
  // Betting state
  const [betForm, setBetForm] = useState({ platform: "", bettingId: "", amount: "" });
  const [betLoading, setBetLoading] = useState(false);

  // Virtual account state
  const [fundLoading, setFundLoading] = useState(false);
  const [fundAmount, setFundAmount] = useState("");

  useEffect(() => {
    if (!token) { navigate("/login"); return; }
    fetchDashboard();
    fetchBanks();
  }, []);

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const sendTo = params.get("sendTo");
    if (sendTo) {
      setTab("Send Money");
      setSendForm(prev => ({ ...prev, recipientEmail: sendTo }));
    }
  }, [location.search]);

  const generateQr = async (userId) => {
    try {
      const url = `${window.location.origin}/pay/user/${userId}`;
      const dataUrl = await QRCode.toDataURL(url, { width: 200, margin: 2, color: { dark: "#f97316", light: "#0a0a0a" } });
      setQrDataUrl(dataUrl);
    } catch (err) {
      console.error("QR generation failed:", err);
    }
  };

  const fetchDashboard = async () => {
    try {
      const res = await axios.get(`${API}/api/pay/dashboard`, { headers });
      setDashboard(res.data);
      setBvnVerified(res.data.bvnVerified || false);
      setNinVerified(res.data.ninVerified || false);
      if (user?.id) generateQr(user.id);

      // Always trust the backend
      setPinSet(Boolean(res.data.walletPinSet));
    } catch (err) {
      if (err.response?.status === 401) navigate("/login");
    } finally { setLoading(false); }
  };

  const fetchInsights = async () => {
    setInsightsLoading(true);
    try {
      const res = await axios.get(`${API}/api/pay/insights`, { headers });
      setInsights(res.data);
      setBudgetInput(res.data.budget || "");
    } catch { setMsg({ text: "Failed to load insights", type: "error" }); }
    finally { setInsightsLoading(false); }
  };

  const saveBudget = async () => {
    setBudgetSaving(true);
    try {
      await axios.post(`${API}/api/pay/budget`, { budget }, { headers });
      setMsg({ text: `Budget set to ₦${Number(budget).toLocaleString()}`, type: "success" });
      fetchInsights();
    } catch { setMsg({ text: "Failed to set budget", type: "error" }); }
    finally { setBudgetSaving(false); }
  };

  const verifyBvn = async () => {
    if (!bvnInput || bvnInput.length !== 11) return setMsg({ text: "Enter a valid 11-digit BVN", type: "error" });
    setBvnLoading(true);
    try {
      await axios.post(`${API}/api/pay/verify-bvn`, { bvn: bvnInput }, { headers });
      setBvnVerified(true);
      setMsg({ text: "BVN verified! Your transaction limits have been upgraded.", type: "success" });
      setBvnInput("");
    } catch (err) {
      setMsg({ text: err.response?.data?.error || "BVN verification failed", type: "error" });
    } finally { setBvnLoading(false); }
  };

  const verifyNin = async () => {
    if (!ninInput || ninInput.length !== 11) return setMsg({ text: "Enter a valid 11-digit NIN", type: "error" });
    setNinLoading(true);
    try {
      await axios.post(`${API}/api/pay/verify-nin`, { nin: ninInput }, { headers });
      setNinVerified(true);
      setMsg({ text: "NIN verified! Your transaction limits have been upgraded.", type: "success" });
      setNinInput("");
    } catch (err) {
      setMsg({ text: err.response?.data?.error || "NIN verification failed", type: "error" });
    } finally { setNinLoading(false); }
  };

  const fetchBanks = async () => {
    try {
      const res = await axios.get(`${API}/api/pay/banks`);
      setBanks(res.data || []);
    } catch {}
  };

  const fundWallet = async (amount) => {
    const amt = amount || fundAmount;
    if (!amt || Number(amt) < 100) {
      setMsg({
        text: "Minimum deposit is ₦100",
        type: "error"
      });
      return;
    }
    setFundLoading(true);
    try {
      const res = await axios.post(`${API}/api/pay/fund-wallet`, { amount: amt }, { headers });
      window.location.href = res.data.paymentUrl;
    } catch (err) {
      setMsg({ text: err.response?.data?.error || "Failed to initialize payment", type: "error" });
    } finally { setFundLoading(false); }
  };

  const sendMoney = async (pin) => {
    setMsg({ text: "", type: "" });
    if (!sendForm.recipientEmail || !sendForm.amount) { setMsg({ text: "Please fill all fields", type: "error" }); return; }
    setSendLoading(true);
    try {
      const res = await axios.post(`${API}/api/pay/send`, { ...sendForm, pin }, { headers });
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

  const withdraw = async (pin) => {
    setMsg({ text: "", type: "" });
    if (!withdrawForm.amount || !withdrawForm.bankCode || !withdrawForm.accountNumber || !withdrawForm.accountName) {
      setMsg({ text: "Please fill all fields and verify account", type: "error" }); return;
    }
    setWithdrawLoading(true);
    try {
      const res = await axios.post(`${API}/api/pay/withdraw`, { ...withdrawForm, pin }, { headers });
      setMsg({ text: res.data.message, type: "success" });
      setWithdrawForm({ amount: "", bankCode: "", accountNumber: "", accountName: "" });
      fetchDashboard();
    } catch (err) {
      setMsg({ text: err.response?.data?.error || "Withdrawal failed", type: "error" });
    } finally { setWithdrawLoading(false); }
  };

  const buyAirtime = async (pin) => {
    setMsg({ text: "", type: "" });
    if (!airtimeForm.phone || !airtimeForm.amount || !airtimeForm.network) {
      setMsg({ text: "Please fill all fields", type: "error" }); return;
    }
    setAirtimeLoading(true);
    try {
      const res = await axios.post(`${API}/api/pay/airtime`, { ...airtimeForm, pin }, { headers });
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
  const buyData = async (pin) => {
    if (!dataForm.phone || !dataForm.network || !dataForm.planId) {
      return setMsg({ text: "Please select network, plan and enter phone number", type: "error" });
    }
    setDataLoading(true);
    try {
      const res = await axios.post(`${API}/api/pay/data`, { ...dataForm, pin }, { headers });
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
  const payElectricity = async (pin) => {
    if (!elecVerified) return setMsg({ text: "Please verify your meter first", type: "error" });
    if (!elecForm.amount || Number(elecForm.amount) < 500) return setMsg({ text: "Minimum payment is N500", type: "error" });
    setElecLoading(true);
    try {
      const res = await axios.post(`${API}/api/pay/electricity`, { ...elecForm, pin }, { headers });
      setMsg({ text: res.data.message, type: "success" });
      setElecForm({ meterNumber: "", disco: "", meterType: "prepaid", amount: "", customerName: "" });
      setElecVerified(false);
      fetchDashboard();
    } catch (err) {
      setMsg({ text: err.response?.data?.error || "Payment failed", type: "error" });
    } finally { setElecLoading(false); }
  };
  const fetchCtvPlans = async (provider) => {
    setCtvPlansLoading(true);
    setCtvPlans([]);
    try {
      const res = await axios.get(`${API}/api/pay/cabletv/plans/${provider}`, { headers });
      setCtvPlans(res.data.plans || []);
    } catch { setMsg({ text: "Failed to load plans", type: "error" }); }
    finally { setCtvPlansLoading(false); }
  };
  const verifySmartcard = async () => {
    if (!ctvForm.smartcardNumber || !ctvForm.provider) return setMsg({ text: "Select provider and enter smartcard number", type: "error" });
    setCtvVerifying(true);
    setCtvVerified(false);
    try {
      const res = await axios.post(`${API}/api/pay/cabletv/verify`, ctvForm, { headers });
      setCtvForm(prev => ({ ...prev, customerName: res.data.data?.name || res.data.data?.customer_name || "Verified" }));
      setCtvVerified(true);
      setMsg({ text: "Smartcard verified successfully", type: "success" });
    } catch { setMsg({ text: "Could not verify smartcard. Check the number and try again.", type: "error" }); }
    finally { setCtvVerifying(false); }
  };
  const payCableTV = async (pin) => {
    if (!ctvVerified) return setMsg({ text: "Please verify your smartcard first", type: "error" });
    if (!ctvForm.planId) return setMsg({ text: "Please select a package", type: "error" });
    setCtvLoading(true);
    try {
      const res = await axios.post(`${API}/api/pay/cabletv`, { ...ctvForm, pin }, { headers });
      setMsg({ text: res.data.message, type: "success" });
      setCtvForm({ smartcardNumber: "", provider: "", planId: "", planName: "", amount: "", customerName: "" });
      setCtvVerified(false);
      setCtvPlans([]);
      fetchDashboard();
    } catch (err) {
      setMsg({ text: err.response?.data?.error || "Payment failed", type: "error" });
    } finally { setCtvLoading(false); }
  };
  const requirePin = (onSuccess) => {
    if (!pinSet) { setShowSetPin(true); return; }
    setPinInput("");
    setPinError("");
    setPinModal({ open: true, onSuccess });
  };
  const confirmPin = async () => {
    if (pinInput.length !== 4) return setPinError("Enter 4-digit PIN");
    setPinLoading(true);
    try {
      await axios.post(`${API}/api/pay/pin/verify`, { pin: pinInput }, { headers });
      const cb = pinModal.onSuccess;
      const confirmedPin = pinInput;
      setPinModal({ open: false, onSuccess: null });
      setPinInput("");
      cb && cb(confirmedPin);
    } catch (err) {
      setPinError(err.response?.data?.error || "Incorrect PIN");
    } finally { setPinLoading(false); }
  };
  const setWalletPin = async () => {
    if (newPin.length !== 4) return setMsg({ text: "PIN must be 4 digits", type: "error" });
    try {
      await axios.post(`${API}/api/pay/pin/set`, { pin: newPin }, { headers });
      setPinSet(true);
      setShowSetPin(false);
      setNewPin("");
      setMsg({ text: "Wallet PIN set successfully!", type: "success" });
    } catch (err) {
      setMsg({ text: err.response?.data?.error || "Failed to set PIN", type: "error" });
    }
  }

  const changeWalletPin = async () => {
    if (oldPin.length !== 4 || changePin.length !== 4) {
      return setMsg({
        text: "Both PINs must be exactly 4 digits",
        type: "error"
      });
    }

    setChangeLoading(true);

    try {
      const res = await axios.post(
        `${API}/api/pay/pin/change`,
        {
          oldPin,
          newPin: changePin,
          confirmPin: changePin
        },
        { headers }
      );

      setMsg({
        text: res.data.message,
        type: "success"
      });

      setOldPin("");
      setChangePin("");
      setShowChangePin(false);

    } catch (err) {
      setMsg({
        text: err.response?.data?.error || "Failed to change PIN",
        type: "error"
      });
    } finally {
      setChangeLoading(false);
    }
  };


  
useEffect(() => {
  if (otpTimer <= 0) return;

  const interval = setInterval(() => {
    setOtpTimer((prev) => prev - 1);
  }, 1000);

  return () => clearInterval(interval);
}, [otpTimer]);

const formatOtpTime = () => {
  const minutes = Math.floor(otpTimer / 60);
  const seconds = otpTimer % 60;
  return `${String(minutes).padStart(2,"0")}:${String(seconds).padStart(2,"0")}`;
};

const requestPinReset = async () => {
    try {
      setResetLoading(true);

      await axios.post(
        `${API}/api/pay/pin/forgot`,
        {},
        { headers }
      );

      setOtpTimer(600);

      setMsg({
        text: "OTP sent to your phone via SMS.",
        type: "success"
      });

      // Close the Enter PIN dialog
      setPinModal({
        open: false,
        onSuccess: null
      });

      // Open the Reset PIN dialog immediately
      
      
      setShowForgotPin(true);
      
    } catch (err) {
      setMsg({
        text: err.response?.data?.error || "Unable to send OTP",
        type: "error"
      });
    } finally {
      setResetLoading(false);
    }
  };

  const resetWalletPin = async () => {
    if (resetPin.length !== 4) {
      return setMsg({
        text: "PIN must be exactly 4 digits",
        type: "error"
      });
    }

    try {
      setResetLoading(true);

      await axios.post(
        `${API}/api/pay/pin/reset`,
        {
          otp: resetOtp,
          newPin: resetPin
        },
        { headers }
      );

      setShowForgotPin(false);
      setResetOtp("");
      setResetPin("");

      setMsg({
        text: "Wallet PIN reset successfully.",
        type: "success"
      });

    } catch (err) {
      setMsg({
        text: err.response?.data?.error || "Reset failed",
        type: "error"
      });
    } finally {
      setResetLoading(false);
    }
  };

;
  const fundBetting = async (pin) => {

    if (!betForm.platform || !betForm.bettingId || !betForm.amount) return setMsg({ text: "Please fill all fields", type: "error" });
    setBetLoading(true);
    try {
      const res = await axios.post(`${API}/api/pay/betting`, { ...betForm, pin }, { headers });
      setMsg({ text: res.data.message, type: "success" });
      setBetForm({ platform: "", bettingId: "", amount: "" });
      fetchDashboard();
    } catch (err) {
      setMsg({ text: err.response?.data?.error || "Funding failed", type: "error" });
    } finally { setBetLoading(false); }
  };
  const TABS = ["Dashboard", "Add Money", "Send Money", "Withdraw", "Airtime", "Data", "Electricity", "Cable TV", "Betting", "History", "KYC", "Insights"];
  const inp = { width: "100%", padding: "12px 16px", background: "var(--bg-secondary)", border: "1px solid var(--border-color)", borderRadius: "10px", color: "var(--text-primary)", fontSize: "14px", outline: "none", boxSizing: "border-box", marginBottom: "12px" };

  if (loading) return (
    <div style={{ minHeight: "100vh", background: "var(--bg-primary)", padding: "16px" }}>
      <div style={{ maxWidth: "600px", margin: "0 auto", display: "flex", flexDirection: "column", gap: "16px" }}>
        <SkeletonBlock height="180px" borderRadius="20px" />
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: "10px" }}>
          {Array.from({length:8}).map((_,i) => <SkeletonBlock key={i} height="70px" borderRadius="12px" />)}
        </div>
        <SkeletonBlock height="200px" borderRadius="12px" />
      </div>
    </div>
  );

  return (
    <>
    <div style={{ minHeight: "100vh", background: "var(--bg-primary)", padding: "16px", paddingBottom: "60px" }}>
      <div style={{ maxWidth: "600px", margin: "0 auto" }}>

        {/* HEADER */}
        <div style={{ textAlign: "center", marginBottom: "24px" }}>
          <h1 style={{ color: "var(--text-primary)", fontSize: "24px", fontWeight: "900", margin: "0 0 4px" }}>
            <span style={{ color: "#f97316" }}>TechMart</span> Pay
          </h1>
          <p style={{ color: "var(--text-muted)", fontSize: "13px", margin: 0 }}>Your digital wallet</p>
        </div>

        {/* BALANCE CARD */}
        <div style={{ background: "linear-gradient(135deg, #f97316, #dc2626)", borderRadius: "20px", padding: "28px", marginBottom: "20px", textAlign: "center" }}>
          <p style={{ color: "rgba(255,255,255,0.8)", fontSize: "13px", margin: "0 0 8px", textTransform: "uppercase", letterSpacing: "1px" }}>Available Balance</p>
          <p style={{ color: "var(--text-primary)", fontSize: "40px", fontWeight: "900", margin: "0 0 16px" }}>₦{(dashboard?.balance || 0).toLocaleString()}</p>
          <div style={{ display: "flex", justifyContent: "center", gap: "24px" }}>
            <div style={{ textAlign: "center" }}>
              <p style={{ color: "rgba(255,255,255,0.7)", fontSize: "11px", margin: "0 0 2px" }}>TOTAL IN</p>
              <p style={{ color: "var(--text-primary)", fontWeight: "700", fontSize: "14px", margin: 0 }}>₦{(dashboard?.stats?.totalIn || 0).toLocaleString()}</p>
            </div>
            <div style={{ width: "1px", background: "rgba(255,255,255,0.3)" }} />
            <div style={{ textAlign: "center" }}>
              <p style={{ color: "rgba(255,255,255,0.7)", fontSize: "11px", margin: "0 0 2px" }}>TOTAL OUT</p>
              <p style={{ color: "var(--text-primary)", fontWeight: "700", fontSize: "14px", margin: 0 }}>₦{(dashboard?.stats?.totalOut || 0).toLocaleString()}</p>
            </div>
            <div style={{ width: "1px", background: "rgba(255,255,255,0.3)" }} />
            <div style={{ textAlign: "center" }}>
              <p style={{ color: "rgba(255,255,255,0.7)", fontSize: "11px", margin: "0 0 2px" }}>TRANSACTIONS</p>
              <p style={{ color: "var(--text-primary)", fontWeight: "700", fontSize: "14px", margin: 0 }}>{dashboard?.stats?.transactionCount || 0}</p>
            </div>
          </div>
        </div>

        {/* TECHMART ID QR CODE */}
        {showQr && qrDataUrl && (
          <div style={{ background: "var(--bg-card)", border: "1px solid #2a2a2a", borderRadius: "16px", padding: "20px", marginBottom: "20px", textAlign: "center" }}>
            <p style={{ color: "var(--text-primary)", fontWeight: "700", fontSize: "15px", margin: "0 0 4px" }}>🆔 Your TechMart ID</p>
            <p style={{ color: "var(--text-muted)", fontSize: "12px", margin: "0 0 16px" }}>Scan to pay or view your profile</p>
            <div style={{ background: "#0a0a0a", borderRadius: "12px", padding: "16px", display: "inline-block", marginBottom: "12px" }}>
              <img src={qrDataUrl} alt="TechMart QR" style={{ width: "160px", height: "160px", display: "block" }} />
            </div>
            <p style={{ color: "#f97316", fontWeight: "700", fontSize: "13px", margin: "0 0 12px" }}>{user?.name}</p>
            <div style={{ display: "flex", gap: "8px", justifyContent: "center" }}>
              <button onClick={() => { const a = document.createElement("a"); a.href = qrDataUrl; a.download = "techmart-qr.png"; a.click(); }} style={{ padding: "8px 16px", background: "#1a1a1a", border: "1px solid #333", color: "var(--text-muted)", borderRadius: "8px", cursor: "pointer", fontSize: "12px", fontWeight: "600" }}>⬇️ Save QR</button>
              <button onClick={() => setShowQr(false)} style={{ padding: "8px 16px", background: "#1a1a1a", border: "1px solid #333", color: "var(--text-muted)", borderRadius: "8px", cursor: "pointer", fontSize: "12px", fontWeight: "600" }}>✕ Close</button>
            </div>
          </div>
        )}

        {/* QUICK ACTIONS */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "10px", marginBottom: "20px" }}>
          {[
            { icon: "➕", label: "Add Money", tab: "Add Money" },
            { icon: "📤", label: "Send", tab: "Send Money" },
            { icon: "🏦", label: "Withdraw", tab: "Withdraw" },
            { icon: "🆔", label: "My QR", tab: "QR" },
            { icon: "📱", label: "Airtime", tab: "Airtime" },
            { icon: "📶", label: "Data", tab: "Data" },
            { icon: "⚡", label: "Electricity", tab: "Electricity" },
            { icon: "📺", label: "Cable TV", tab: "Cable TV" },
            { icon: "🎯", label: "Betting", tab: "Betting" },
          ].map((a, i) => (
            <button key={i} onClick={() => { if (a.tab === "QR") { setShowQr(true); if (!qrDataUrl && user?.id) generateQr(user.id); } else setTab(a.tab); }} style={{ background: "var(--bg-card)", border: "1px solid #2a2a2a", borderRadius: "12px", padding: "14px 8px", cursor: "pointer", textAlign: "center" }}>
              <p style={{ fontSize: "22px", margin: "0 0 4px" }}>{a.icon}</p>
              <p style={{ color: "var(--text-primary)", fontSize: "11px", fontWeight: "600", margin: 0 }}>{a.label}</p>
            </button>
          ))}
        </div>

        {/* TABS */}
        <div className="hide-scrollbar" style={{ display: "flex", gap: "6px", marginBottom: "20px", overflowX: "auto", paddingBottom: "4px" }}>
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
              <div style={{ background: "var(--bg-card)", border: "1px solid #2a2a2a", borderRadius: "12px", padding: "16px", marginBottom: "16px" }}>
                <p style={{ color: "var(--text-muted)", fontSize: "12px", margin: "0 0 8px", textTransform: "uppercase" }}>Your Virtual Account</p>
                <p style={{ color: "var(--text-primary)", fontWeight: "800", fontSize: "22px", margin: "0 0 4px", letterSpacing: "2px" }}>{dashboard.virtualAccount.accountNumber}</p>
                <p style={{ color: "#f97316", fontWeight: "700", fontSize: "14px", margin: "0 0 2px" }}>{dashboard.virtualAccount.bankName}</p>
                <p style={{ color: "var(--text-muted)", fontSize: "13px", margin: 0 }}>{dashboard.virtualAccount.accountName}</p>
                <p style={{ color: "#22c55e", fontSize: "12px", marginTop: "8px" }}>Transfer to this account to fund your wallet instantly</p>
              </div>
            ) : (
              <div style={{ background: "var(--bg-card)", border: "1px solid var(--border-color)", borderRadius: "12px", padding: "20px", marginBottom: "16px", textAlign: "center" }}>
                <p style={{ fontSize: "32px", margin: "0 0 8px" }}>➕</p>
                <p style={{ color: "var(--text-primary)", fontWeight: "700", marginBottom: "8px" }}>Fund Your Wallet</p>
                <p style={{ color: "var(--text-muted)", fontSize: "13px", marginBottom: "16px" }}>Pay via card, USSD, or bank transfer</p>
                <button onClick={() => setTab("Add Money")} style={{ padding: "12px 24px", background: "linear-gradient(135deg, #f97316, #dc2626)", color: "var(--text-primary)", border: "none", borderRadius: "10px", cursor: "pointer", fontWeight: "700" }}>
                  Add Money
                </button>
              </div>

            )}

            {!bvnVerified && !ninVerified && (
              <div style={{ background: "#0a1a0a", border: "1px solid #22c55e", borderRadius: "12px", padding: "16px", marginBottom: "16px", display: "flex", alignItems: "center", justifyContent: "space-between", gap: "12px" }}>
                <div>
                  <p style={{ color: "#22c55e", fontWeight: "700", fontSize: "14px", margin: "0 0 4px" }}>🔐 Verify Your BVN</p>
                  <p style={{ color: "var(--text-muted)", fontSize: "12px", margin: 0 }}>Unlock higher limits: ₦500k/day funding, ₦200k/day transfers</p>
                </div>
                <button onClick={() => setTab("KYC")} style={{ padding: "10px 16px", background: "#22c55e", color: "#000", border: "none", borderRadius: "8px", cursor: "pointer", fontWeight: "700", fontSize: "12px", flexShrink: 0 }}>Verify</button>
              </div>
            )}

            {(bvnVerified || ninVerified) && (
              <div style={{ background: "#0a1a0a", border: "1px solid #22c55e", borderRadius: "12px", padding: "12px 16px", marginBottom: "16px", display: "flex", alignItems: "center", gap: "10px" }}>
                <p style={{ fontSize: "20px", margin: 0 }}>✅</p>
                <div>
                  <p style={{ color: "#22c55e", fontWeight: "700", fontSize: "13px", margin: "0 0 2px" }}>BVN Verified</p>
                  <p style={{ color: "var(--text-muted)", fontSize: "12px", margin: 0 }}>You have access to higher transaction limits</p>
                </div>
              </div>
            )}

            {pinSet && (
              <div style={{ marginBottom: "16px" }}>
                <button
                  onClick={() => setShowChangePin(true)}
                  style={{
                    width: "100%",
                    padding: "14px",
                    background: "linear-gradient(135deg,#2563eb,#1d4ed8)",
                    color: "#fff",
                    border: "none",
                    borderRadius: "10px",
                    fontWeight: "700",
                    cursor: "pointer"
                  }}
                >
                  🔑 Change Wallet PIN
                </button>
              </div>
            )}

            <div style={{ background: "var(--bg-card)", border: "1px solid #2a2a2a", borderRadius: "12px", padding: "16px" }}>
              <p style={{ color: "var(--text-primary)", fontWeight: "700", fontSize: "15px", margin: "0 0 12px" }}>Recent Transactions</p>
              {(dashboard?.recentTransactions || []).length === 0 ? (
                <EmptyState icon="💳" title="No transactions yet" subtitle="Fund your wallet to get started" action="Add Money" onAction={() => setTab('Add Money')} />
              ) : (
                dashboard.recentTransactions.map((tx, i) => (
                  <div key={i} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "10px 0", borderBottom: "1px solid var(--border-light)" }}>
                    <div>
                      <p style={{ color: "var(--text-primary)", fontSize: "13px", fontWeight: "600", margin: "0 0 2px" }}>{tx.description}</p>
                      <p style={{ color: "var(--text-muted)", fontSize: "11px", margin: 0 }}>{new Date(tx.createdAt).toLocaleDateString()}</p>
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
            <h2 style={{ color: "var(--text-primary)", marginBottom: "16px" }}>Add Money to Wallet</h2>
            <div style={{ background: "var(--bg-card)", border: "1px solid #2a2a2a", borderRadius: "12px", padding: "20px" }}>
              <p style={{ color: "var(--text-muted)", fontSize: "13px", marginBottom: "16px" }}>Fund your wallet securely via card, USSD, or bank transfer</p>
              <div style={{ display: "flex", gap: "8px", marginBottom: "12px", flexWrap: "wrap" }}>
                {[500, 1000, 2000, 5000, 10000].map(a => (
                  <button key={a} onClick={() => setFundAmount(String(a))} style={{ padding: "8px 16px", borderRadius: "8px", border: `1px solid ${fundAmount === String(a) ? "#f97316" : "#333"}`, background: fundAmount === String(a) ? "#1a0a00" : "#111", color: fundAmount === String(a) ? "#f97316" : "#888", cursor: "pointer", fontWeight: "600", fontSize: "13px" }}>N{a.toLocaleString()}</button>
                ))}
              </div>
              <input placeholder="Or enter custom amount (min N100)" type="number" value={fundAmount} onChange={e => setFundAmount(e.target.value)} style={inp} />
              <div style={{ background: "var(--bg-secondary)", borderRadius: "10px", padding: "12px 16px", marginBottom: "16px" }}>
                <p style={{ color: "var(--text-muted)", fontSize: "12px", margin: "0 0 4px" }}>Payment methods accepted</p>
                <p style={{ color: "var(--text-primary)", fontSize: "13px", margin: 0 }}>💳 Card &nbsp;|&nbsp; 📱 USSD &nbsp;|&nbsp; 🏦 Bank Transfer &nbsp;|&nbsp; 📲 Mobile Money</p>
              </div>
              <button onClick={() => fundWallet()} disabled={fundLoading} style={{ width: "100%", padding: "14px", background: "linear-gradient(135deg, #f97316, #dc2626)", color: "var(--text-primary)", border: "none", borderRadius: "10px", cursor: "pointer", fontWeight: "700", fontSize: "15px" }}>
                {fundLoading ? "Redirecting..." : `Add N${Number(fundAmount || 0).toLocaleString()} to Wallet`}
              </button>
              <p style={{ color: "var(--text-muted)", fontSize: "11px", textAlign: "center", marginTop: "8px" }}>Powered by Paystack. Funds reflect instantly after payment.</p>
            </div>
          </div>
        )}

        {/* SEND MONEY TAB */}
        {tab === "Send Money" && (
          <div>
            <h2 style={{ color: "var(--text-primary)", marginBottom: "16px" }}>Send Money</h2>
            {/* QR Receive Card */}
            <div style={{ background: "var(--bg-card)", border: "1px solid #2a2a2a", borderRadius: "12px", padding: "16px", marginBottom: "16px", display: "flex", alignItems: "center", justifyContent: "space-between", gap: "12px" }}>
              <div>
                <p style={{ color: "var(--text-primary)", fontWeight: "700", fontSize: "14px", margin: "0 0 4px" }}>🆔 Receive via QR</p>
                <p style={{ color: "var(--text-muted)", fontSize: "12px", margin: 0 }}>Show your QR code to receive money</p>
              </div>
              <button onClick={() => { setShowQr(true); if (!qrDataUrl && user?.id) generateQr(user.id); }} style={{ padding: "10px 16px", background: "linear-gradient(135deg, #f97316, #dc2626)", color: "#fff", border: "none", borderRadius: "8px", cursor: "pointer", fontWeight: "700", fontSize: "12px", flexShrink: 0 }}>Show QR</button>
            </div>

            <div style={{ background: "var(--bg-card)", border: "1px solid #2a2a2a", borderRadius: "12px", padding: "20px" }}>
              <p style={{ color: "var(--text-muted)", fontSize: "13px", marginBottom: "16px" }}>Send to any TechMart user instantly</p>
              <input placeholder="Recipient email address" value={sendForm.recipientEmail} onChange={e => setSendForm({...sendForm, recipientEmail: e.target.value})} style={inp} />
              <input placeholder="Amount (N)" type="number" value={sendForm.amount} onChange={e => setSendForm({...sendForm, amount: e.target.value})} style={inp} />
              <input placeholder="Note (optional)" value={sendForm.note} onChange={e => setSendForm({...sendForm, note: e.target.value})} style={inp} />
              <p style={{ color: "var(--text-muted)", fontSize: "12px", margin: "0 0 16px" }}>Available: ₦{(dashboard?.balance || 0).toLocaleString()}</p>
              <button onClick={() => requirePin(sendMoney)} disabled={sendLoading} style={{ width: "100%", padding: "14px", background: "linear-gradient(135deg, #f97316, #dc2626)", color: "var(--text-primary)", border: "none", borderRadius: "10px", cursor: "pointer", fontWeight: "700", fontSize: "15px" }}>
                {sendLoading ? "Sending..." : "Send Money"}
              </button>
            </div>
          </div>
        )}

        {/* WITHDRAW TAB */}
        {tab === "Withdraw" && (
          <div>
            <h2 style={{ color: "var(--text-primary)", marginBottom: "16px" }}>Withdraw to Bank</h2>
            <div style={{ background: "#0a1a2a", border: "1px solid #3b82f6", borderRadius: "12px", padding: "20px", marginBottom: "16px", textAlign: "center" }}>
              <p style={{ fontSize: "28px", margin: "0 0 8px" }}>🏦</p>
              <p style={{ color: "#3b82f6", fontWeight: "700", fontSize: "16px", margin: "0 0 8px" }}>Bank Withdrawals Coming Soon</p>
              <p style={{ color: "var(--text-muted)", fontSize: "13px", margin: 0, lineHeight: "1.6" }}>We're completing our business registration to enable secure bank withdrawals. In the meantime, you can use your wallet balance to shop, pay for orders, and transfer to other TechMart users.</p>
            </div>

            <div style={{ background: "var(--bg-card)", border: "1px solid #2a2a2a", borderRadius: "12px", padding: "20px" }}>
              <p style={{ color: "var(--text-muted)", fontSize: "13px", marginBottom: "16px" }}>Available: ₦{(dashboard?.balance || 0).toLocaleString()}</p>
              <input placeholder="Amount (N) — minimum N500" type="number" value={withdrawForm.amount} onChange={e => setWithdrawForm({...withdrawForm, amount: e.target.value})} style={inp} />
              <select value={withdrawForm.bankCode} onChange={e => setWithdrawForm({...withdrawForm, bankCode: e.target.value, accountName: ""})} style={{ ...inp, appearance: "none" }}>
                <option value="">Select Bank</option>
                {banks.map(b => <option key={b.code} value={b.code}>{b.name}</option>)}
              </select>
              <div style={{ display: "flex", gap: "8px", marginBottom: "12px" }}>
                <input placeholder="Account Number" value={withdrawForm.accountNumber} onChange={e => setWithdrawForm({...withdrawForm, accountNumber: e.target.value, accountName: ""})} style={{ ...inp, marginBottom: 0, flex: 1 }} maxLength={10} />
                <button onClick={verifyAccount} disabled={verifyingAccount || !withdrawForm.accountNumber || !withdrawForm.bankCode} style={{ padding: "12px 14px", background: "#333", color: "var(--text-primary)", border: "none", borderRadius: "10px", cursor: "pointer", fontSize: "13px", fontWeight: "600", flexShrink: 0 }}>
                  {verifyingAccount ? "..." : "Verify"}
                </button>
              </div>
              {withdrawForm.accountName && (
                <div style={{ background: "#0a2a1a", border: "1px solid #22c55e", borderRadius: "8px", padding: "10px 14px", marginBottom: "12px" }}>
                  <p style={{ color: "#22c55e", fontWeight: "700", fontSize: "14px", margin: 0 }}>{withdrawForm.accountName}</p>
                </div>
              )}
              <button onClick={() => requirePin(withdraw)} disabled={withdrawLoading || !withdrawForm.accountName} style={{ width: "100%", padding: "14px", background: "linear-gradient(135deg, #f97316, #dc2626)", color: "var(--text-primary)", border: "none", borderRadius: "10px", cursor: "pointer", fontWeight: "700", fontSize: "15px", opacity: !withdrawForm.accountName ? 0.6 : 1 }}>
                {withdrawLoading ? "Processing..." : `Withdraw ₦${Number(withdrawForm.amount || 0).toLocaleString()}`}
              </button>
            </div>
          </div>
        )}

        {/* INSIGHTS TAB */}
        {tab === "Insights" && (
          <div>
            <h2 style={{ color: "var(--text-primary)", marginBottom: "16px" }}>💳 Spend Intelligence</h2>
            {!insights ? (
              <button onClick={fetchInsights} disabled={insightsLoading} style={{ width: "100%", padding: "14px", background: "linear-gradient(135deg, #f97316, #dc2626)", color: "#fff", border: "none", borderRadius: "10px", cursor: "pointer", fontWeight: "700", fontSize: "15px" }}>
                {insightsLoading ? "Loading..." : "📊 Load My Insights"}
              </button>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>

                {/* Budget Alert */}
                {insights.budgetAlert && (
                  <div style={{ background: "#1a0a00", border: "1px solid #f97316", borderRadius: "12px", padding: "14px 16px", display: "flex", alignItems: "center", gap: "10px" }}>
                    <span style={{ fontSize: "20px" }}>⚠️</span>
                    <p style={{ color: "#f97316", fontWeight: "700", fontSize: "13px", margin: 0 }}>You have used {insights.budgetProgress}% of your ₦{Number(insights.budget).toLocaleString()} monthly budget!</p>
                  </div>
                )}

                {/* This Month vs Last Month */}
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
                  <div style={{ background: "var(--bg-card)", border: "1px solid #2a2a2a", borderRadius: "12px", padding: "16px", textAlign: "center" }}>
                    <p style={{ color: "var(--text-muted)", fontSize: "11px", margin: "0 0 6px", textTransform: "uppercase" }}>This Month</p>
                    <p style={{ color: "#f97316", fontWeight: "900", fontSize: "20px", margin: "0 0 4px" }}>₦{Number(insights.thisMonth).toLocaleString()}</p>
                    <p style={{ color: insights.change >= 0 ? "#dc2626" : "#22c55e", fontSize: "11px", margin: 0 }}>{insights.change >= 0 ? "▲" : "▼"} {Math.abs(insights.change)}% vs last month</p>
                  </div>
                  <div style={{ background: "var(--bg-card)", border: "1px solid #2a2a2a", borderRadius: "12px", padding: "16px", textAlign: "center" }}>
                    <p style={{ color: "var(--text-muted)", fontSize: "11px", margin: "0 0 6px", textTransform: "uppercase" }}>Last Month</p>
                    <p style={{ color: "var(--text-primary)", fontWeight: "900", fontSize: "20px", margin: "0 0 4px" }}>₦{Number(insights.lastMonth).toLocaleString()}</p>
                    <p style={{ color: "var(--text-muted)", fontSize: "11px", margin: 0 }}>Top: {insights.topCategory}</p>
                  </div>
                </div>

                {/* Budget Progress */}
                <div style={{ background: "var(--bg-card)", border: "1px solid #2a2a2a", borderRadius: "12px", padding: "16px" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "10px" }}>
                    <p style={{ color: "var(--text-primary)", fontWeight: "700", fontSize: "14px", margin: 0 }}>Monthly Budget</p>
                    <p style={{ color: "#f97316", fontWeight: "700", fontSize: "13px", margin: 0 }}>{insights.budgetProgress}%</p>
                  </div>
                  {insights.budget > 0 ? (
                    <div style={{ background: "#1a1a1a", borderRadius: "6px", height: "8px", marginBottom: "10px" }}>
                      <div style={{ width: `${insights.budgetProgress}%`, height: "8px", borderRadius: "6px", background: insights.budgetProgress >= 80 ? "#dc2626" : "#22c55e", transition: "width 0.5s ease" }} />
                    </div>
                  ) : (
                    <p style={{ color: "var(--text-muted)", fontSize: "12px", margin: "0 0 10px" }}>No budget set yet</p>
                  )}
                  <div style={{ display: "flex", gap: "8px" }}>
                    <input type="number" placeholder="Set monthly budget (₦)" value={budget} onChange={e => setBudgetInput(e.target.value)} style={{ flex: 1, padding: "10px 14px", background: "#111", border: "1px solid #333", borderRadius: "8px", color: "var(--text-primary)", fontSize: "13px" }} />
                    <button onClick={saveBudget} disabled={budgetSaving} style={{ padding: "10px 16px", background: "#22c55e", color: "#000", border: "none", borderRadius: "8px", cursor: "pointer", fontWeight: "700", fontSize: "13px" }}>
                      {budgetSaving ? "..." : "Set"}
                    </button>
                  </div>
                </div>

                {/* Category Breakdown */}
                <div style={{ background: "var(--bg-card)", border: "1px solid #2a2a2a", borderRadius: "12px", padding: "16px" }}>
                  <p style={{ color: "var(--text-primary)", fontWeight: "700", fontSize: "14px", margin: "0 0 12px" }}>Spending by Category</p>
                  {Object.keys(insights.categories).length === 0 ? (
                    <p style={{ color: "var(--text-muted)", fontSize: "13px" }}>No spending this month yet</p>
                  ) : (
                    Object.entries(insights.categories).sort((a, b) => b[1] - a[1]).map(([cat, amt]) => {
                      const total = insights.thisMonth || 1;
                      const pct = Math.round((amt / total) * 100);
                      return (
                        <div key={cat} style={{ marginBottom: "10px" }}>
                          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "4px" }}>
                            <p style={{ color: "var(--text-primary)", fontSize: "13px", margin: 0 }}>{cat}</p>
                            <p style={{ color: "#f97316", fontWeight: "700", fontSize: "13px", margin: 0 }}>₦{amt.toLocaleString()} ({pct}%)</p>
                          </div>
                          <div style={{ background: "#1a1a1a", borderRadius: "4px", height: "6px" }}>
                            <div style={{ width: `${pct}%`, height: "6px", borderRadius: "4px", background: "linear-gradient(135deg, #f97316, #dc2626)" }} />
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>

                {/* Monthly Trend */}
                <div style={{ background: "var(--bg-card)", border: "1px solid #2a2a2a", borderRadius: "12px", padding: "16px" }}>
                  <p style={{ color: "var(--text-primary)", fontWeight: "700", fontSize: "14px", margin: "0 0 12px" }}>6-Month Trend</p>
                  <div style={{ display: "flex", alignItems: "flex-end", gap: "8px", height: "80px" }}>
                    {insights.monthlyTrend.map((m, i) => {
                      const max = Math.max(...insights.monthlyTrend.map(x => x.total), 1);
                      const h = Math.max((m.total / max) * 70, 4);
                      return (
                        <div key={i} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: "4px" }}>
                          <div style={{ width: "100%", height: `${h}px`, background: i === 5 ? "linear-gradient(135deg, #f97316, #dc2626)" : "#333", borderRadius: "4px 4px 0 0" }} />
                          <p style={{ color: "var(--text-muted)", fontSize: "9px", margin: 0, textAlign: "center" }}>{m.month.split(" ")[0]}</p>
                        </div>
                      );
                    })}
                  </div>
                </div>

                <button onClick={fetchInsights} style={{ padding: "10px", background: "#1a1a1a", border: "1px solid #333", color: "var(--text-muted)", borderRadius: "8px", cursor: "pointer", fontSize: "12px" }}>🔄 Refresh</button>
              </div>
            )}
          </div>
        )}

        {/* KYC TAB */}
        {tab === "KYC" && (
          <div>
            <h2 style={{ color: "var(--text-primary)", marginBottom: "16px" }}>🔐 Identity Verification</h2>
            {(bvnVerified || ninVerified) ? (
              <div style={{ background: "#0a1a0a", border: "1px solid #22c55e", borderRadius: "12px", padding: "24px", textAlign: "center" }}>
                <p style={{ fontSize: "40px", margin: "0 0 12px" }}>✅</p>
                <p style={{ color: "#22c55e", fontWeight: "700", fontSize: "18px", margin: "0 0 8px" }}>BVN Verified</p>
                <p style={{ color: "var(--text-muted)", fontSize: "13px", margin: 0 }}>Your identity has been verified. You have access to higher transaction limits.</p>
                <div style={{ marginTop: "16px", background: "var(--bg-card)", borderRadius: "10px", padding: "16px" }}>
                  <p style={{ color: "var(--text-primary)", fontWeight: "700", fontSize: "13px", margin: "0 0 8px" }}>Your Limits</p>
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "8px" }}>
                    <p style={{ color: "var(--text-muted)", fontSize: "13px", margin: 0 }}>Daily Funding</p>
                    <p style={{ color: "#22c55e", fontWeight: "700", fontSize: "13px", margin: 0 }}>₦500,000</p>
                  </div>
                  <div style={{ display: "flex", justifyContent: "space-between" }}>
                    <p style={{ color: "var(--text-muted)", fontSize: "13px", margin: 0 }}>Daily Transfers</p>
                    <p style={{ color: "#22c55e", fontWeight: "700", fontSize: "13px", margin: 0 }}>₦200,000</p>
                  </div>
                </div>
              </div>
            ) : (
              <div>
                <div style={{ background: "var(--bg-card)", border: "1px solid #2a2a2a", borderRadius: "12px", padding: "20px", marginBottom: "16px" }}>
                  <p style={{ color: "var(--text-primary)", fontWeight: "700", fontSize: "15px", margin: "0 0 8px" }}>Why verify your BVN?</p>
                  <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                    {[["💰", "Daily funding limit", "₦50,000 → ₦500,000"], ["📤", "Daily transfer limit", "₦20,000 → ₦200,000"], ["🔒", "Account security", "Extra protection on your wallet"]].map(([icon, label, value]) => (
                      <div key={label} style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                        <p style={{ fontSize: "20px", margin: 0 }}>{icon}</p>
                        <div>
                          <p style={{ color: "var(--text-primary)", fontSize: "13px", fontWeight: "600", margin: "0 0 2px" }}>{label}</p>
                          <p style={{ color: "#22c55e", fontSize: "12px", margin: 0 }}>{value}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
                <div style={{ background: "var(--bg-card)", border: "1px solid #2a2a2a", borderRadius: "12px", padding: "20px" }}>
                  <div style={{ display: "flex", gap: "8px", marginBottom: "16px" }}>
                    {["bvn", "nin"].map(method => (
                      <button key={method} onClick={() => setKycMethod(method)} style={{ flex: 1, padding: "10px", borderRadius: "8px", border: `2px solid ${kycMethod === method ? "#22c55e" : "#333"}`, background: kycMethod === method ? "#0a1a0a" : "#111", color: kycMethod === method ? "#22c55e" : "#888", fontWeight: "700", cursor: "pointer", fontSize: "13px", textTransform: "uppercase" }}>{method}</button>
                    ))}
                  </div>
                  {kycMethod === "bvn" ? (
                    <div>
                      <p style={{ color: "var(--text-muted)", fontSize: "12px", margin: "0 0 12px" }}>Your BVN is an 11-digit number. Dial *565*0# on your registered phone to get it.</p>
                      <input placeholder="Enter your 11-digit BVN" type="number" value={bvnInput} onChange={e => setBvnInput(e.target.value)} maxLength={11} style={{ width: "100%", padding: "12px 14px", background: "#111", border: "1px solid #333", borderRadius: "10px", color: "var(--text-primary)", fontSize: "15px", marginBottom: "12px", boxSizing: "border-box", letterSpacing: "2px" }} />
                      <p style={{ color: "var(--text-muted)", fontSize: "11px", margin: "0 0 16px" }}>🔒 Your BVN is encrypted and never stored. It is only used for identity verification.</p>
                      <button onClick={verifyBvn} disabled={bvnLoading || bvnInput.length !== 11} style={{ width: "100%", padding: "14px", background: "linear-gradient(135deg, #22c55e, #16a34a)", color: "#000", border: "none", borderRadius: "10px", cursor: "pointer", fontWeight: "700", fontSize: "15px", opacity: bvnInput.length !== 11 ? 0.6 : 1 }}>
                        {bvnLoading ? "Verifying..." : "Verify BVN"}
                      </button>
                    </div>
                  ) : (
                    <div>
                      <p style={{ color: "var(--text-muted)", fontSize: "12px", margin: "0 0 12px" }}>Your NIN is an 11-digit number. Dial *346# to get it or check your NIN slip.</p>
                      <input placeholder="Enter your 11-digit NIN" type="number" value={ninInput} onChange={e => setNinInput(e.target.value)} maxLength={11} style={{ width: "100%", padding: "12px 14px", background: "#111", border: "1px solid #333", borderRadius: "10px", color: "var(--text-primary)", fontSize: "15px", marginBottom: "12px", boxSizing: "border-box", letterSpacing: "2px" }} />
                      <p style={{ color: "var(--text-muted)", fontSize: "11px", margin: "0 0 16px" }}>🔒 Your NIN is encrypted and never stored. It is only used for identity verification.</p>
                      <button onClick={verifyNin} disabled={ninLoading || ninInput.length !== 11} style={{ width: "100%", padding: "14px", background: "linear-gradient(135deg, #22c55e, #16a34a)", color: "#000", border: "none", borderRadius: "10px", cursor: "pointer", fontWeight: "700", fontSize: "15px", opacity: ninInput.length !== 11 ? 0.6 : 1 }}>
                        {ninLoading ? "Verifying..." : "Verify NIN"}
                      </button>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        )}

        {/* AIRTIME TAB */}
        {tab === "Airtime" && (
          <div>
            <h2 style={{ color: "var(--text-primary)", marginBottom: "16px" }}>Buy Airtime</h2>
        <div style={{ background: "#1a0a00", border: "1px solid #f97316", borderRadius: "12px", padding: "16px", marginBottom: "16px", textAlign: "center" }}>
          <p style={{ fontSize: "24px", margin: "0 0 8px" }}>🔧</p>
          <p style={{ color: "#f97316", fontWeight: "700", margin: "0 0 4px" }}>Coming Soon</p>
          <p style={{ color: "var(--text-muted)", fontSize: "13px", margin: 0 }}>This service is being activated. Check back soon!</p>
        </div>

            <div style={{ background: "var(--bg-card)", border: "1px solid #2a2a2a", borderRadius: "12px", padding: "20px" }}>
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
              <p style={{ color: "var(--text-muted)", fontSize: "12px", margin: "0 0 16px" }}>Available: ₦{(dashboard?.balance || 0).toLocaleString()}</p>
              <button onClick={() => requirePin(buyAirtime)} disabled={airtimeLoading} style={{ width: "100%", padding: "14px", background: "linear-gradient(135deg, #f97316, #dc2626)", color: "var(--text-primary)", border: "none", borderRadius: "10px", cursor: "pointer", fontWeight: "700", fontSize: "15px" }}>
                {airtimeLoading ? "Processing..." : `Buy ₦${Number(airtimeForm.amount || 0).toLocaleString()} Airtime`}
              </button>
            </div>
          </div>
        )}

        {/* DATA TAB */}
        {tab === "Data" && (
          <div>
            <h2 style={{ color: "var(--text-primary)", marginBottom: "16px" }}>Buy Data Bundle</h2>
        <div style={{ background: "#1a0a00", border: "1px solid #f97316", borderRadius: "12px", padding: "16px", marginBottom: "16px", textAlign: "center" }}>
          <p style={{ fontSize: "24px", margin: "0 0 8px" }}>🔧</p>
          <p style={{ color: "#f97316", fontWeight: "700", margin: "0 0 4px" }}>Coming Soon</p>
          <p style={{ color: "var(--text-muted)", fontSize: "13px", margin: 0 }}>This service is being activated. Check back soon!</p>
        </div>

            <div style={{ background: "var(--bg-card)", border: "1px solid #2a2a2a", borderRadius: "12px", padding: "20px" }}>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: "10px", marginBottom: "16px" }}>
                {["MTN", "Airtel", "Glo", "9mobile"].map(n => (
                  <button key={n} onClick={() => { setDataForm({...dataForm, network: n, planId: "", planName: "", amount: ""}); fetchDataPlans(n); }}
                    style={{ padding: "12px", borderRadius: "10px", border: `2px solid ${dataForm.network === n ? "#f97316" : "#333"}`, background: dataForm.network === n ? "#1a0a00" : "#111", color: dataForm.network === n ? "#f97316" : "#888", fontWeight: "700", cursor: "pointer" }}>{n}</button>
                ))}
              </div>
              <input placeholder="Phone number (e.g. 08012345678)" value={dataForm.phone} onChange={e => setDataForm({...dataForm, phone: e.target.value})} style={inp} />
              {dataPlansLoading && <p style={{ color: "var(--text-muted)", fontSize: "13px" }}>Loading plans...</p>}
              {dataPlans.length > 0 && (
                <div style={{ maxHeight: "200px", overflowY: "auto", marginBottom: "12px", border: "1px solid #2a2a2a", borderRadius: "10px" }}>
                  {dataPlans.map((plan, i) => (
                    <div key={i} onClick={() => setDataForm({...dataForm, planId: plan.id || plan.code || String(i), planName: plan.name || plan.description, amount: String(plan.price || plan.amount)})}
                      style={{ padding: "12px 16px", borderBottom: "1px solid var(--border-light)", cursor: "pointer", background: dataForm.planId === (plan.id || plan.code || String(i)) ? "#1a0a00" : "transparent", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
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
              <p style={{ color: "var(--text-muted)", fontSize: "12px", margin: "0 0 16px" }}>Available: ₦{(dashboard?.balance || 0).toLocaleString()}</p>
              <button onClick={() => requirePin(buyData)} disabled={dataLoading || !dataForm.planId} style={{ width: "100%", padding: "14px", background: dataForm.planId ? "linear-gradient(135deg, #f97316, #dc2626)" : "#333", color: "var(--text-primary)", border: "none", borderRadius: "10px", cursor: dataForm.planId ? "pointer" : "not-allowed", fontWeight: "700", fontSize: "15px" }}>
                {dataLoading ? "Processing..." : dataForm.planName ? `Buy ${dataForm.planName}` : "Select a plan"}
              </button>
            </div>
          </div>
        )}

        {/* ELECTRICITY TAB */}
        {tab === "Electricity" && (
          <div>
            <h2 style={{ color: "var(--text-primary)", marginBottom: "16px" }}>⚡ Electricity Payment</h2>
        <div style={{ background: "#1a0a00", border: "1px solid #f97316", borderRadius: "12px", padding: "16px", marginBottom: "16px", textAlign: "center" }}>
          <p style={{ fontSize: "24px", margin: "0 0 8px" }}>🔧</p>
          <p style={{ color: "#f97316", fontWeight: "700", margin: "0 0 4px" }}>Coming Soon</p>
          <p style={{ color: "var(--text-muted)", fontSize: "13px", margin: 0 }}>This service is being activated. Check back soon!</p>
        </div>

            <div style={{ background: "var(--bg-card)", border: "1px solid #2a2a2a", borderRadius: "12px", padding: "20px" }}>
              <p style={{ color: "var(--text-muted)", fontSize: "13px", marginBottom: "12px" }}>Select Distribution Company</p>
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
              <p style={{ color: "var(--text-muted)", fontSize: "12px", margin: "0 0 16px" }}>Available: ₦{(dashboard?.balance || 0).toLocaleString()}</p>
              <button onClick={() => requirePin(payElectricity)} disabled={elecLoading || !elecVerified} style={{ width: "100%", padding: "14px", background: elecVerified ? "linear-gradient(135deg, #f97316, #dc2626)" : "#333", color: "var(--text-primary)", border: "none", borderRadius: "10px", cursor: elecVerified ? "pointer" : "not-allowed", fontWeight: "700", fontSize: "15px" }}>
                {elecLoading ? "Processing..." : `Pay ₦${Number(elecForm.amount || 0).toLocaleString()} Electricity`}
              </button>
            </div>
          </div>
        )}

        {/* CABLE TV TAB */}
        {tab === "Cable TV" && (
          <div>
            <h2 style={{ color: "var(--text-primary)", marginBottom: "16px" }}>📺 Cable TV Subscription</h2>
            <div style={{ background: "var(--bg-card)", border: "1px solid #2a2a2a", borderRadius: "12px", padding: "20px" }}>
              <p style={{ color: "var(--text-muted)", fontSize: "13px", marginBottom: "12px" }}>Select Provider</p>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "8px", marginBottom: "16px" }}>
                {["DSTV", "GOTV", "STARTIMES"].map(p => (
                  <button key={p} onClick={() => { setCtvForm({...ctvForm, provider: p, planId: "", planName: "", amount: "", customerName: ""}); setCtvVerified(false); fetchCtvPlans(p); }}
                    style={{ padding: "12px 6px", borderRadius: "8px", border: `2px solid ${ctvForm.provider === p ? "#f97316" : "#333"}`, background: ctvForm.provider === p ? "#1a0a00" : "#111", color: ctvForm.provider === p ? "#f97316" : "#888", fontWeight: "700", cursor: "pointer", fontSize: "12px", textAlign: "center" }}>{p}</button>
                ))}
              </div>
              <input placeholder="Smartcard / IUC number" value={ctvForm.smartcardNumber} onChange={e => { setCtvForm({...ctvForm, smartcardNumber: e.target.value}); setCtvVerified(false); }} style={inp} />
              {!ctvVerified ? (
                <button onClick={verifySmartcard} disabled={ctvVerifying} style={{ width: "100%", padding: "12px", background: "#1a1a2a", border: "1px solid #f97316", color: "#f97316", borderRadius: "10px", cursor: "pointer", fontWeight: "700", marginBottom: "12px" }}>
                  {ctvVerifying ? "Verifying..." : "Verify Smartcard"}
                </button>
              ) : (
                <div style={{ background: "#0a2a0a", border: "1px solid #22c55e", borderRadius: "8px", padding: "10px 14px", marginBottom: "12px" }}>
                  <p style={{ color: "#22c55e", margin: 0, fontSize: "13px" }}>✅ Verified: <strong>{ctvForm.customerName}</strong></p>
                </div>
              )}
              {ctvPlansLoading && <p style={{ color: "var(--text-muted)", fontSize: "13px" }}>Loading packages...</p>}
              {ctvPlans.length > 0 && (
                <div style={{ maxHeight: "200px", overflowY: "auto", marginBottom: "12px", border: "1px solid #2a2a2a", borderRadius: "10px" }}>
                  {ctvPlans.map((plan, i) => (
                    <div key={i} onClick={() => setCtvForm({...ctvForm, planId: plan.id || plan.code || String(i), planName: plan.name || plan.description, amount: String(plan.price || plan.amount)})}
                      style={{ padding: "12px 16px", borderBottom: "1px solid var(--border-light)", cursor: "pointer", background: ctvForm.planId === (plan.id || plan.code || String(i)) ? "#1a0a00" : "transparent", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                      <span style={{ color: ctvForm.planId === (plan.id || plan.code || String(i)) ? "#f97316" : "#fff", fontSize: "13px" }}>{plan.name || plan.description}</span>
                      <span style={{ color: "#22c55e", fontWeight: "700", fontSize: "13px" }}>₦{(plan.price || plan.amount || 0).toLocaleString()}</span>
                    </div>
                  ))}
                </div>
              )}
              {ctvForm.planName && (
                <div style={{ background: "#0a1a0a", border: "1px solid #22c55e", borderRadius: "8px", padding: "10px 14px", marginBottom: "12px" }}>
                  <p style={{ color: "#22c55e", margin: 0, fontSize: "13px" }}>Selected: <strong>{ctvForm.planName}</strong> — ₦{Number(ctvForm.amount || 0).toLocaleString()}</p>
                </div>
              )}
              <p style={{ color: "var(--text-muted)", fontSize: "12px", margin: "0 0 16px" }}>Available: ₦{(dashboard?.balance || 0).toLocaleString()}</p>
              <button onClick={() => requirePin(payCableTV)} disabled={ctvLoading || !ctvVerified || !ctvForm.planId} style={{ width: "100%", padding: "14px", background: (ctvVerified && ctvForm.planId) ? "linear-gradient(135deg, #f97316, #dc2626)" : "#333", color: "var(--text-primary)", border: "none", borderRadius: "10px", cursor: (ctvVerified && ctvForm.planId) ? "pointer" : "not-allowed", fontWeight: "700", fontSize: "15px" }}>
                {ctvLoading ? "Processing..." : ctvForm.planName ? `Subscribe — ₦${Number(ctvForm.amount || 0).toLocaleString()}` : "Select a package"}
              </button>
            </div>
          </div>
        )}

        {/* BETTING TAB */}
        {tab === "Betting" && (
          <div>
            <h2 style={{ color: "var(--text-primary)", marginBottom: "16px" }}>🎯 Fund Betting Wallet</h2>
        <div style={{ background: "#1a0a00", border: "1px solid #f97316", borderRadius: "12px", padding: "16px", marginBottom: "16px", textAlign: "center" }}>
          <p style={{ fontSize: "24px", margin: "0 0 8px" }}>🔧</p>
          <p style={{ color: "#f97316", fontWeight: "700", margin: "0 0 4px" }}>Coming Soon</p>
          <p style={{ color: "var(--text-muted)", fontSize: "13px", margin: 0 }}>This service is being activated. Check back soon!</p>
        </div>

            <div style={{ background: "var(--bg-card)", border: "1px solid #2a2a2a", borderRadius: "12px", padding: "20px" }}>
              <p style={{ color: "var(--text-muted)", fontSize: "13px", marginBottom: "12px" }}>Select Platform</p>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "8px", marginBottom: "16px" }}>
                {[{ id: "bet9ja", name: "Bet9ja", icon: "🎯" }, { id: "sportybet", name: "SportyBet", icon: "⚽" }, { id: "1xbet", name: "1xBet", icon: "🏆" }].map(p => (
                  <button key={p.id} onClick={() => setBetForm({...betForm, platform: p.id})}
                    style={{ padding: "12px 6px", borderRadius: "8px", border: `2px solid ${betForm.platform === p.id ? "#f97316" : "#333"}`, background: betForm.platform === p.id ? "#1a0a00" : "#111", color: betForm.platform === p.id ? "#f97316" : "#888", fontWeight: "700", cursor: "pointer", fontSize: "11px", textAlign: "center" }}>{p.icon} {p.name}</button>
                ))}
              </div>
              <input placeholder="Your Betting User ID / Username" value={betForm.bettingId} onChange={e => setBetForm({...betForm, bettingId: e.target.value})} style={inp} />
              <div style={{ display: "flex", gap: "8px", marginBottom: "12px", flexWrap: "wrap" }}>
                {[500, 1000, 2000, 5000].map(a => (
                  <button key={a} onClick={() => setBetForm({...betForm, amount: String(a)})} style={{ padding: "8px 16px", borderRadius: "8px", border: `1px solid ${betForm.amount === String(a) ? "#f97316" : "#333"}`, background: betForm.amount === String(a) ? "#1a0a00" : "#111", color: betForm.amount === String(a) ? "#f97316" : "#888", cursor: "pointer", fontWeight: "600", fontSize: "13px" }}>N{a.toLocaleString()}</button>
                ))}
              </div>
              <input placeholder="Or enter custom amount (min N100)" type="number" value={betForm.amount} onChange={e => setBetForm({...betForm, amount: e.target.value})} style={inp} />
              <p style={{ color: "var(--text-muted)", fontSize: "12px", margin: "0 0 16px" }}>Available: N{(dashboard?.balance || 0).toLocaleString()}</p>
              <button onClick={() => requirePin(fundBetting)} disabled={betLoading} style={{ width: "100%", padding: "14px", background: "linear-gradient(135deg, #f97316, #dc2626)", color: "var(--text-primary)", border: "none", borderRadius: "10px", cursor: "pointer", fontWeight: "700", fontSize: "15px" }}>
                {betLoading ? "Processing..." : `Fund N${Number(betForm.amount || 0).toLocaleString()} to ${betForm.platform || "Betting"} Wallet`}
              </button>
            </div>
          </div>
        )}

        {/* HISTORY TAB */}
        {tab === "History" && (
          <div>
            <h2 style={{ color: "var(--text-primary)", marginBottom: "16px" }}>Transaction History</h2>
            <div style={{ background: "var(--bg-card)", border: "1px solid #2a2a2a", borderRadius: "12px", padding: "16px" }}>
              {(dashboard?.recentTransactions || []).length === 0 ? (
                <EmptyState icon="💳" title="No transactions yet" subtitle="Fund your wallet to get started" action="Add Money" onAction={() => setTab('Add Money')} />
              ) : (
                dashboard.recentTransactions.map((tx, i) => (
                  <div key={i} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "12px 0", borderBottom: "1px solid var(--border-light)" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                      <div style={{ width: "36px", height: "36px", borderRadius: "50%", background: tx.type === "credit" ? "#0a2a1a" : "#2a1010", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "16px" }}>
                        {tx.type === "credit" ? "⬇️" : "⬆️"}
                      </div>
                      <div>
                        <p style={{ color: "var(--text-primary)", fontSize: "13px", fontWeight: "600", margin: "0 0 2px" }}>{tx.description}</p>
                        <p style={{ color: "var(--text-muted)", fontSize: "11px", margin: 0 }}>{new Date(tx.createdAt).toLocaleString()}</p>
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

      {pinModal.open && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.85)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 9999 }}>
          <div style={{ background: "var(--bg-card)", border: "1px solid var(--border-color)", borderRadius: "16px", padding: "32px 24px", width: "300px", textAlign: "center" }}>
            <h3 style={{ color: "var(--text-primary)", marginBottom: "8px" }}>🔐 Enter Wallet PIN</h3>
            <p style={{ color: "var(--text-muted)", fontSize: "13px", marginBottom: "20px" }}>Enter your 4-digit PIN to confirm</p>
            <input type="password" maxLength={4} placeholder="4 digits" value={pinInput} onChange={e => { setPinInput(e.target.value.replace(/[^0-9]/g, "")); setPinError(""); }}
              style={{ ...inp, textAlign: "center", fontSize: "24px", letterSpacing: "8px", marginBottom: "8px" }} />
            {pinError && <p style={{ color: "#f87171", fontSize: "12px", marginBottom: "8px" }}>{pinError}</p>}
            <button onClick={confirmPin} disabled={pinLoading} style={{ width: "100%", padding: "12px", background: "linear-gradient(135deg, #f97316, #dc2626)", color: "var(--text-primary)", border: "none", borderRadius: "10px", cursor: "pointer", fontWeight: "700", marginBottom: "10px" }}>
              {pinLoading ? "Verifying..." : "Confirm"}
            </button>

            <button
              onClick={requestPinReset}
              style={{
                background: "none",
                border: "none",
                color: "#3b82f6",
                cursor: "pointer",
                fontSize: "13px",
                marginBottom: "10px"
              }}
            >
              Forgot Wallet PIN?
            </button>

            <button onClick={() => setPinModal({ open: false, onSuccess: null })} style={{ background: "none", border: "none", color: "var(--text-muted)", cursor: "pointer", fontSize: "13px" }}>Cancel</button>
          </div>
        </div>
      )}

      {showSetPin && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.85)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 9999 }}>
          <div style={{ background: "var(--bg-card)", border: "1px solid var(--border-color)", borderRadius: "16px", padding: "32px 24px", width: "300px", textAlign: "center" }}>
            <h3 style={{ color: "var(--text-primary)", marginBottom: "8px" }}>Set Wallet PIN</h3>
            <p style={{ color: "var(--text-muted)", fontSize: "13px", marginBottom: "20px" }}>Create a 4-digit PIN to secure your wallet</p>
            <input type="password" maxLength={4} placeholder="Enter 4-digit PIN" value={newPin} onChange={e => setNewPin(e.target.value.replace(/[^0-9]/g, ""))}
              style={{ ...inp, textAlign: "center", fontSize: "24px", letterSpacing: "8px", marginBottom: "16px" }} />
            <button onClick={setWalletPin} style={{ width: "100%", padding: "12px", background: "linear-gradient(135deg, #f97316, #dc2626)", color: "var(--text-primary)", border: "none", borderRadius: "10px", cursor: "pointer", fontWeight: "700", marginBottom: "10px" }}>
              Set PIN
            </button>
            <button onClick={() => setShowSetPin(false)} style={{ background: "none", border: "none", color: "var(--text-muted)", cursor: "pointer", fontSize: "13px" }}>Cancel</button>
          </div>
        </div>
      )}

      {showChangePin && (
        <div style={{position:"fixed",inset:0,background:"rgba(0,0,0,.85)",display:"flex",alignItems:"center",justifyContent:"center",zIndex:9999}}>
          <div style={{background:"var(--bg-card)",border:"1px solid var(--border-color)",borderRadius:"16px",padding:"24px",width:"320px"}}>
            <h3 style={{marginBottom:"15px"}}>Change Wallet PIN</h3>

            <input
              type="password"
              maxLength={4}
              placeholder="Current PIN"
              value={oldPin}
              onChange={e=>setOldPin(e.target.value.replace(/\D/g,''))}
              style={{...inp,textAlign:"center",fontSize:"22px",letterSpacing:"8px",marginBottom:"12px"}}
            />

            <input
              type="password"
              maxLength={4}
              placeholder="New PIN"
              value={changePin}
              onChange={e=>setChangePin(e.target.value.replace(/\D/g,''))}
              style={{...inp,textAlign:"center",fontSize:"22px",letterSpacing:"8px",marginBottom:"20px"}}
            />

            <button
              onClick={changeWalletPin}
              disabled={changeLoading}
              style={{width:"100%",padding:"12px",border:"none",borderRadius:"10px",background:"linear-gradient(135deg,#f97316,#dc2626)",color:"#fff",fontWeight:"700"}}
            >
              {changeLoading ? "Updating..." : "Change PIN"}
            </button>

            <button
              onClick={()=>setShowChangePin(false)}
              style={{marginTop:"10px",width:"100%",background:"none",border:"none",cursor:"pointer"}}
            >
              Cancel
            </button>
          </div>
        </div>

      )}

      
      {showForgotPin && (
        <div style={{position:"fixed",inset:0,background:"rgba(0,0,0,.85)",display:"flex",alignItems:"center",justifyContent:"center",zIndex:9999}}>
          <div style={{background:"var(--bg-card)",border:"1px solid var(--border-color)",borderRadius:"16px",padding:"24px",width:"340px"}}>
            <h3 style={{marginBottom:"10px",color:"var(--text-primary)"}}>
              Reset Wallet PIN
            </h3>

            <p style={{fontSize:"13px",color:"var(--text-muted)",marginBottom:"18px"}}>
              Enter the OTP sent to your phone and choose a new 4-digit PIN.
            </p>

            <div
              style={{
                textAlign:"center",
                marginBottom:"14px",
                color: otpTimer > 0 ? "#16a34a" : "#dc2626",
                fontWeight:"bold"
              }}
            >
              {otpTimer > 0
                ? `OTP expires in ${formatOtpTime()}`
                : "OTP expired. Tap Resend Code."}
            </div>

            <button
              onClick={requestPinReset}
              disabled={otpTimer > 0}
              style={{
                width:"100%",
                padding:"10px",
                marginBottom:"16px",
                borderRadius:"8px",
                border:"none",
                cursor: otpTimer > 0 ? "not-allowed" : "pointer",
                opacity: otpTimer > 0 ? 0.6 : 1
              }}
            >
              Resend Code
            </button>

            <input
              type="text"
              placeholder="SMS OTP"
              value={resetOtp}
              onChange={e=>setResetOtp(e.target.value)}
              style={inp}
            />

            <input
              type="password"
              maxLength={4}
              placeholder="New 4-digit PIN"
              value={resetPin}
              onChange={e=>setResetPin(e.target.value.replace(/\D/g,""))}
              style={{...inp,textAlign:"center",fontSize:"22px",letterSpacing:"8px"}}
            />

            <button
              onClick={resetWalletPin}
              disabled={resetLoading}
              style={{
                width:"100%",
                padding:"12px",
                border:"none",
                borderRadius:"10px",
                background:"linear-gradient(135deg,#16a34a,#15803d)",
                color:"#fff",
                fontWeight:"700",
                marginTop:"10px"
              }}
            >
              {resetLoading ? "Resetting..." : "Reset PIN"}
            </button>

            <button
              onClick={()=>{
                setShowForgotPin(false);
                setResetOtp("");
                setResetPin("");
              }}
              style={{
                width:"100%",
                marginTop:"10px",
                background:"none",
                border:"none",
                cursor:"pointer",
                color:"var(--text-muted)"
              }}
            >
              Cancel
            </button>
          </div>
        </div>
      )}


    </>
  );
}

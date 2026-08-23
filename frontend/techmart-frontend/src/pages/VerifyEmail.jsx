import { useEffect, useState } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import axios from "axios";
const API = import.meta.env.VITE_API_URL || "https://techmart-backend-ecbi.onrender.com";
export default function VerifyEmail() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [status, setStatus] = useState("verifying");
  const [message, setMessage] = useState("");
  useEffect(() => {
    const token = searchParams.get("token");
    if (!token) { setStatus("error"); setMessage("No verification token found."); return; }
    axios.get(`${API}/api/auth/verify-email?token=${token}`)
      .then(res => {
        sessionStorage.setItem("token", res.data.token);
        sessionStorage.setItem("user", JSON.stringify(res.data.user));
        localStorage.setItem("techmart_last_activity", String(Date.now()));
        window.dispatchEvent(new Event("techmart-auth-change"));
        setStatus("success");
        setTimeout(() => navigate("/home"), 2000);
      })
      .catch(err => { setStatus("error"); setMessage(err.response?.data?.error || "Verification failed. The link may have expired."); });
  }, []);
  return (
    <div style={{ minHeight:"100vh",display:"flex",alignItems:"center",justifyContent:"center",background:"var(--bg-primary)",padding:"24px" }}>
      <div style={{ background:"var(--bg-card)",border:"1px solid var(--border-color)",borderRadius:"20px",padding:"40px 32px",maxWidth:"420px",width:"100%",textAlign:"center" }}>
        {status==="verifying" && <><div style={{fontSize:"56px",marginBottom:"16px"}}>⏳</div><h2 style={{color:"var(--text-primary)",fontSize:"20px",fontWeight:"800",marginBottom:"8px"}}>Verifying your email...</h2><p style={{color:"var(--text-muted)",fontSize:"14px"}}>Please wait a moment.</p></>}
        {status==="success" && <><div style={{fontSize:"56px",marginBottom:"16px"}}>🎉</div><h2 style={{color:"#22c55e",fontSize:"22px",fontWeight:"800",marginBottom:"12px"}}>Email Verified!</h2><p style={{color:"var(--text-muted)",fontSize:"15px"}}>Your account is now active. Taking you to your dashboard...</p></>}
        {status==="error" && <><div style={{fontSize:"56px",marginBottom:"16px"}}>❌</div><h2 style={{color:"#ef4444",fontSize:"20px",fontWeight:"800",marginBottom:"12px"}}>Verification Failed</h2><p style={{color:"var(--text-muted)",fontSize:"14px",marginBottom:"28px"}}>{message}</p><button onClick={()=>navigate("/signup")} style={{width:"100%",padding:"12px",background:"linear-gradient(135deg,#f97316,#dc2626)",color:"#fff",border:"none",borderRadius:"10px",fontWeight:"700",fontSize:"15px",cursor:"pointer",marginBottom:"12px"}}>Back to Signup</button><button onClick={()=>navigate("/login")} style={{width:"100%",padding:"12px",background:"none",color:"var(--text-muted)",border:"1px solid var(--border-color)",borderRadius:"10px",fontWeight:"600",fontSize:"14px",cursor:"pointer"}}>Go to Login</button></>}
      </div>
    </div>
  );
}

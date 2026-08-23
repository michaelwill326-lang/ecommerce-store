import { Link, useNavigate } from "react-router-dom";
import { useEffect } from "react";
export default function Landing() {
  const navigate = useNavigate();
  useEffect(() => {
    if (sessionStorage.getItem("token")) navigate("/home", { replace: true });
  }, []);
  return (
    <div style={{ minHeight:"100vh", background:"var(--bg-primary)", overflowX:"hidden" }}>
      <div style={{ position:"relative", overflow:"hidden", background:"linear-gradient(135deg,#0a0a0a 0%,#111827 60%,#0d0f1e 100%)", padding:"64px 24px 80px", textAlign:"center" }}>
        <div style={{ position:"absolute", width:"400px", height:"400px", borderRadius:"50%", background:"rgba(249,115,22,0.08)", filter:"blur(80px)", top:"-100px", left:"-80px", pointerEvents:"none" }} />
        <div style={{ position:"absolute", width:"300px", height:"300px", borderRadius:"50%", background:"rgba(99,102,241,0.08)", filter:"blur(60px)", top:"-60px", right:"-60px", pointerEvents:"none" }} />
        <div style={{ position:"relative", zIndex:1, maxWidth:"720px", margin:"0 auto" }}>
          <div style={{ display:"inline-flex", alignItems:"center", gap:"6px", padding:"6px 14px", borderRadius:"999px", background:"rgba(249,115,22,0.12)", border:"1px solid rgba(249,115,22,0.3)", color:"#f97316", fontSize:"11px", fontWeight:"800", letterSpacing:"0.6px", marginBottom:"24px" }}>🇳🇬 MADE FOR NIGERIA</div>
          <h1 style={{ color:"#fff", fontSize:"clamp(32px,7vw,64px)", fontWeight:"900", lineHeight:1.1, margin:"0 0 20px" }}>Shop Smart.<br /><span style={{ background:"linear-gradient(135deg,#f97316,#dc2626)", WebkitBackgroundClip:"text", WebkitTextFillColor:"transparent" }}>Pay Smarter.</span></h1>
          <p style={{ color:"rgba(255,255,255,0.6)", fontSize:"clamp(14px,2.5vw,18px)", lineHeight:1.7, margin:"0 0 36px", maxWidth:"560px", marginLeft:"auto", marginRight:"auto" }}>Nigeria's next-gen electronics marketplace with a built-in fintech wallet. Shop, send money, pay bills — all in one place.</p>
          <div style={{ display:"flex", gap:"12px", justifyContent:"center", flexWrap:"wrap" }}>
            <Link to="/signup" style={{ display:"inline-flex", alignItems:"center", gap:"8px", padding:"14px 32px", borderRadius:"14px", background:"linear-gradient(135deg,#f97316,#dc2626)", color:"#fff", textDecoration:"none", fontWeight:"800", fontSize:"15px", boxShadow:"0 8px 24px rgba(249,115,22,0.35)" }}>🚀 Get Started Free</Link>
            <Link to="/login" style={{ display:"inline-flex", alignItems:"center", gap:"8px", padding:"14px 32px", borderRadius:"14px", background:"rgba(255,255,255,0.06)", border:"1px solid rgba(255,255,255,0.15)", color:"#fff", textDecoration:"none", fontWeight:"700", fontSize:"15px" }}>Sign In →</Link>
          </div>
        </div>
      </div>
      <div style={{ maxWidth:"1100px", margin:"0 auto", padding:"64px 24px" }}>
        <h2 style={{ color:"var(--text-primary)", fontSize:"clamp(22px,4vw,32px)", fontWeight:"900", textAlign:"center", margin:"0 0 48px" }}>Everything you need. <span style={{ color:"#f97316" }}>In one app.</span></h2>
        <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fit,minmax(260px,1fr))", gap:"20px" }}>
          {[{icon:"📱",title:"Electronics Marketplace",desc:"Shop the best phones, laptops, accessories and gadgets from verified sellers across Nigeria."},{icon:"💳",title:"TechMart Pay Wallet",desc:"Fund your wallet, send money, receive payments and manage your finances without leaving TechMart."},{icon:"📡",title:"Airtime & Data",desc:"Buy airtime and data bundles for all networks instantly — MTN, Airtel, Glo, 9Mobile."},{icon:"🧾",title:"Pay Bills",desc:"Settle electricity, cable TV, internet and other bills directly from your TechMart wallet."},{icon:"🔒",title:"Savings Vault",desc:"Lock funds and earn 5% monthly interest. Your money grows while you shop."},{icon:"🔗",title:"Payment Links",desc:"Create payment links and share them with customers to collect money instantly."}].map(({icon,title,desc})=>(
            <div key={title} style={{ background:"var(--bg-card)", border:"1px solid var(--border-color)", borderRadius:"16px", padding:"24px" }}>
              <div style={{ fontSize:"36px", marginBottom:"12px" }}>{icon}</div>
              <h3 style={{ color:"var(--text-primary)", fontSize:"16px", fontWeight:"800", margin:"0 0 8px" }}>{title}</h3>
              <p style={{ color:"var(--text-muted)", fontSize:"13px", lineHeight:1.6, margin:0 }}>{desc}</p>
            </div>
          ))}
        </div>
      </div>
      <div style={{ maxWidth:"1100px", margin:"0 auto 64px", padding:"0 24px" }}>
        <div style={{ position:"relative", overflow:"hidden", borderRadius:"20px", background:"linear-gradient(135deg,#0d1117,#161b27,#1a1f35)", border:"1px solid rgba(99,102,241,0.3)", padding:"40px 32px" }}>
          <div style={{ position:"relative", zIndex:1, display:"flex", alignItems:"center", justifyContent:"space-between", gap:"24px", flexWrap:"wrap" }}>
            <div style={{ flex:"1 1 300px" }}>
              <div style={{ display:"inline-flex", alignItems:"center", gap:"6px", padding:"5px 12px", borderRadius:"999px", background:"rgba(99,102,241,0.15)", border:"1px solid rgba(99,102,241,0.3)", color:"#818cf8", fontSize:"11px", fontWeight:"800", marginBottom:"16px" }}>💳 TECHMART PAY</div>
              <h3 style={{ color:"#fff", fontSize:"clamp(18px,3vw,26px)", fontWeight:"900", margin:"0 0 10px" }}>Your wallet. Your rules.</h3>
              <p style={{ color:"rgba(255,255,255,0.6)", fontSize:"14px", lineHeight:1.7, margin:"0 0 20px" }}>Send money instantly, save with 5% monthly interest, pay bills and buy airtime — all secured with your personal wallet PIN.</p>
              <div style={{ display:"flex", gap:"8px", flexWrap:"wrap" }}>
                {["💸 Send Money","📱 Airtime","🧾 Bills","🔒 Vault","🔗 Pay Links"].map(f=>(
                  <span key={f} style={{ padding:"5px 12px", borderRadius:"999px", background:"rgba(99,102,241,0.1)", border:"1px solid rgba(99,102,241,0.2)", color:"rgba(255,255,255,0.65)", fontSize:"11px", fontWeight:"600" }}>{f}</span>
                ))}
              </div>
            </div>
            <div style={{ display:"flex", flexDirection:"column", gap:"10px", flexShrink:0 }}>
              <Link to="/signup" style={{ display:"inline-flex", alignItems:"center", justifyContent:"center", padding:"14px 28px", borderRadius:"12px", background:"linear-gradient(135deg,#6366f1,#4f46e5)", color:"#fff", textDecoration:"none", fontWeight:"800", fontSize:"14px", boxShadow:"0 8px 24px rgba(99,102,241,0.4)", whiteSpace:"nowrap" }}>Create Free Account →</Link>
              <Link to="/login" style={{ display:"inline-flex", alignItems:"center", justifyContent:"center", padding:"12px 28px", borderRadius:"12px", background:"rgba(255,255,255,0.05)", border:"1px solid rgba(255,255,255,0.12)", color:"rgba(255,255,255,0.7)", textDecoration:"none", fontWeight:"700", fontSize:"13px", whiteSpace:"nowrap" }}>Already have an account? Sign in</Link>
            </div>
          </div>
        </div>
      </div>
      <div style={{ borderTop:"1px solid var(--border-color)", padding:"32px 24px", textAlign:"center" }}>
        <p style={{ color:"#f97316", fontWeight:"900", fontSize:"20px", margin:"0 0 4px" }}>TechMart</p>
        <p style={{ color:"var(--text-muted)", fontSize:"13px", margin:"0 0 20px" }}>Built with ❤️ in Nigeria 🇳🇬</p>
        <div style={{ display:"flex", gap:"16px", justifyContent:"center", flexWrap:"wrap" }}>
          <Link to="/login" style={{ color:"var(--text-muted)", fontSize:"13px", textDecoration:"none" }}>Sign In</Link>
          <Link to="/signup" style={{ color:"var(--text-muted)", fontSize:"13px", textDecoration:"none" }}>Create Account</Link>
          <Link to="/policy" style={{ color:"var(--text-muted)", fontSize:"13px", textDecoration:"none" }}>Privacy Policy</Link>
        </div>
      </div>
    </div>
  );
}

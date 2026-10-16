import { Link, useNavigate } from "react-router-dom";
import { useEffect } from "react";
export default function Landing() {
  const navigate = useNavigate();
  useEffect(() => {
    if (sessionStorage.getItem("token")) navigate("/home", { replace: true });
  }, []);
  return (
    <div style={{ minHeight:"100vh", background:"var(--bg-primary)", overflowX:"hidden" }}>
      <div style={{ position:"relative", overflow:"hidden", background:"#ffffff", padding:"64px 24px 80px", textAlign:"center" }}>
        <div style={{ position:"absolute", inset:0, opacity:0.03, pointerEvents:"none", backgroundImage:"url(data:image/svg+xml,%3Csvg%20xmlns=%27http://www.w3.org/2000/svg%27%20width=%27160%27%20height=%27160%27%3E%3Cfilter%20id=%27n%27%3E%3CfeTurbulence%20type=%27fractalNoise%27%20baseFrequency=%270.9%27%20numOctaves=%272%27%20stitchTiles=%27stitch%27/%3E%3C/filter%3E%3Crect%20width=%27100%25%27%20height=%27100%25%27%20filter=%27url%28%23n%29%27/%3E%3C/svg%3E)" }} />
        <div style={{ position:"relative", zIndex:1, maxWidth:"720px", margin:"0 auto" }}>
          <div style={{ display:"inline-flex", alignItems:"center", gap:"6px", padding:"6px 14px", borderRadius:"999px", background:"rgba(21,128,61,0.06)", border:"1px solid rgba(21,128,61,0.2)", color:"#15803d", fontSize:"11px", fontWeight:"700", letterSpacing:"0.6px", marginBottom:"24px" }}>🇳🇬 MADE FOR NIGERIA</div>
          <h1 style={{ color:"#171717", fontSize:"clamp(32px,7vw,60px)", fontWeight:"700", lineHeight:1.1, margin:"0 0 20px" }}>Discover your next<br /><span style={{ color:"#15803d", fontFamily:"'Instrument Serif', Georgia, serif", fontStyle:"italic", fontWeight:"400", fontSize:"1.1em" }}>favourite device.</span></h1>
          <p style={{ color:"#52525b", fontSize:"16px", lineHeight:1.6, margin:"0 auto 36px", maxWidth:"560px" }}>Shop phones, laptops and everyday tech from sellers across Nigeria. Find your next device with confidence.</p>
          <div style={{ display:"flex", gap:"12px", justifyContent:"center", flexWrap:"wrap" }}>
            <Link to="/shop" style={{ display:"inline-flex", alignItems:"center", justifyContent:"center", boxSizing:"border-box", width:"220px", maxWidth:"100%", padding:"14px 24px", borderRadius:"14px", background:"#15803d", border:"1px solid #15803d", color:"#fff", textDecoration:"none", fontWeight:"600", fontSize:"15px" }}>Shop phones</Link>
            <Link to="/signup" style={{ display:"inline-flex", alignItems:"center", justifyContent:"center", boxSizing:"border-box", width:"220px", maxWidth:"100%", padding:"14px 24px", borderRadius:"14px", background:"#ffffff", border:"1px solid #d4d4d4", color:"#171717", textDecoration:"none", fontWeight:"600", fontSize:"15px" }}>Create free account</Link>
          </div>
        </div>
      </div>
      <div style={{ maxWidth:"1100px", margin:"0 auto", padding:"64px 24px" }}>
        <h2 style={{ color:"var(--text-primary)", fontSize:"clamp(22px,4vw,32px)", fontWeight:"900", textAlign:"center", margin:"0 0 48px" }}>Technology for everyday life.</h2>
        <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fit,minmax(260px,1fr))", gap:"20px" }}>
          {[{icon:"📱",title:"Phones & Tablets",desc:"Explore smartphones and tablets for different needs and budgets."},{icon:"💻",title:"Laptops & Computers",desc:"Find laptops, desktops and accessories for work, study and play."},{icon:"🎧",title:"Audio & Accessories",desc:"Discover headphones, chargers, power banks and everyday tech essentials."},{icon:"🛡️",title:"Shop With Confidence",desc:"Use available buyer-protection features to support a more confident purchase."},{icon:"🔍",title:"Phone Checker",desc:"Check supported device photos and IMEI details before making a purchase."},{icon:"🏪",title:"Seller Marketplace",desc:"Discover products offered by marketplace sellers across Nigeria."}].map(({icon,title,desc})=>(
            <div key={title} style={{ background:"var(--bg-card)", border:"1px solid var(--border-color)", borderRadius:"16px", padding:"24px" }}>
              <div style={{ fontSize:"36px", marginBottom:"12px" }}>{icon}</div>
              <h3 style={{ color:"var(--text-primary)", fontSize:"16px", fontWeight:"800", margin:"0 0 8px" }}>{title}</h3>
              <p style={{ color:"var(--text-muted)", fontSize:"13px", lineHeight:1.6, margin:0 }}>{desc}</p>
            </div>
          ))}
        </div>
      </div>
      <div style={{ borderTop:"1px solid var(--border-color)", padding:"32px 24px", textAlign:"center" }}>
        <p style={{ color:"#15803d", fontWeight:"900", fontSize:"20px", margin:"0 0 4px" }}>TechMart</p>
        <p style={{ color:"var(--text-muted)", fontSize:"13px", margin:"0 0 20px" }}>Built with ❤️ in Nigeria 🇳🇬</p>
        <div style={{ display:"flex", gap:"16px", justifyContent:"center", flexWrap:"wrap" }}>
          <Link to="/shop" style={{ color:"var(--text-muted)", fontSize:"13px", textDecoration:"none" }}>Shop</Link>
          <Link to="/login" style={{ color:"var(--text-muted)", fontSize:"13px", textDecoration:"none" }}>Sign In</Link>
          <Link to="/signup" style={{ color:"var(--text-muted)", fontSize:"13px", textDecoration:"none" }}>Create Account</Link>
          <Link to="/ai-search" style={{ color:"var(--text-muted)", fontSize:"13px", textDecoration:"none" }}>AI Search</Link>
          <Link to="/phone-checker" style={{ color:"var(--text-muted)", fontSize:"13px", textDecoration:"none" }}>Phone Checker</Link>
          <Link to="/policy" style={{ color:"var(--text-muted)", fontSize:"13px", textDecoration:"none" }}>Privacy Policy</Link>
        </div>
      </div>
    </div>
  );
}

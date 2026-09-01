import { useEffect, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import axios from "axios";

const API = import.meta.env.VITE_API_URL || "https://techmart-backend-ecbi.onrender.com";
const hdr = () => ({ Authorization: `Bearer ${sessionStorage.getItem("token")}` });

export default function PayAccount() {
  const navigate = useNavigate();
  const [bal, setBal] = useState(0);
  const [kyc, setKyc] = useState(null);
  const [va, setVa] = useState(null);
  const [txs, setTxs] = useState([]);
  const [audit, setAudit] = useState([]);
  const [limits, setLimits] = useState(null);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState("overview");
  const [txPage, setTxPage] = useState(1);
  const [txTotal, setTxTotal] = useState(0);
  const [txFilter, setTxFilter] = useState("all");
  const [copied, setCopied] = useState(false);
  const [vaLoading, setVaLoading] = useState(false);
  const [showBal, setShowBal] = useState(false);

  useEffect(() => {
    if (!sessionStorage.getItem("token")) { navigate("/login"); return; }
    Promise.all([
      axios.get(`${API}/api/pay/dashboard`, { headers: hdr() }),
      axios.get(`${API}/api/pay/kyc`,       { headers: hdr() }),
      axios.get(`${API}/api/pay/virtual-account`, { headers: hdr() }),
      axios.get(`${API}/api/pay/limits`,    { headers: hdr() }),
    ]).then(([d, k, v, l]) => {
      setBal(d.data.balance || 0);
      setKyc(k.data);
      setVa(v.data);
      setLimits(l.data);
    }).catch(e => { if (e.response?.status === 401) navigate("/login"); })
    .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    const type = txFilter === "all" ? "" : txFilter;
    axios.get(`${API}/api/pay/ledger?page=${txPage}&limit=20&type=${type}`, { headers: hdr() })
      .then(r => { setTxs(r.data.transactions || []); setTxTotal(r.data.total || 0); }).catch(()=>{});
  }, [txPage, txFilter]);

  const requestVA = async () => {
    setVaLoading(true);
    try { const r = await axios.post(`${API}/api/pay/virtual-account/create`, {}, { headers: hdr() }); setVa(r.data); }
    catch (e) { alert(e.response?.data?.error || "Failed"); }
    finally { setVaLoading(false); }
  };

  const loadAudit = () => axios.get(`${API}/api/pay/audit`, { headers: hdr() }).then(r => setAudit(r.data.log || [])).catch(()=>{});

  if (loading) return <div style={{minHeight:"100vh",display:"flex",alignItems:"center",justifyContent:"center",background:"var(--bg-primary)"}}><p style={{color:"#f97316",fontWeight:"700"}}>Loading...</p></div>;

  const kycTier = kyc?.tier || 0;
  const tierColor = ["#ef4444","#f97316","#6366f1","#22c55e"][kycTier] || "#ef4444";
  const tabs = ["overview","transactions","virtual-account","kyc","limits","audit"];

  return (
    <div style={{minHeight:"100vh",background:"var(--bg-primary)",paddingBottom:"80px"}}>
      <div style={{background:"linear-gradient(135deg,#0d1117,#161b27)",borderBottom:"1px solid rgba(99,102,241,0.25)",padding:"20px 20px 0"}}>
        <div style={{maxWidth:"900px",margin:"0 auto"}}>
          <div style={{display:"flex",alignItems:"center",gap:"12px",marginBottom:"16px"}}>
            <Link to="/pay" style={{color:"#818cf8",textDecoration:"none",fontSize:"13px"}}>← TechMart Pay</Link>
          </div>
          <div style={{background:"linear-gradient(135deg,#f97316,#dc2626)",borderRadius:"16px",padding:"20px 24px",marginBottom:"20px",display:"flex",alignItems:"center",justifyContent:"space-between",flexWrap:"wrap",gap:"12px"}}>
            <div>
              <p style={{color:"rgba(255,255,255,0.8)",fontSize:"12px",margin:"0 0 4px",textTransform:"uppercase",letterSpacing:"1px"}}>Wallet Balance</p>
              <div style={{display:"flex",alignItems:"center",gap:"10px"}}>
                <p style={{color:"#fff",fontSize:"32px",fontWeight:"900",margin:0,letterSpacing:showBal?"normal":"4px"}}>{showBal?`₦${bal.toLocaleString()}`:"₦ ••••••"}</p>
                <button onClick={()=>setShowBal(v=>!v)} style={{background:"none",border:"none",cursor:"pointer",fontSize:"20px"}}>{showBal?"🙈":"👁️"}</button>
              </div>
            </div>
            <div style={{display:"flex",gap:"8px"}}>
              <Link to="/pay" style={{padding:"10px 16px",background:"rgba(255,255,255,0.15)",border:"1px solid rgba(255,255,255,0.3)",borderRadius:"10px",color:"#fff",textDecoration:"none",fontWeight:"700",fontSize:"13px"}}>💸 Send</Link>
              <Link to="/pay" style={{padding:"10px 16px",background:"rgba(255,255,255,0.15)",border:"1px solid rgba(255,255,255,0.3)",borderRadius:"10px",color:"#fff",textDecoration:"none",fontWeight:"700",fontSize:"13px"}}>➕ Add Money</Link>
            </div>
          </div>
          <div style={{display:"flex",gap:"4px",overflowX:"auto"}}>
            {tabs.map(t=>(
              <button key={t} onClick={()=>{setTab(t);if(t==="audit")loadAudit();}} style={{padding:"10px 16px",borderRadius:"10px 10px 0 0",border:"none",background:tab===t?"var(--bg-primary)":"transparent",color:tab===t?"#f97316":"var(--text-muted)",fontWeight:tab===t?"700":"500",fontSize:"13px",cursor:"pointer",whiteSpace:"nowrap",textTransform:"capitalize"}}>{t.replace("-"," ")}</button>
            ))}
          </div>
        </div>
      </div>

      <div style={{maxWidth:"900px",margin:"0 auto",padding:"24px 20px"}}>

        {tab==="overview" && (
          <div>
            <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(160px,1fr))",gap:"14px",marginBottom:"24px"}}>
              {[{label:"Transactions",value:txTotal,icon:"📋",color:"#6366f1"},{label:"KYC Tier",value:kyc?.tierLabel||"None",icon:"🛡️",color:tierColor}].map(s=>(
                <div key={s.label} style={{background:"var(--bg-card)",border:"1px solid var(--border-color)",borderRadius:"14px",padding:"16px"}}>
                  <p style={{color:"var(--text-muted)",fontSize:"12px",margin:"0 0 6px"}}>{s.icon} {s.label}</p>
                  <p style={{color:s.color,fontWeight:"800",fontSize:"20px",margin:0}}>{s.value}</p>
                </div>
              ))}
            </div>
            {kycTier < 3 && (
              <div style={{background:"rgba(99,102,241,0.08)",border:"1px solid rgba(99,102,241,0.25)",borderRadius:"14px",padding:"16px 20px",marginBottom:"20px",display:"flex",alignItems:"center",justifyContent:"space-between",gap:"12px",flexWrap:"wrap"}}>
                <div><p style={{color:"#818cf8",fontWeight:"700",fontSize:"14px",margin:"0 0 4px"}}>🛡️ Increase your limits</p><p style={{color:"var(--text-muted)",fontSize:"13px",margin:0}}>{kyc?.nextStep}</p></div>
                <button onClick={()=>setTab("kyc")} style={{padding:"10px 18px",background:"linear-gradient(135deg,#6366f1,#4f46e5)",color:"#fff",border:"none",borderRadius:"10px",fontWeight:"700",fontSize:"13px",cursor:"pointer"}}>Verify Now</button>
              </div>
            )}
            <h3 style={{color:"var(--text-primary)",fontSize:"16px",fontWeight:"800",margin:"0 0 14px"}}>Recent Transactions</h3>
            {txs.slice(0,5).map((tx,i)=><TxRow key={i} tx={tx}/>)}
            <button onClick={()=>setTab("transactions")} style={{width:"100%",padding:"12px",marginTop:"12px",background:"none",border:"1px solid var(--border-color)",borderRadius:"10px",color:"var(--text-muted)",cursor:"pointer",fontSize:"13px"}}>View All →</button>
          </div>
        )}

        {tab==="transactions" && (
          <div>
            <div style={{display:"flex",gap:"8px",marginBottom:"16px",flexWrap:"wrap"}}>
              {["all","credit","debit"].map(f=>(
                <button key={f} onClick={()=>{setTxFilter(f);setTxPage(1);}} style={{padding:"8px 16px",borderRadius:"999px",border:"1px solid var(--border-color)",background:txFilter===f?"#f97316":"transparent",color:txFilter===f?"#fff":"var(--text-muted)",cursor:"pointer",fontWeight:"600",fontSize:"13px",textTransform:"capitalize"}}>{f==="all"?"All":f==="credit"?"Money In":"Money Out"}</button>
              ))}
              <span style={{marginLeft:"auto",color:"var(--text-muted)",fontSize:"13px",alignSelf:"center"}}>{txTotal} total</span>
            </div>
            {txs.length===0&&<p style={{color:"var(--text-muted)",textAlign:"center",padding:"40px 0"}}>No transactions yet</p>}
            {txs.map((tx,i)=><TxRow key={i} tx={tx}/>)}
            <div style={{display:"flex",justifyContent:"center",gap:"8px",marginTop:"20px"}}>
              <button disabled={txPage===1} onClick={()=>setTxPage(p=>p-1)} style={{padding:"8px 16px",borderRadius:"8px",border:"1px solid var(--border-color)",background:"transparent",color:txPage===1?"#333":"var(--text-primary)",cursor:txPage===1?"not-allowed":"pointer"}}>← Prev</button>
              <span style={{padding:"8px 16px",color:"var(--text-muted)",fontSize:"13px"}}>Page {txPage}</span>
              <button disabled={txs.length<20} onClick={()=>setTxPage(p=>p+1)} style={{padding:"8px 16px",borderRadius:"8px",border:"1px solid var(--border-color)",background:"transparent",color:txs.length<20?"#333":"var(--text-primary)",cursor:txs.length<20?"not-allowed":"pointer"}}>Next →</button>
            </div>
          </div>
        )}

        {tab==="virtual-account" && (
          <div>
            {va?.comingSoon ? (
              <div style={{background:"linear-gradient(135deg,#0d1117,#161b27)",border:"1px solid rgba(99,102,241,0.3)",borderRadius:"20px",padding:"40px 28px",textAlign:"center"}}>
                <div style={{fontSize:"56px",marginBottom:"16px"}}>🏦</div>
                <h2 style={{color:"#fff",fontSize:"22px",fontWeight:"900",margin:"0 0 12px"}}>Virtual Account Coming Soon</h2>
                <p style={{color:"rgba(255,255,255,0.6)",fontSize:"14px",lineHeight:1.7,margin:"0 0 24px",maxWidth:"440px",marginLeft:"auto",marginRight:"auto"}}>Once enabled, you'll receive a dedicated Nigerian bank account number. Send money to it from any bank and it reflects instantly in your TechMart wallet.</p>
                <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(150px,1fr))",gap:"10px",maxWidth:"480px",margin:"0 auto 24px"}}>
                  {["🏦 Dedicated account","⚡ Instant credit","🔒 Secured","✅ All banks"].map(f=>(
                    <div key={f} style={{background:"rgba(99,102,241,0.08)",border:"1px solid rgba(99,102,241,0.2)",borderRadius:"10px",padding:"12px",color:"rgba(255,255,255,0.7)",fontSize:"12px",fontWeight:"600"}}>{f}</div>
                  ))}
                </div>
                <div style={{background:"rgba(249,115,22,0.08)",border:"1px solid rgba(249,115,22,0.2)",borderRadius:"12px",padding:"14px 20px",color:"#fb923c",fontSize:"13px",fontWeight:"600"}}>🚀 Pending CAC registration & provider approval</div>
              </div>
            ) : va?.account ? (
              <div>
                <div style={{background:"linear-gradient(135deg,#0d1117,#161b27)",border:"1px solid rgba(99,102,241,0.35)",borderRadius:"20px",padding:"32px",textAlign:"center",marginBottom:"16px"}}>
                  <p style={{color:"#818cf8",fontSize:"11px",fontWeight:"800",letterSpacing:"1px",margin:"0 0 10px",textTransform:"uppercase"}}>Your TechMart Pay Account</p>
                  <p style={{color:"rgba(255,255,255,0.6)",fontSize:"13px",margin:"0 0 4px"}}>Bank: <strong style={{color:"#fff"}}>{va.account.bankName}</strong></p>
                  <p style={{color:"rgba(255,255,255,0.6)",fontSize:"13px",margin:"0 0 16px"}}>Name: <strong style={{color:"#fff"}}>{va.account.accountName||va.account.name}</strong></p>
                  <p style={{color:"#fff",fontSize:"36px",fontWeight:"900",letterSpacing:"4px",margin:"0 0 20px",fontFamily:"monospace"}}>{va.account.accountNumber}</p>
                  <button onClick={()=>{navigator.clipboard?.writeText(va.account.accountNumber);setCopied(true);setTimeout(()=>setCopied(false),2000);}} style={{padding:"12px 28px",background:copied?"#22c55e":"linear-gradient(135deg,#6366f1,#4f46e5)",color:"#fff",border:"none",borderRadius:"12px",fontWeight:"700",fontSize:"14px",cursor:"pointer"}}>{copied?"✅ Copied!":"📋 Copy Number"}</button>
                </div>
              </div>
            ) : (
              <div style={{textAlign:"center",padding:"40px 20px"}}>
                <button onClick={requestVA} disabled={vaLoading} style={{padding:"14px 32px",background:"linear-gradient(135deg,#6366f1,#4f46e5)",color:"#fff",border:"none",borderRadius:"12px",fontWeight:"700",fontSize:"15px",cursor:"pointer"}}>{vaLoading?"Creating...":"Get My Virtual Account"}</button>
              </div>
            )}
          </div>
        )}

        {tab==="kyc" && (
          <div>
            <div style={{background:"var(--bg-card)",border:`2px solid ${tierColor}`,borderRadius:"16px",padding:"24px",marginBottom:"20px",textAlign:"center"}}>
              <p style={{fontSize:"48px",margin:"0 0 8px"}}>🛡️</p>
              <p style={{color:tierColor,fontWeight:"800",fontSize:"18px",margin:"0 0 4px"}}>{kyc?.tierLabel||"Tier 0"}</p>
              <p style={{color:"var(--text-muted)",fontSize:"13px",margin:"0 0 16px"}}>{kyc?.nextStep}</p>
              <div style={{display:"flex",justifyContent:"center",gap:"8px"}}>{[0,1,2,3].map(t=><div key={t} style={{width:"40px",height:"6px",borderRadius:"3px",background:t<=kycTier?tierColor:"#333"}}/>)}</div>
            </div>
            <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(180px,1fr))",gap:"12px"}}>
              {[{label:"Phone Verified",done:kycTier>=1},{label:"BVN Verified",done:kyc?.bvnVerified},{label:"NIN Verified",done:kyc?.ninVerified}].map(k=>(
                <div key={k.label} style={{background:"var(--bg-card)",border:`1px solid ${k.done?"#22c55e":"var(--border-color)"}`,borderRadius:"12px",padding:"16px",display:"flex",alignItems:"center",gap:"12px"}}>
                  <span style={{fontSize:"24px"}}>{k.done?"✅":"⭕"}</span>
                  <p style={{color:"var(--text-primary)",fontWeight:"700",fontSize:"14px",margin:0}}>{k.label}</p>
                </div>
              ))}
            </div>
            <div style={{marginTop:"20px"}}><Link to="/pay" style={{display:"inline-flex",padding:"12px 24px",background:"linear-gradient(135deg,#f97316,#dc2626)",color:"#fff",textDecoration:"none",borderRadius:"12px",fontWeight:"700",fontSize:"14px"}}>Complete Verification →</Link></div>
          </div>
        )}

        {tab==="limits" && limits && (
          <div style={{background:"var(--bg-card)",border:"1px solid var(--border-color)",borderRadius:"16px",padding:"24px"}}>
            <h3 style={{color:"var(--text-primary)",fontSize:"16px",fontWeight:"800",margin:"0 0 16px"}}>Your Daily Limits</h3>
            {[{label:"Daily Deposit",limit:limits.limits?.dailyDeposit,used:limits.usage?.deposited},{label:"Daily Withdrawal",limit:limits.limits?.dailyWithdrawal,used:limits.usage?.withdrawn},{label:"Daily Transfer",limit:limits.limits?.dailyTransfer,used:limits.usage?.transferred},{label:"Single Transaction",limit:limits.limits?.singleTx,used:null}].map(l=>{
              const pct=l.used!==null?Math.min(100,((l.used||0)/(l.limit||1))*100):0;
              return(
                <div key={l.label} style={{marginBottom:"16px"}}>
                  <div style={{display:"flex",justifyContent:"space-between",marginBottom:"6px"}}>
                    <span style={{color:"var(--text-muted)",fontSize:"13px"}}>{l.label}</span>
                    <span style={{color:"var(--text-primary)",fontSize:"13px",fontWeight:"700"}}>{l.used!==null?`₦${(l.used||0).toLocaleString()} / `:""}₦{(l.limit||0).toLocaleString()}</span>
                  </div>
                  {l.used!==null&&<div style={{height:"6px",background:"#1a1a1a",borderRadius:"3px"}}><div style={{height:"100%",width:`${pct}%`,background:pct>=80?"#ef4444":pct>=60?"#f97316":"#6366f1",borderRadius:"3px",transition:"width 0.3s"}}/></div>}
                </div>
              );
            })}
          </div>
        )}

        {tab==="audit" && (
          <div>
            <h3 style={{color:"var(--text-primary)",fontSize:"16px",fontWeight:"800",margin:"0 0 16px"}}>Security & Audit Log</h3>
            {audit.length===0&&<p style={{color:"var(--text-muted)",textAlign:"center",padding:"40px 0"}}>No audit entries yet</p>}
            {audit.map((a,i)=>(
              <div key={i} style={{background:"var(--bg-card)",border:"1px solid var(--border-color)",borderRadius:"10px",padding:"12px 16px",marginBottom:"8px",display:"flex",justifyContent:"space-between",alignItems:"center",gap:"12px"}}>
                <div><p style={{color:"var(--text-primary)",fontWeight:"700",fontSize:"13px",margin:"0 0 2px",textTransform:"capitalize"}}>{a.action?.replace(/_/g," ")}</p><p style={{color:"var(--text-muted)",fontSize:"11px",margin:0}}>IP: {a.ip||"—"}</p></div>
                <p style={{color:"var(--text-muted)",fontSize:"11px",margin:0,whiteSpace:"nowrap"}}>{new Date(a.createdAt).toLocaleString("en-NG",{timeZone:"Africa/Lagos",dateStyle:"medium",timeStyle:"short"})}</p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function TxRow({tx}){
  const isCredit=tx.type==="credit";
  const date=new Date(tx.createdAt).toLocaleString("en-NG",{timeZone:"Africa/Lagos",dateStyle:"medium",timeStyle:"short"});
  return(
    <div style={{background:"var(--bg-card)",border:"1px solid var(--border-color)",borderRadius:"10px",padding:"12px 16px",marginBottom:"8px",display:"flex",justifyContent:"space-between",alignItems:"center",gap:"12px"}}>
      <div style={{display:"flex",alignItems:"center",gap:"12px"}}>
        <div style={{width:"36px",height:"36px",borderRadius:"50%",background:isCredit?"rgba(34,197,94,0.12)":"rgba(239,68,68,0.12)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:"16px",flexShrink:0}}>{isCredit?"⬇️":"⬆️"}</div>
        <div><p style={{color:"var(--text-primary)",fontWeight:"600",fontSize:"13px",margin:"0 0 2px"}}>{tx.description||(isCredit?"Credit":"Debit")}</p><p style={{color:"var(--text-muted)",fontSize:"11px",margin:0}}>{date}{tx.reference?` · ${tx.reference}`:""}</p></div>
      </div>
      <p style={{color:isCredit?"#22c55e":"#ef4444",fontWeight:"800",fontSize:"15px",margin:0,whiteSpace:"nowrap"}}>{isCredit?"+":"-"}₦{(tx.amount||0).toLocaleString()}</p>
    </div>
  );
}

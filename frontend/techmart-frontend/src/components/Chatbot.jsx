import { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
const API = "https://techmart-backend-ecbi.onrender.com";

export default function Chatbot() {
  const navigate = useNavigate();
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([
    { text: "Hi! I am your TechMart AI Assistant. I can help you shop, track orders, manage your wallet, and more. Try saying:\n\n• \"Find me a gaming laptop under ₦800,000\"\n• \"Show my wallet balance\"\n• \"Track my last order\"\n• \"Apply the best coupon\"", sender: "bot" }
  ]);
  const [input, setInput] = useState("");
  const [typing, setTyping] = useState(false);
  const [userName, setUserName] = useState("Guest");
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);
  const [listening, setListening] = useState(false);
  const [pendingAction, setPendingAction] = useState(null);
  const messagesEndRef = useRef(null);
  const recognitionRef = useRef(null);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth <= 768);
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  useEffect(() => {
    const syncUser = () => {
      const user = JSON.parse(localStorage.getItem("user"));
      setUserName(user?.name?.split(" ")[0] || "Guest");
    };
    syncUser();
    window.addEventListener("storage", syncUser);
    return () => window.removeEventListener("storage", syncUser);
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, typing]);

  const addMessage = (text, sender, data = null) => {
    setMessages(prev => [...prev, { text, sender, data }]);
  };

  const startVoice = () => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) { addMessage("Voice input not supported in this browser.", "bot"); return; }
    const recognition = new SpeechRecognition();
    recognition.lang = "en-NG";
    recognition.interimResults = false;
    recognition.onstart = () => setListening(true);
    recognition.onend = () => setListening(false);
    recognition.onresult = (e) => {
      const transcript = e.results[0][0].transcript;
      setInput(transcript);
      setTimeout(() => sendMessage(transcript), 300);
    };
    recognition.onerror = () => setListening(false);
    recognitionRef.current = recognition;
    recognition.start();
  };

  const sendMessage = async (overrideMsg) => {
    const token = localStorage.getItem("token");
    const message = (overrideMsg || input).trim();
    if (!message) return;
    addMessage(message, "user");
    setInput("");
    setTyping(true);

    try {
      if (!token) {
        setTyping(false);
        addMessage("Please log in to use the AI Assistant.", "bot");
        return;
      }

      const response = await fetch(`${API}/api/ai/assistant`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ message, history: messages.slice(-6) })
      });
      const data = await response.json();
      setTyping(false);

      if (data.action) setPendingAction({ action: data.action, data: data.data });
      addMessage(data.message || "Sorry, I could not process that.", "bot", data.data);

      // Auto-navigate
      if (data.data?.type === "navigate") {
        setTimeout(() => navigate(data.data.path), 1500);
      }
    } catch {
      setTyping(false);
      addMessage("Connection error. Please try again.", "bot");
    }
  };

  const executeAction = async (action, actionData) => {
    const token = localStorage.getItem("token");
    if (action === "confirm_transfer") {
      try {
        const res = await fetch(`${API}/api/pay/send`, {
          method: "POST",
          headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
          body: JSON.stringify({ recipientEmail: actionData.recipientEmail, amount: actionData.amount, note: actionData.note })
        });
        const data = await res.json();
        addMessage(data.success ? `Transfer successful! ${data.message}` : `Transfer failed: ${data.error}`, "bot");
      } catch { addMessage("Transfer failed. Please try again.", "bot"); }
      setPendingAction(null);
    }
    if (action === "apply_coupon") {
      navigator.clipboard?.writeText(actionData.code);
      addMessage(`Coupon code **${actionData.code}** copied to clipboard! Apply it at checkout.`, "bot");
      setPendingAction(null);
    }
    if (action === "start_return") {
      navigate(`/tracking`);
      addMessage("Taking you to your orders to start the return.", "bot");
      setPendingAction(null);
    }
  };

  const renderMessageContent = (msg) => {
    const text = msg.text?.replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>").replace(/\n/g, "<br/>");
    return (
      <div>
        <span dangerouslySetInnerHTML={{ __html: text }} />
        {msg.data?.type === "products" && msg.data.items?.length > 0 && (
          <div style={{ marginTop: "8px", display: "flex", flexDirection: "column", gap: "6px" }}>
            {msg.data.items.map(p => (
              <div key={p._id} onClick={() => navigate(`/product/${p._id}`)}
                style={{ display: "flex", alignItems: "center", gap: "8px", background: "#1a1a1a", border: "1px solid #333", borderRadius: "8px", padding: "8px", cursor: "pointer" }}>
                {p.image && <img src={p.image} alt={p.name} style={{ width: "40px", height: "40px", borderRadius: "6px", objectFit: "cover" }} />}
                <div>
                  <p style={{ color: "#fff", fontSize: "12px", fontWeight: "600", margin: 0 }}>{p.name}</p>
                  <p style={{ color: "#f97316", fontSize: "12px", fontWeight: "700", margin: 0 }}>₦{p.price?.toLocaleString()}</p>
                </div>
              </div>
            ))}
          </div>
        )}
        {msg.data?.type === "orders" && msg.data.items?.length > 0 && (
          <div style={{ marginTop: "8px", display: "flex", flexDirection: "column", gap: "6px" }}>
            {msg.data.items.map(o => (
              <div key={o._id} onClick={() => navigate("/tracking")}
                style={{ background: "#1a1a1a", border: "1px solid #333", borderRadius: "8px", padding: "8px", cursor: "pointer" }}>
                <p style={{ color: "#fff", fontSize: "12px", fontWeight: "600", margin: "0 0 2px" }}>Order #{o.trackingNumber || o._id?.slice(-6)}</p>
                <p style={{ color: "#888", fontSize: "11px", margin: 0 }}>₦{o.amount?.toLocaleString()} • <span style={{ color: o.status === "Delivered" ? "#22c55e" : o.status === "Cancelled" ? "#dc2626" : "#f97316" }}>{o.status}</span></p>
              </div>
            ))}
          </div>
        )}
        {msg.data?.type === "balance" && (
          <div style={{ marginTop: "8px", background: "#1a1a1a", border: "1px solid #22c55e", borderRadius: "8px", padding: "10px", textAlign: "center" }}>
            <p style={{ color: "#888", fontSize: "11px", margin: "0 0 2px" }}>Wallet Balance</p>
            <p style={{ color: "#22c55e", fontSize: "20px", fontWeight: "900", margin: 0 }}>₦{msg.data.balance?.toLocaleString()}</p>
          </div>
        )}
        {msg.data?.type === "coupon" && (
          <div style={{ marginTop: "8px", background: "#1a0a00", border: "1px solid #f97316", borderRadius: "8px", padding: "10px", textAlign: "center", cursor: "pointer" }}
            onClick={() => executeAction("apply_coupon", msg.data)}>
            <p style={{ color: "#f97316", fontSize: "16px", fontWeight: "900", margin: "0 0 2px", letterSpacing: "2px" }}>{msg.data.code}</p>
            <p style={{ color: "#888", fontSize: "11px", margin: 0 }}>Tap to copy</p>
          </div>
        )}
        {pendingAction?.action === "confirm_transfer" && msg.data?.type === "confirm_transfer" && (
          <div style={{ marginTop: "8px", display: "flex", gap: "6px" }}>
            <button onClick={() => executeAction("confirm_transfer", pendingAction.data)}
              style={{ flex: 1, padding: "8px", background: "linear-gradient(135deg, #f97316, #dc2626)", color: "#fff", border: "none", borderRadius: "8px", cursor: "pointer", fontWeight: "700", fontSize: "12px" }}>
              Confirm Transfer
            </button>
            <button onClick={() => { setPendingAction(null); addMessage("Transfer cancelled.", "bot"); }}
              style={{ flex: 1, padding: "8px", background: "#222", color: "#888", border: "1px solid #333", borderRadius: "8px", cursor: "pointer", fontSize: "12px" }}>
              Cancel
            </button>
          </div>
        )}
      </div>
    );
  };

  const handleOpen = () => {
    if (isMobile) { navigate("/chat"); return; }
    setIsOpen(true);
  };

  return (
    <>
      <style>{`@keyframes bounce{0%,100%{transform:translateY(0)}50%{transform:translateY(-4px)}} @keyframes pulse{0%,100%{opacity:1}50%{opacity:0.5}}`}</style>
      <button onClick={() => isOpen ? setIsOpen(false) : handleOpen()}
        style={{ position:"fixed", bottom:"24px", right:"80px", width:"52px", height:"52px", borderRadius:"50%", background:"linear-gradient(135deg,#f97316,#dc2626)", border:"none", fontSize:"22px", cursor:"pointer", boxShadow:"0 4px 20px rgba(249,115,22,0.5)", zIndex:9998, display:"flex", alignItems:"center", justifyContent:"center" }}>
        🤖
      </button>
      {!isMobile && isOpen && (
        <div style={{ position:"fixed", bottom:"90px", right:"80px", width:"360px", height:"520px", background:"#0a0a0a", border:"1px solid #222", borderRadius:"16px", display:"flex", flexDirection:"column", zIndex:9999, boxShadow:"0 20px 60px rgba(0,0,0,0.8)", overflow:"hidden" }}>
          {/* HEADER */}
          <div style={{ padding:"14px 16px", background:"linear-gradient(135deg,#f97316,#dc2626)", display:"flex", alignItems:"center", justifyContent:"space-between" }}>
            <div style={{ display:"flex", alignItems:"center", gap:"8px" }}>
              <span style={{ fontSize:"20px" }}>🤖</span>
              <div>
                <p style={{ color:"#fff", fontWeight:"800", fontSize:"14px", margin:0 }}>TechMart AI</p>
                <p style={{ color:"rgba(255,255,255,0.8)", fontSize:"11px", margin:0 }}>Platform Assistant • {userName}</p>
              </div>
            </div>
            <button onClick={() => setIsOpen(false)} style={{ background:"none", border:"none", color:"#fff", fontSize:"18px", cursor:"pointer" }}>✕</button>
          </div>
          {/* MESSAGES */}
          <div style={{ flex:1, overflowY:"auto", padding:"12px", display:"flex", flexDirection:"column", gap:"8px" }}>
            {messages.map((msg, i) => (
              <div key={i} style={{ display:"flex", justifyContent: msg.sender === "user" ? "flex-end" : "flex-start" }}>
                <div style={{ maxWidth:"85%", padding:"10px 12px", borderRadius: msg.sender === "user" ? "12px 12px 0 12px" : "12px 12px 12px 0", background: msg.sender === "user" ? "linear-gradient(135deg,#f97316,#dc2626)" : "#1a1a1a", border: msg.sender === "bot" ? "1px solid #222" : "none", color:"#fff", fontSize:"13px", lineHeight:"1.5" }}>
                  {renderMessageContent(msg)}
                </div>
              </div>
            ))}
            {typing && (
              <div style={{ display:"flex", justifyContent:"flex-start" }}>
                <div style={{ background:"#1a1a1a", border:"1px solid #222", borderRadius:"12px", padding:"10px 14px", display:"flex", gap:"4px", alignItems:"center" }}>
                  {[0,1,2].map(i => <div key={i} style={{ width:"6px", height:"6px", borderRadius:"50%", background:"#f97316", animation:`bounce 0.8s ease-in-out ${i*0.2}s infinite` }} />)}
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>
          {/* QUICK ACTIONS */}
          <div style={{ padding:"8px 12px", borderTop:"1px solid #1a1a1a", display:"flex", gap:"6px", overflowX:"auto" }}>
            {["💰 Balance", "📦 Orders", "🔍 Search", "🎟 Coupon"].map((q, i) => (
              <button key={i} onClick={() => sendMessage(["Show my wallet balance", "Track my last order", "Find me a product", "Apply the best coupon"][i])}
                style={{ whiteSpace:"nowrap", padding:"5px 10px", background:"#1a1a1a", border:"1px solid #333", borderRadius:"20px", color:"#888", fontSize:"11px", cursor:"pointer", flexShrink:0 }}>
                {q}
              </button>
            ))}
          </div>
          {/* INPUT */}
          <div style={{ padding:"12px", borderTop:"1px solid #1a1a1a", display:"flex", gap:"8px", alignItems:"center" }}>
            <button onClick={startVoice} style={{ width:"36px", height:"36px", borderRadius:"50%", background: listening ? "#dc2626" : "#1a1a1a", border:"1px solid #333", color: listening ? "#fff" : "#888", cursor:"pointer", fontSize:"16px", flexShrink:0, animation: listening ? "pulse 1s infinite" : "none" }}>
              🎤
            </button>
            <input value={input} onChange={e => setInput(e.target.value)}
              onKeyDown={e => e.key === "Enter" && sendMessage()}
              placeholder="Ask me anything..."
              style={{ flex:1, background:"#111", border:"1px solid #333", borderRadius:"10px", padding:"8px 12px", color:"#fff", fontSize:"13px", outline:"none" }} />
            <button onClick={() => sendMessage()} style={{ width:"36px", height:"36px", borderRadius:"50%", background:"linear-gradient(135deg,#f97316,#dc2626)", border:"none", color:"#fff", cursor:"pointer", fontSize:"16px", flexShrink:0 }}>
              ➤
            </button>
          </div>
        </div>
      )}
    </>
  );
}

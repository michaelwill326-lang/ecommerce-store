import { useState, useRef, useEffect } from "react";

const API = "https://techmart-backend-ecbi.onrender.com";

export default function Chatbot() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([
    { text: "Hello! I am your TechMart AI assistant. How can I help you?", sender: "bot" },
  ]);
  const [input, setInput] = useState("");
  const [typing, setTyping] = useState(false);
  const [userEmail, setUserEmail] = useState("Guest");
  const [userName, setUserName] = useState("Guest");
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);
  const messagesEndRef = useRef(null);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth <= 768);
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  useEffect(() => {
    const syncUser = () => {
      const user = JSON.parse(localStorage.getItem("user"));
      setUserEmail(user?.email || "Guest");
      setUserName(user?.name?.split(" ")[0] || "Guest");
    };
    syncUser();
    window.addEventListener("storage", syncUser);
    window.addEventListener("focus", syncUser);
    return () => {
      window.removeEventListener("storage", syncUser);
      window.removeEventListener("focus", syncUser);
    };
  }, []);

  useEffect(() => {
    if (isOpen) {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages, typing, isOpen]);

  // Prevent body scroll when chat is open on mobile
  useEffect(() => {
    if (isMobile && isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => { document.body.style.overflow = ""; };
  }, [isMobile, isOpen]);

  const handleOpen = () => {
    const user = JSON.parse(localStorage.getItem("user"));
    setUserEmail(user?.email || "Guest");
    setIsOpen(true);
  };

  const addMessage = (text, sender) => {
    setMessages((prev) => [...prev, { text, sender }]);
  };

  const sendMessage = async () => {
    const message = input.trim();
    if (!message) return;
    addMessage(message, "user");
    setInput("");
    setTyping(true);
    try {
      const response = await fetch(`${API}/api/ai/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message, userEmail, userName }),
      });
      const data = await response.json();
      setTyping(false);
      addMessage(data.reply || "No response", "bot");
      if (data.products && data.products.length > 0) {
        data.products.forEach((p) => {
          addMessage(`<b>${p.name}</b> - N${p.price?.toLocaleString()}`, "bot");
        });
      }
    } catch (err) {
      setTyping(false);
      addMessage("Sorry, connection error. Please try again.", "bot");
    }
  };

  return (
    <>
      <style>{`
        @keyframes bounce {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-4px); }
        }
        .techmart-chat-container {
          position: fixed;
          bottom: 90px;
          right: 24px;
          width: 340px;
          height: 480px;
          background: #111;
          border-radius: 16px;
          border: 1px solid #222;
          display: flex;
          flex-direction: column;
          box-shadow: 0 8px 40px rgba(0,0,0,0.6);
          z-index: 10000;
          overflow: hidden;
        }
        @media (max-width: 768px) {
          .techmart-chat-container {
            position: fixed !important;
            top: 0 !important;
            left: 0 !important;
            right: 0 !important;
            bottom: 0 !important;
            width: 100vw !important;
            height: 100vh !important;
            height: -webkit-fill-available !important;
            border-radius: 0 !important;
            border: none !important;
            display: flex !important;
            flex-direction: column !important;
          }
          .techmart-chat-header {
            padding-top: max(16px, env(safe-area-inset-top)) !important;
            flex-shrink: 0 !important;
          }
          .techmart-chat-messages {
            -webkit-overflow-scrolling: touch !important;
            flex: 1 !important;
            overflow-y: auto !important;
          }
          .techmart-chat-input {
            flex-shrink: 0 !important;
            padding-bottom: max(12px, env(safe-area-inset-bottom)) !important;
          }
        }
      `}</style>

      {/* FLOATING TOGGLE BUTTON */}
      <button
        onClick={() => isOpen ? setIsOpen(false) : handleOpen()}
        style={{
          position: "fixed",
          bottom: "24px",
          right: "80px",
          width: "52px",
          height: "52px",
          borderRadius: "50%",
          background: "linear-gradient(135deg, #f97316, #dc2626)",
          border: "none",
          fontSize: "22px",
          cursor: "pointer",
          boxShadow: "0 4px 20px rgba(249,115,22,0.5)",
          zIndex: 9998,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        &#x1F916;
      </button>

      {/* CHAT WINDOW */}
      {isOpen && (
        <div className="techmart-chat-container">

          {/* HEADER */}
          <div className="techmart-chat-header" style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            padding: "16px",
            background: "linear-gradient(135deg, #f97316, #dc2626)",
            color: "#fff",
            flexShrink: 0,
          }}>
            <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
              <span style={{ fontSize: "24px" }}>&#x1F916;</span>
              <div>
                <p style={{ margin: 0, fontWeight: "700", fontSize: "16px" }}>TechMart AI</p>
                <p style={{ margin: 0, fontSize: "12px", color: "#86efac" }}>Online</p>
              </div>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              style={{
                background: "rgba(255,255,255,0.2)",
                border: "none",
                color: "#fff",
                fontSize: "18px",
                cursor: "pointer",
                width: "36px",
                height: "36px",
                borderRadius: "50%",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                flexShrink: 0,
              }}
            >x</button>
          </div>

          {/* MESSAGES */}
          <div
            className="techmart-chat-messages"
            style={{
              flex: 1,
              overflowY: "auto",
              padding: "16px",
              display: "flex",
              flexDirection: "column",
              gap: "12px",
            }}
          >
            {messages.map((msg, i) => (
              <div
                key={i}
                style={msg.sender === "user" ? {
                  alignSelf: "flex-end",
                  background: "linear-gradient(135deg, #f97316, #dc2626)",
                  color: "#fff",
                  padding: "10px 14px",
                  borderRadius: "16px 16px 4px 16px",
                  fontSize: "14px",
                  maxWidth: "85%",
                  lineHeight: "1.5",
                  wordBreak: "break-word",
                } : {
                  alignSelf: "flex-start",
                  background: "#1e1e1e",
                  color: "#fff",
                  padding: "10px 14px",
                  borderRadius: "16px 16px 16px 4px",
                  fontSize: "14px",
                  maxWidth: "85%",
                  lineHeight: "1.5",
                  wordBreak: "break-word",
                }}
                dangerouslySetInnerHTML={{ __html: msg.text }}
              />
            ))}
            {typing && (
              <div style={{
                alignSelf: "flex-start",
                background: "#1e1e1e",
                padding: "12px 16px",
                borderRadius: "16px 16px 16px 4px",
                display: "flex",
                gap: "6px",
                alignItems: "center",
              }}>
                {[0,1,2].map(i => (
                  <span key={i} style={{
                    width: "8px", height: "8px",
                    background: "#f97316",
                    borderRadius: "50%",
                    display: "inline-block",
                    animation: `bounce 1s infinite ${i * 0.2}s`,
                  }} />
                ))}
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* INPUT AREA */}
          <div className="techmart-chat-input" style={{
            display: "flex",
            gap: "8px",
            padding: "12px 16px",
            borderTop: "1px solid #222",
            background: "#0a0a0a",
            flexShrink: 0,
          }}>
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyPress={(e) => e.key === "Enter" && sendMessage()}
              placeholder="Ask me anything..."
              style={{
                flex: 1,
                padding: "12px 16px",
                borderRadius: "999px",
                border: "1px solid #333",
                background: "#1a1a1a",
                color: "#fff",
                fontSize: "14px",
                outline: "none",
                minWidth: 0,
              }}
            />
            <button
              onClick={sendMessage}
              style={{
                padding: "12px 18px",
                borderRadius: "999px",
                background: "linear-gradient(135deg, #f97316, #dc2626)",
                color: "#fff",
                border: "none",
                cursor: "pointer",
                fontWeight: "700",
                fontSize: "14px",
                flexShrink: 0,
              }}
            >Send</button>
          </div>
        </div>
      )}
    </>
  );
}

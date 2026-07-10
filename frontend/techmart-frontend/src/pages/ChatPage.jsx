import { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";

const API = "https://techmart-backend-ecbi.onrender.com";

export default function ChatPage() {
  const navigate = useNavigate();
  const [messages, setMessages] = useState([
    { text: "Hello! I am your TechMart AI assistant. How can I help you?", sender: "bot" },
  ]);
  const [input, setInput] = useState("");
  const [typing, setTyping] = useState(false);
  const [userEmail, setUserEmail] = useState("Guest");
  const [userName, setUserName] = useState("Guest");
  const messagesEndRef = useRef(null);

  useEffect(() => {
    const user = JSON.parse(localStorage.getItem("user"));
    setUserEmail(user?.email || "Guest");
    setUserName(user?.name?.split(" ")[0] || "Guest");
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, typing]);

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
      const token = localStorage.getItem("token");
      const response = await fetch(`${API}/api/ai/assistant`, {
        method: "POST",
        headers: { "Content-Type": "application/json", ...(token ? { Authorization: `Bearer ${token}` } : {}) },
        body: JSON.stringify({ message, history: messages.slice(-6) }),
      });
      const data = await response.json();
      setTyping(false);
      addMessage(data.message || data.reply || "No response", "bot");
      if (data.data?.type === "products" && data.data.items?.length > 0) {
        data.data.items.forEach((p) => {
          addMessage(`<b>${p.name}</b> - ₦${p.price?.toLocaleString()}`, "bot");
        });
      }
      if (data.data?.type === "balance") {
        addMessage(`💰 Wallet Balance: ₦${data.data.balance?.toLocaleString()}`, "bot");
      }
    } catch (err) {
      setTyping(false);
      addMessage("Sorry, connection error. Please try again.", "bot");
    }
  };

  return (
    <div style={{
      display: "flex",
      flexDirection: "column",
      height: "100dvh",
      background: "var(--bg-secondary)",
      overflow: "hidden",
    }}>
      {/* HEADER */}
      <div style={{
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        padding: "16px",
        background: "linear-gradient(135deg, #f97316, #dc2626)",
        color: "var(--text-primary)",
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
          onClick={() => navigate(-1)}
          style={{
            background: "rgba(255,255,255,0.2)",
            border: "none",
            color: "var(--text-primary)",
            fontSize: "14px",
            fontWeight: "700",
            cursor: "pointer",
            padding: "8px 14px",
            borderRadius: "20px",
          }}
        >Back</button>
      </div>

      {/* MESSAGES */}
      <div style={{
        flex: 1,
        overflowY: "auto",
        padding: "16px",
        display: "flex",
        flexDirection: "column",
        gap: "12px",
        WebkitOverflowScrolling: "touch",
      }}>
        {messages.map((msg, i) => (
          <div
            key={i}
            style={msg.sender === "user" ? {
              alignSelf: "flex-end",
              background: "linear-gradient(135deg, #f97316, #dc2626)",
              color: "var(--text-primary)",
              padding: "10px 14px",
              borderRadius: "16px 16px 4px 16px",
              fontSize: "15px",
              maxWidth: "85%",
              lineHeight: "1.5",
              wordBreak: "break-word",
            } : {
              alignSelf: "flex-start",
              background: "#1e1e1e",
              color: "var(--text-primary)",
              padding: "10px 14px",
              borderRadius: "16px 16px 16px 4px",
              fontSize: "15px",
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

      {/* INPUT */}
      <div style={{
        display: "flex",
        gap: "8px",
        padding: "12px 16px",
        borderTop: "1px solid var(--border-light)",
        background: "var(--bg-primary)",
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
            border: "1px solid var(--border-color)",
            background: "var(--bg-card)",
            color: "var(--text-primary)",
            fontSize: "15px",
            outline: "none",
            minWidth: 0,
          }}
        />
        <button
          onClick={sendMessage}
          style={{
            padding: "12px 20px",
            borderRadius: "999px",
            background: "linear-gradient(135deg, #f97316, #dc2626)",
            color: "var(--text-primary)",
            border: "none",
            cursor: "pointer",
            fontWeight: "700",
            fontSize: "15px",
            flexShrink: 0,
          }}
        >Send</button>
      </div>
    </div>
  );
}

import { useState, useRef, useEffect } from "react";

const API = "https://techmart-backend-ecbi.onrender.com";

export default function Chatbot() {
  const isMobile = window.innerWidth <= 768;
  const [isOpen, setIsOpen] = useState(false);
  const handleOpen = () => {
    const user = JSON.parse(localStorage.getItem("user"));
    setUserEmail(user?.email || "Guest");
    setIsOpen(true);
  };
  const [messages, setMessages] = useState([
    { text: "👋 Hello! I'm your AI shopping assistant.", sender: "bot" },
  ]);
  const [input, setInput] = useState("");
  const [typing, setTyping] = useState(false);
  const [userEmail, setUserEmail] = useState("Guest");
  const [userName, setUserName] = useState("Guest");
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
  const messagesEndRef = useRef(null);

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
          addMessage(
            `🛍 <b>${p.name}</b><br/>💵 ₦${p.price?.toLocaleString()}<br/>📦 Stock: ${p.stock}`,
            "bot"
          );
        });
      }
    } catch (err) {
      setTyping(false);
      addMessage("⚠️ AI server error.", "bot");
      console.error(err);
    }
  };

  return (
    <>
      {/* FLOATING BUTTON */}
      <button
        onClick={() => isOpen ? setIsOpen(false) : handleOpen()}
        style={styles.toggleBtn}
      >
        🤖
      </button>

      {/* CHAT WINDOW */}
      {isOpen && (
        <div style={styles.container}>

          {/* HEADER */}
          <div style={styles.header}>
            <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
              <span style={{ fontSize: "22px" }}>🤖</span>
              <div>
                <p style={{ margin: 0, fontWeight: "700", fontSize: "15px" }}>TechMart AI</p>
                <p style={{ margin: 0, fontSize: "11px", color: "#86efac" }}>● Online</p>
              </div>
            </div>
            <button onClick={() => setIsOpen(false)} style={styles.closeBtn}>✖</button>
          </div>

          {/* MESSAGES */}
          <div style={styles.messages}>
            {messages.map((msg, i) => (
              <div
                key={i}
                style={msg.sender === "user" ? styles.userMsg : styles.botMsg}
                dangerouslySetInnerHTML={{ __html: msg.text }}
              />
            ))}

            {/* TYPING INDICATOR */}
            {typing && (
              <div style={styles.botMsg}>
                <span style={styles.typingDot} />
                <span style={styles.typingDot} />
                <span style={styles.typingDot} />
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* INPUT AREA */}
          <div style={styles.inputArea}>
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyPress={(e) => e.key === "Enter" && sendMessage()}
              placeholder="Ask me anything..."
              style={styles.input}
            />
            <button onClick={sendMessage} style={styles.sendBtn}>
              Send ➤
            </button>
          </div>

        </div>
      )}
    </>
  );
}

const styles = {
  toggleBtn: {
    position: "fixed",
    bottom: "24px",
    right: "80px",
    zIndex: 9999,
    width: "56px",
    height: "56px",
    borderRadius: "50%",
    background: "linear-gradient(135deg, #f97316, #dc2626)",
    border: "none",
    fontSize: "24px",
    cursor: "pointer",
    boxShadow: "0 4px 20px rgba(249,115,22,0.5)",
    zIndex: 9999,
    transition: "transform 0.2s",
  },
  container: {
    position: "fixed",
    bottom: window.innerWidth <= 768 ? "0" : "90px",
    right: window.innerWidth <= 768 ? "0" : "24px",
    left: window.innerWidth <= 768 ? "0" : "auto",
    width: window.innerWidth <= 768 ? "100%" : "340px",
    height: window.innerWidth <= 768 ? "75vh" : "480px",
    background: "#111",
    borderRadius: window.innerWidth <= 768 ? "16px 16px 0 0" : "16px",
    border: "1px solid #222",
    display: "flex",
    flexDirection: "column",
    boxShadow: "0 8px 40px rgba(0,0,0,0.6)",
    zIndex: 10000,
    overflow: "hidden",
  },
  header: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    padding: "14px 16px",
    background: "linear-gradient(135deg, #f97316, #dc2626)",
    color: "#fff",
  },
  closeBtn: {
    background: "transparent",
    border: "none",
    color: "#fff",
    fontSize: "16px",
    cursor: "pointer",
  },
  messages: {
    flex: 1,
    overflowY: "auto",
    padding: "16px",
    display: "flex",
    flexDirection: "column",
    gap: "10px",
  },
  botMsg: {
    alignSelf: "flex-start",
    background: "#1e1e1e",
    color: "#fff",
    padding: "10px 14px",
    borderRadius: "16px 16px 16px 4px",
    fontSize: "13px",
    maxWidth: "80%",
    lineHeight: "1.5",
    display: "flex",
    gap: "4px",
    alignItems: "center",
  },
  userMsg: {
    alignSelf: "flex-end",
    background: "linear-gradient(135deg, #f97316, #dc2626)",
    color: "#fff",
    padding: "10px 14px",
    borderRadius: "16px 16px 4px 16px",
    fontSize: "13px",
    maxWidth: "80%",
    lineHeight: "1.5",
  },
  typingDot: {
    width: "8px",
    height: "8px",
    background: "#f97316",
    borderRadius: "50%",
    display: "inline-block",
    animation: "bounce 1s infinite",
  },
  inputArea: {
    display: "flex",
    gap: "8px",
    padding: "12px",
    borderTop: "1px solid #222",
    background: "#0a0a0a",
  },
  input: {
    flex: 1,
    padding: "10px 14px",
    borderRadius: "999px",
    border: "1px solid #333",
    background: "#1a1a1a",
    color: "#fff",
    fontSize: "13px",
    outline: "none",
  },
  sendBtn: {
    padding: "10px 16px",
    borderRadius: "999px",
    background: "linear-gradient(135deg, #f97316, #dc2626)",
    color: "#fff",
    border: "none",
    cursor: "pointer",
    fontWeight: "700",
    fontSize: "13px",
  },
};
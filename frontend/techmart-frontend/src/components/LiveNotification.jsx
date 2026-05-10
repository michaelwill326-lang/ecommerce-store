// src/components/LiveNotification.jsx
import { useEffect, useState } from "react";
import { socket } from "../socket"; // ✅ named import

export default function LiveNotification() {
  const [message, setMessage] = useState("");

  useEffect(() => {
    // Listen for real-time order updates from backend
    socket.on("orderUpdated", (order) => {
      setMessage(`Order ${order.reference} updated to ${order.status}`);

      // Auto-hide notification after 5 seconds
      setTimeout(() => {
        setMessage("");
      }, 5000);
    });

    // Cleanup listener on unmount
    return () => socket.off("orderUpdated");
  }, []);

  // Render nothing if no message
  if (!message) return null;

  return (
    <div
      className="live-notification"
      style={{
        position: "fixed",
        top: "20px",
        right: "20px",
        background: "black",
        color: "white",
        padding: "15px 20px",
        borderRadius: "10px",
        zIndex: 9999,
        boxShadow: "0 4px 12px rgba(0,0,0,0.3)",
      }}
    >
      {message}
    </div>
  );
}
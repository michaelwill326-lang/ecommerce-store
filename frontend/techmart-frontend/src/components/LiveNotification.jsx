// src/components/LiveNotification.jsx
import { useEffect, useState } from "react";
import { socket } from "../socket";

export default function LiveNotification() {
  const [notifications, setNotifications] = useState([]);

  useEffect(() => {
    // Connect to Socket.IO
    socket.on("connect", () => {
      console.log("⚡ Connected to backend via Socket.IO:", socket.id);
    });

    // Listen for order updates from backend
    socket.on("orderUpdated", (order) => {
      setNotifications((prev) => [
        ...prev,
        `Order ${order.reference} updated: ${order.status}`,
      ]);

      // Remove notification after 5 seconds
      setTimeout(() => {
        setNotifications((prev) =>
          prev.filter((n) => n !== `Order ${order.reference} updated: ${order.status}`)
        );
      }, 5000);
    });

    // Disconnect cleanup
    return () => {
      socket.off("connect");
      socket.off("orderUpdated");
    };
  }, []);

  if (!notifications.length) return null;

  return (
    <div
      style={{
        position: "fixed",
        top: 20,
        right: 20,
        zIndex: 9999,
        display: "flex",
        flexDirection: "column",
        gap: "0.5rem",
      }}
    >
      {notifications.map((note, idx) => (
        <div
          key={idx}
          style={{
            background: "#2563EB",
            color: "#fff",
            padding: "10px 15px",
            borderRadius: "8px",
            boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
            fontSize: "0.9rem",
            minWidth: "200px",
          }}
        >
          {note}
        </div>
      ))}
    </div>
  );
}
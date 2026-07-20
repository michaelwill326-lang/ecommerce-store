import { useEffect, useState } from "react";
import { socket } from "../socket";

export default function LiveNotification() {
  const [notifications, setNotifications] = useState([]);

  useEffect(() => {
    const handleOrderUpdate = (order) => {
      const label = order.reference || order.orderId || "";
      const text = `Order ${label} updated: ${order.status}`;
      setNotifications((prev) => [...prev, { id: Date.now(), text }]);
      setTimeout(() => {
        setNotifications((prev) => prev.filter((n) => n.text !== text));
      }, 5000);
    };

    socket.on("orderUpdated", handleOrderUpdate);
    socket.on("paymentConfirmed", (data) => {
      handleOrderUpdate({ reference: data.reference, status: "Payment confirmed" });
    });

    return () => {
      socket.off("orderUpdated", handleOrderUpdate);
      socket.off("paymentConfirmed");
    };
  }, []);

  if (!notifications.length) return null;

  return (
    <div style={{ position: "fixed", top: 20, right: 20, zIndex: 9999, display: "flex", flexDirection: "column", gap: "0.5rem" }}>
      {notifications.map((note) => (
        <div key={note.id} style={{ background: "#2563EB", color: "#fff", padding: "10px 15px", borderRadius: "8px", boxShadow: "0 4px 12px rgba(0,0,0,0.3)", fontSize: "0.9rem", minWidth: "200px" }}>
          {note.text}
        </div>
      ))}
    </div>
  );
}

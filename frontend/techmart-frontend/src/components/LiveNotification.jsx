import { useEffect, useState } from "react";
import { socket } from "../socket";

export default function LiveNotification() {
  const [notifications, setNotifications] = useState([]);

  useEffect(() => {
    socket.on("orderUpdated", (order) => {
      setNotifications((prev) => [
        { id: order._id, msg: `Order ${order.reference} updated to ${order.status}` },
        ...prev
      ]);
    });

    return () => {
      socket.off("orderUpdated");
    };
  }, []);

  return (
    <div className="live-notifications" style={{ position: "fixed", top: 10, right: 10 }}>
      {notifications.map((n) => (
        <div key={n.id} className="notification">
          {n.msg}
        </div>
      ))}
    </div>
  );
}
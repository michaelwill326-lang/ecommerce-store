import { useEffect, useState } from "react";
import socket from "../socket";

export default function LiveNotification() {
  const [message, setMessage] = useState("");

  useEffect(() => {
    socket.on("orderUpdated", (order) => {
      setMessage(
        `Order ${order.reference} updated to ${order.status}`
      );

      setTimeout(() => {
        setMessage("");
      }, 5000);
    });

    return () => socket.off("orderUpdated");
  }, []);

  if (!message) return null;

  return (
    <div className="live-notification">
      {message}
    </div>
  );
}
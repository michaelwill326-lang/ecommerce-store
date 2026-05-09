import { useEffect, useState } from "react";
import { socket } from "../socket";

export default function Tracking() {
  const [status, setStatus] = useState("Pending");
  const [tracking, setTracking] = useState("");

  useEffect(() => {
    socket.on("orderUpdated", (data) => {
      setStatus(data.status);
      setTracking(data.trackingNumber);
    });

    return () => {
      socket.off("orderUpdated");
    };
  }, []);

  const steps = ["Pending", "Processing", "Shipped", "Delivered"];

  return (
    <div className="tracking">

      <h2>📦 Order Tracking</h2>

      {/* TIMELINE */}
      <div className="timeline">
        {steps.map((step, i) => (
          <div
            key={i}
            className={`step ${steps.indexOf(status) >= i ? "active" : ""}`}
          >
            {step}
          </div>
        ))}
      </div>

      {/* TRACKING NUMBER */}
      <p>Tracking #: {tracking || "Not assigned yet"}</p>

    </div>
  );
}
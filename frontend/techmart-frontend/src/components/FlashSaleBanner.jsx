import { useState, useEffect } from "react";
import { Link } from "react-router-dom";

const API = import.meta.env.VITE_API_URL || "https://techmart-backend-ecbi.onrender.com";

function Countdown({ endTime }) {
  const [timeLeft, setTimeLeft] = useState({});
  useEffect(() => {
    const calc = () => {
      const diff = new Date(endTime) - new Date();
      if (diff <= 0) return setTimeLeft({ expired: true });
      setTimeLeft({
        hours: Math.floor(diff / 3600000),
        minutes: Math.floor((diff % 3600000) / 60000),
        seconds: Math.floor((diff % 60000) / 1000),
      });
    };
    calc();
    const timer = setInterval(calc, 1000);
    return () => clearInterval(timer);
  }, [endTime]);

  if (timeLeft.expired) return <span style={{ color: "#f87171" }}>Expired</span>;
  const pad = n => String(n).padStart(2, "0");
  return (
    <div style={{ display: "flex", gap: "6px", alignItems: "center" }}>
      {[{ label: "HRS", value: timeLeft.hours }, { label: "MIN", value: timeLeft.minutes }, { label: "SEC", value: timeLeft.seconds }].map((unit, i) => (
        <div key={i} style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
          <div style={{ background: "rgba(0,0,0,0.3)", borderRadius: "6px", padding: "4px 8px", minWidth: "36px", textAlign: "center" }}>
            <span style={{ color: "var(--text-primary)", fontWeight: "800", fontSize: "18px" }}>{pad(unit.value)}</span>
          </div>
          <span style={{ color: "rgba(255,255,255,0.7)", fontSize: "9px", marginTop: "2px" }}>{unit.label}</span>
        </div>
      ))}
    </div>
  );
}

export default function FlashSaleBanner() {
  const [sales, setSales] = useState([]);
  const [current, setCurrent] = useState(0);

  useEffect(() => {
    fetch(`${API}/api/flash-sales`)
      .then(res => res.json())
      .then(data => setSales(Array.isArray(data) ? data : []))
      .catch(() => {});
  }, []);

  useEffect(() => {
    if (sales.length <= 1) return;
    const timer = setInterval(() => setCurrent(c => (c + 1) % sales.length), 5000);
    return () => clearInterval(timer);
  }, [sales]);

  if (!sales.length) return null;

  const sale = sales[current];
  const discount = Math.round(((sale.originalPrice - sale.salePrice) / sale.originalPrice) * 100);

  return (
    <div style={{ background: "linear-gradient(135deg, #dc2626, #f97316)", borderRadius: "12px", padding: "16px", marginBottom: "20px", display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: "12px", position: "relative" }}>
      <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
        <span style={{ fontSize: "28px" }}>⚡</span>
        <div>
          <p style={{ color: "var(--text-primary)", fontWeight: "900", fontSize: "12px", margin: "0 0 2px", textTransform: "uppercase", letterSpacing: "1px" }}>Flash Sale</p>
          <p style={{ color: "var(--text-primary)", fontWeight: "700", fontSize: "15px", margin: "0 0 4px" }}>{sale.productName}</p>
          <div style={{ display: "flex", alignItems: "center", gap: "8px", flexWrap: "wrap" }}>
            <span style={{ color: "rgba(255,255,255,0.6)", fontSize: "13px", textDecoration: "line-through" }}>N{sale.originalPrice?.toLocaleString()}</span>
            <span style={{ color: "var(--text-primary)", fontWeight: "900", fontSize: "18px" }}>N{sale.salePrice?.toLocaleString()}</span>
            <span style={{ background: "rgba(0,0,0,0.3)", color: "var(--text-primary)", fontSize: "11px", fontWeight: "700", padding: "2px 8px", borderRadius: "999px" }}>{discount}% OFF</span>
          </div>
        </div>
      </div>
      <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: "8px" }}>
        <p style={{ color: "rgba(255,255,255,0.8)", fontSize: "11px", margin: 0 }}>ENDS IN</p>
        <Countdown endTime={sale.endTime} />
        {sale.productId && (
          <Link to={`/product/${typeof sale.productId === "object" ? sale.productId._id : sale.productId}`} style={{ background: "#fff", color: "#dc2626", fontWeight: "800", fontSize: "13px", padding: "6px 16px", borderRadius: "999px", textDecoration: "none" }}>
            Buy Now
          </Link>
        )}
      </div>
    </div>
  );
}

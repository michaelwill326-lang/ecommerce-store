import { useEffect, useState } from "react";
import axios from "axios";

const API = import.meta.env.VITE_API_URL;

export default function Dashboard() {
  const [orders, setOrders] = useState([]);

  useEffect(() => {
    const token = localStorage.getItem("token");

    axios.get(`${API}/api/orders/me`, {
      headers: {
        Authorization: `Bearer ${token}`
      }
    })
    .then((res) => {
      setOrders(res.data);
    });
  }, []);

  return (
    <div className="container">
      <h1>My Orders</h1>

      {orders.map((order) => (
        <div key={order._id} className="product-card">
          <h3>{order.reference}</h3>
          <p>Status: {order.status}</p>
          <p>Total: ₦{order.amount}</p>
        </div>
      ))}
    </div>
  );
}
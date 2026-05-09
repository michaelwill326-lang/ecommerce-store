import { useEffect, useState } from "react";
import axios from "axios";
import RevenueChart from "../components/RevenueChart";

const API = import.meta.env.VITE_API_URL;

export default function Admin() {
  const [analytics, setAnalytics] = useState(null);

  useEffect(() => {
    const token = localStorage.getItem("token");

    axios.get(`${API}/api/admin/analytics`, {
      headers: {
        Authorization: `Bearer ${token}`
      }
    })
    .then((res) => {
      setAnalytics(res.data);
    });
  }, []);

  if (!analytics) return <h2>Loading...</h2>;

  return (
    <div className="container">
      <h1>Admin Dashboard</h1>

      <div className="stats">
        <div className="card">
          <h2>Revenue</h2>
          <p>₦{analytics.totalRevenue}</p>
        </div>

        <div className="card">
          <h2>Orders</h2>
          <p>{analytics.totalOrders}</p>
        </div>

        <div className="card">
          <h2>Users</h2>
          <p>{analytics.totalUsers}</p>
        </div>
      </div>

      <RevenueChart data={analytics.revenueByDate} />
    </div>
  );
}
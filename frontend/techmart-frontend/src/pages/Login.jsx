import { useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";

const API = "https://techmart-backend-ecbi.onrender.com";

export default function Login() {
  const navigate = useNavigate();
  const [form, setForm] = useState({ email: "", password: "" });
  const [error, setError] = useState("");

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const res = await axios.post(`${API}/api/auth/login`, form);
      localStorage.setItem("token", res.data.token);
      navigate("/");
    } catch (err) {
      setError(err.response?.data?.error || "Login failed");
    }
  };

  return (
    <div style={{ padding: "30px" }}>
      <h1>Login</h1>
      {error && <p style={{ color: "red" }}>{error}</p>}
      <form onSubmit={handleSubmit}>
        <input name="email" placeholder="Email" value={form.email} onChange={handleChange} type="email" required style={{ display:"block", marginBottom:"10px", padding:"8px" }} />
        <input name="password" placeholder="Password" value={form.password} onChange={handleChange} type="password" required style={{ display:"block", marginBottom:"10px", padding:"8px" }} />
        <button type="submit" style={{ padding:"10px 20px", background:"black", color:"white", border:"none", borderRadius:"5px" }}>Login</button>
      </form>
    </div>
  );
}
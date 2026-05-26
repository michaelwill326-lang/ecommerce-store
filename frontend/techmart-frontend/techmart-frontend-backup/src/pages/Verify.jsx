import { useState } from "react";

const API = import.meta.env.VITE_API_URL;

export default function Verify() {
  const [form, setForm] = useState({
    email:"",
    otp:"",
    password:""
  });

  const verify = async () => {
    const res = await fetch(`${API}/api/auth/verify-otp`, {
      method:"POST",
      headers:{"Content-Type":"application/json"},
      body: JSON.stringify(form)
    });

    const data = await res.json();

    if (data.token) {
      localStorage.setItem("token", data.token);
      alert("Account created!");
    }
  };

  return (
    <div>
      <input placeholder="Email"
        onChange={e=>setForm({...form,email:e.target.value})}/>
      <input placeholder="OTP"
        onChange={e=>setForm({...form,otp:e.target.value})}/>
      <input type="password" placeholder="Password"
        onChange={e=>setForm({...form,password:e.target.value})}/>

      <button onClick={verify}>Verify</button>
    </div>
  );
}
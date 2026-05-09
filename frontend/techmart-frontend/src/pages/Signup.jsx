import { useState } from "react";

const API = import.meta.env.VITE_API_URL;

export default function Signup() {
  const [email, setEmail] = useState("");

  const sendOTP = async () => {
    await fetch(`${API}/api/auth/send-otp`, {
      method: "POST",
      headers: {"Content-Type":"application/json"},
      body: JSON.stringify({ email })
    });

    alert("OTP sent");
  };

  return (
    <div>
      <h2>Signup</h2>
      <input onChange={e=>setEmail(e.target.value)} placeholder="Email"/>
      <button onClick={sendOTP}>Send OTP</button>
    </div>
  );
}
import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import axios from "axios";

const API =
  "https://techmart-backend-ecbi.onrender.com";

export default function Login() {

  const navigate = useNavigate();

  const [email, setEmail] =
    useState("");

  const [password, setPassword] =
    useState("");

  const [loading, setLoading] =
    useState(false);

  const handleLogin = async (e) => {

    e.preventDefault();

    try {

      setLoading(true);

      const response = await axios.post(
        `${API}/api/auth/login`,
        {
          email,
          password,
        }
      );

      localStorage.setItem(
        "token",
        response.data.token
      );

      localStorage.setItem(
        "user",
        JSON.stringify(response.data.user)
      );

      alert("✅ Login successful");

      navigate("/");

    } catch (err) {

      console.error(err);

      alert(
        "❌ Invalid email or password"
      );

    } finally {

      setLoading(false);

    }
  };

  return (
    <div
      style={{
        maxWidth: "400px",
        margin: "60px auto",
        padding: "30px",
        border: "1px solid #ddd",
        borderRadius: "10px",
      }}
    >

      <h1
        style={{
          marginBottom: "20px",
        }}
      >
        Login
      </h1>

      <form onSubmit={handleLogin}>

        <input
          type="email"
          placeholder="Email"
          value={email}
          onChange={(e) =>
            setEmail(e.target.value)
          }
          required
          style={{
            width: "100%",
            padding: "12px",
            marginBottom: "15px",
          }}
        />

        <input
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) =>
            setPassword(e.target.value)
          }
          required
          style={{
            width: "100%",
            padding: "12px",
            marginBottom: "15px",
          }}
        />

        <button
          type="submit"
          disabled={loading}
          style={{
            width: "100%",
            padding: "12px",
            background: "green",
            color: "white",
            border: "none",
            borderRadius: "8px",
            cursor: "pointer",
          }}
        >
          {loading
            ? "Logging in..."
            : "Login"}
        </button>

      </form>

      <p
        style={{
          marginTop: "20px",
        }}
      >
        Don’t have an account?{" "}
        <Link to="/signup">
          Signup
        </Link>
      </p>

    </div>
  );
}
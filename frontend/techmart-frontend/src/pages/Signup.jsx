import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import axios from "axios";

const API =
  "https://techmart-backend-ecbi.onrender.com";

export default function Signup() {

  const navigate = useNavigate();

  const [name, setName] =
    useState("");

  const [email, setEmail] =
    useState("");

  const [password, setPassword] =
    useState("");

  const [loading, setLoading] =
    useState(false);

  const handleSignup = async (e) => {

    e.preventDefault();

    try {

      setLoading(true);

      await axios.post(
        `${API}/api/auth/signup`,
        {
          name,
          email,
          password,
        }
      );

      alert(
        "✅ Account created successfully"
      );

      navigate("/login");

    } catch (err) {

      console.error(err);

      alert("❌ Signup failed");

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
        Signup
      </h1>

      <form onSubmit={handleSignup}>

        <input
          type="text"
          placeholder="Name"
          value={name}
          onChange={(e) =>
            setName(e.target.value)
          }
          required
          style={{
            width: "100%",
            padding: "12px",
            marginBottom: "15px",
          }}
        />

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
            background: "black",
            color: "white",
            border: "none",
            borderRadius: "8px",
            cursor: "pointer",
          }}
        >
          {loading
            ? "Creating..."
            : "Create Account"}
        </button>

      </form>

      <p
        style={{
          marginTop: "20px",
        }}
      >
        Already have an account?{" "}
        <Link to="/login">
          Login
        </Link>
      </p>

    </div>
  );
}
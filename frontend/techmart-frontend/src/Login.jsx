import { useState } from "react";
import axios from "axios";

const API = "https://techmart-backend-ecbi.onrender.com";

export default function Login() {

  const [isSignup, setIsSignup] =
    useState(false);

  const [name, setName] = useState("");
  const [email, setEmail] =
    useState("");
  const [password, setPassword] =
    useState("");

  const submit = async () => {

    try {

      const endpoint = isSignup
        ? "/api/auth/signup"
        : "/api/auth/login";

      const body = isSignup
        ? { name, email, password }
        : { email, password };

      const res = await axios.post(
        `${API}${endpoint}`,
        body
      );

      localStorage.setItem(
        "token",
        res.data.token
      );

      localStorage.setItem(
        "user",
        JSON.stringify(res.data.user)
      );

      alert(
        isSignup
          ? "Account created"
          : "Login successful"
      );

      window.location.href = "/checkout";

    } catch (err) {
      console.error(err);

      alert(
        err.response?.data?.error ||
        "Authentication failed"
      );
    }
  };

  return (
    <div style={{ padding: "30px" }}>

      <h1>
        {isSignup
          ? "Create Account"
          : "Login"}
      </h1>

      {isSignup && (
        <input
          type="text"
          placeholder="Name"
          value={name}
          onChange={(e) =>
            setName(e.target.value)
          }
          style={{
            display: "block",
            marginBottom: "15px",
            padding: "12px",
            width: "300px",
          }}
        />
      )}

      <input
        type="email"
        placeholder="Email"
        value={email}
        onChange={(e) =>
          setEmail(e.target.value)
        }
        style={{
          display: "block",
          marginBottom: "15px",
          padding: "12px",
          width: "300px",
        }}
      />

      <input
        type="password"
        placeholder="Password"
        value={password}
        onChange={(e) =>
          setPassword(e.target.value)
        }
        style={{
          display: "block",
          marginBottom: "15px",
          padding: "12px",
          width: "300px",
        }}
      />

      <button
        onClick={submit}
        style={{
          padding: "12px 20px",
          background: "black",
          color: "white",
          border: "none",
          borderRadius: "8px",
          cursor: "pointer",
        }}
      >
        {isSignup
          ? "Create Account"
          : "Login"}
      </button>

      <p
        onClick={() =>
          setIsSignup(!isSignup)
        }
        style={{
          marginTop: "20px",
          cursor: "pointer",
          color: "blue",
        }}
      >
        {isSignup
          ? "Already have an account? Login"
          : "No account? Create one"}
      </p>

    </div>
  );
}
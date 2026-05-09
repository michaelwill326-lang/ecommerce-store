import { useEffect, useState } from "react";
import { Navigate } from "react-router-dom";

export default function RequireAdmin({ children }) {
  const [isValid, setIsValid] = useState(null);

  useEffect(() => {
    const token = localStorage.getItem("adminToken");

    if (!token) {
      setIsValid(false);
      return;
    }

    // 🧠 OPTIONAL: basic token expiry check (JWT decode light check)
    try {
      const payload = JSON.parse(atob(token.split(".")[1]));

      if (payload.exp * 1000 < Date.now()) {
        localStorage.removeItem("adminToken");
        setIsValid(false);
      } else {
        setIsValid(true);
      }

    } catch (err) {
      localStorage.removeItem("adminToken");
      setIsValid(false);
    }
  }, []);

  if (isValid === null) {
    return <div>Loading...</div>;
  }

  if (!isValid) {
    return <Navigate to="/admin-login" />;
  }

  return children;
}
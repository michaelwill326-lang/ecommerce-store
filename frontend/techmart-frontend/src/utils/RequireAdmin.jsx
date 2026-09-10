import { Navigate } from "react-router-dom";

export default function RequireAdmin({ children }) {
  const token = sessionStorage.getItem("token");
  const user = (() => {
    try { return JSON.parse(sessionStorage.getItem("user")); }
    catch { return null; }
  })();

  if (!token || !user) {
    return <Navigate to="/login?redirect=/admin" replace />;
  }

  if (user.role !== "admin") {
    return <Navigate to="/" replace />;
  }

  return children;
}

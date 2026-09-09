import { Navigate, useLocation } from "react-router-dom";

export default function RequireSeller({ children }) {
  const location = useLocation();
  const token = sessionStorage.getItem("sellerToken");

  if (!token) {
    const redirect = `${location.pathname}${location.search}${location.hash}`;
    return <Navigate to={`/seller/login?redirect=${encodeURIComponent(redirect)}`} replace />;
  }

  return children;
}

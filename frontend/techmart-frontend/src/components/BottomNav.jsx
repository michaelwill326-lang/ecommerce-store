import { Link, useLocation } from "react-router-dom";
import { useContext } from "react";
import { CartContext } from "../context/CartContext";

export default function BottomNav() {
  const location = useLocation();
  const { cart } = useContext(CartContext);

  const cartCount = cart.reduce(
    (total, item) => total + (item.quantity || 1),
    0
  );

  const user = (() => {
    try {
      return JSON.parse(localStorage.getItem("user"));
    } catch {
      return null;
    }
  })();

  const hidden = [
    "/seller/dashboard",
    "/seller/login",
    "/seller/apply",
    "/admin",
  ].some((path) => location.pathname.startsWith(path));

  if (hidden) return null;

  const tabs = [
    { to: "/", icon: "🏠", label: "Home" },
    { to: "/ai-search", icon: "🔍", label: "Search" },
    { to: "/cart", icon: "🛒", label: "Cart", badge: cartCount },
    { to: "/pay", icon: "💳", label: "Pay" },
    {
      to: user ? "/account" : "/login",
      icon: "👤",
      label: user ? "Account" : "Login",
    },
  ];

  const isActive = (to) => {
    if (to === "/") {
      return location.pathname === "/";
    }

    return location.pathname.startsWith(to);
  };

  return (
    <>
      <style>{`
        .techmart-bottom-nav {
          display: flex;
        }

        .techmart-bottom-spacer {
          display: block;
        }

        @media (min-width: 769px) {
          .techmart-bottom-nav {
            display: none !important;
          }

          .techmart-bottom-spacer {
            display: none !important;
          }
        }
      `}</style>

      <div
        className="techmart-bottom-spacer"
        style={{ height: "64px" }}
      />

      <nav
        className="techmart-bottom-nav"
        style={{
          position: "fixed",
          bottom: 0,
          left: 0,
          right: 0,
          zIndex: 9999,
          background: "var(--bg-card)",
          borderTop: "1px solid var(--border-color)",
          justifyContent: "space-around",
          alignItems: "center",
          padding: "6px 0 8px",
          boxShadow: "0 -4px 20px rgba(0,0,0,0.3)",
        }}
      >
        {tabs.map((tab, index) => {
          const active = isActive(tab.to);

          return (
            <Link
              key={index}
              to={tab.to}
              style={{
                textDecoration: "none",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                gap: "2px",
                position: "relative",
                minWidth: "56px",
              }}
            >
              <div style={{ position: "relative" }}>
                <span
                  style={{
                    fontSize: "22px",
                    lineHeight: 1,
                  }}
                >
                  {tab.icon}
                </span>

                {tab.badge > 0 && (
                  <span
                    style={{
                      position: "absolute",
                      top: "-4px",
                      right: "-6px",
                      background: "#dc2626",
                      color: "#fff",
                      fontSize: "9px",
                      fontWeight: "800",
                      borderRadius: "10px",
                      padding: "1px 4px",
                      minWidth: "14px",
                      textAlign: "center",
                    }}
                  >
                    {tab.badge}
                  </span>
                )}
              </div>

              <span
                style={{
                  fontSize: "10px",
                  fontWeight: active ? "800" : "500",
                  color: active
                    ? "#f97316"
                    : "var(--text-muted)",
                }}
              >
                {tab.label}
              </span>

              {active && (
                <div
                  style={{
                    position: "absolute",
                    bottom: "-8px",
                    width: "20px",
                    height: "2px",
                    background: "#f97316",
                    borderRadius: "2px",
                  }}
                />
              )}
            </Link>
          );
        })}
      </nav>
    </>
  );
}

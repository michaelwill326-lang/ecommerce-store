import { Link, useLocation, useNavigate } from "react-router-dom";
import { useContext, useState, useEffect } from "react";
import { CartContext } from "../context/CartContext";
import { useWishlist } from "../context/WishlistContext";

export default function Navbar() {
  const { cart } = useContext(CartContext);
  const { wishlist } = useWishlist();
  const location = useLocation();
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 992); // Tablet and Mobile Breakpoint
  const wishlistCount = wishlist.length;

  const user = JSON.parse(localStorage.getItem("user"));
  const cartCount = cart.reduce((total, item) => total + (item.quantity || 1), 0);

  // Automatically track viewport adjustments so elements adapt seamlessly
  useEffect(() => {
    const handleResize = () => {
      const mobileView = window.innerWidth <= 992;
      setIsMobile(mobileView);
      if (!mobileView) setMenuOpen(false); // Autoclose dropdown if screen widens
    };
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    navigate("/login");
    setMenuOpen(false);
  };

  const linkStyle = (path) => ({
    color: location.pathname === path ? "#f97316" : "#aaa",
    textDecoration: "none",
    fontSize: "14px",
    fontWeight: "500",
    transition: "color 0.2s",
  });

  return (
    <>
      {/* Universal safety wrapper prevents header elements from bleeding off canvas */}
      <style>{`
        body { overflow-x: hidden !important; width: 100% !important; margin: 0; padding: 0; }
        #root { width: 100% !important; overflow-x: hidden !important; }
      `}</style>

      <nav style={{
        ...styles.nav,
        padding: isMobile ? "14px 16px" : "14px 32px" // Leaner padding layout for mobile devices
      }}>

        {/* LOGO */}
        <Link to="/" style={styles.logoWrap} onClick={() => setMenuOpen(false)}>
          <img
            src="/techmart.png"
            alt="TechMart"
            onError={(e) => { e.target.style.display = "none"; }}
            style={styles.logoImg}
          />
          <span style={styles.logoText}>TechMart</span>
        </Link>

        {/* DESKTOP LINKS (Conditionally completely removed from the DOM on mobile viewports) */}
        {!isMobile && (
          <div style={styles.desktopLinks}>
            <Link to="/" style={linkStyle("/")}>Home</Link>
            <Link to="/tracking" style={linkStyle("/tracking")}>Orders</Link>
            <Link to="/pay" style={{ ...linkStyle("/pay"), color: "/pay" === location.pathname ? "#f97316" : "#22c55e", fontWeight: "700" }}>Pay</Link>

            {user?.role === "admin" && (
              <Link to="/admin" style={linkStyle("/admin")}>Admin</Link>
            )}

            <Link to="/wishlist" style={{ ...linkStyle("/wishlist"), position: "relative" }}>
              <div style={{
                ...styles.cartWrap,
                background: location.pathname === "/wishlist" ? "#1a1a1a" : "transparent",
                border: location.pathname === "/wishlist" ? "1px solid #f97316" : "1px solid #333",
              }}>
                🤍
                {wishlistCount > 0 && (
                  <span style={styles.cartBadge}>{wishlistCount}</span>
                )}
              </div>
            </Link>

            {user ? (
              <div style={styles.userWrap}>
                <Link to="/account" style={{ textDecoration: "none" }}>
                  <div style={styles.avatar}>
                    {user.name?.charAt(0).toUpperCase()}
                  </div>
                </Link>
                <Link to="/account" style={{ textDecoration: "none" }}>
                  <span style={{ ...styles.userName, color: "#f97316" }}>Hi, {user.name?.split(" ")[0]}</span>
                </Link>
                <button onClick={handleLogout} style={styles.logoutBtn}>
                  Logout
                </button>
              </div>
            ) : (
              <>
                <Link to="/login" style={linkStyle("/login")}>Login</Link>
                <Link to="/signup">
                  <button style={styles.signupBtn}>Sign Up</button>
                </Link>
              </>
            )}

            {/* CART */}
            <Link to="/cart" style={{ ...linkStyle("/cart"), position: "relative" }}>
              <div style={{
                ...styles.cartWrap,
                background: location.pathname === "/cart" ? "#1a1a1a" : "transparent",
                border: location.pathname === "/cart" ? "1px solid #f97316" : "1px solid #333",
              }}>
                🛒
                {cartCount > 0 && (
                  <span style={styles.cartBadge}>{cartCount}</span>
                )}
              </div>
            </Link>
          </div>
        )}

        {/* MOBILE HAMBURGER BUTTON */}
        {isMobile && (
          <button
            onClick={() => setMenuOpen(!menuOpen)}
            style={{
              ...styles.hamburger,
              display: "block" // Toggles view visible instantly on mobile
            }}
          >
            {menuOpen ? "✕" : "☰"}
          </button>
        )}

      </nav>

      {/* MOBILE EXPANDED MENU DRAWER */}
      {isMobile && menuOpen && (
        <div style={styles.mobileMenu}>

          {user && (
            <div style={styles.mobileUser}>
              <div style={styles.avatar}>
                {user.name?.charAt(0).toUpperCase()}
              </div>
              <div>
                <p style={styles.mobileUserName}>{user.name}</p>
                <p style={styles.mobileUserEmail}>{user.email}</p>
              </div>
            </div>
          )}

          <Link to="/" style={styles.mobileLink} onClick={() => setMenuOpen(false)}>
            🏠 Home
          </Link>

          <Link to="/tracking" style={styles.mobileLink} onClick={() => setMenuOpen(false)}>
            📦 My Orders
          </Link>

          <Link to="/wishlist" style={styles.mobileLink} onClick={() => setMenuOpen(false)}>
            🤍 Wishlist {wishlistCount > 0 && (
              <span style={styles.mobileBadge}>{wishlistCount}</span>
            )}
          </Link>

          <Link to="/cart" style={styles.mobileLink} onClick={() => setMenuOpen(false)}>
            🛒 Cart {cartCount > 0 && (
              <span style={styles.mobileBadge}>{cartCount}</span>
            )}
          </Link>
          <Link to="/pay" style={{...styles.mobileLink, color: "#f97316", fontWeight: "700"}} onClick={() => setMenuOpen(false)}>
            💳 TechMart Pay
          </Link>

          {user?.role === "admin" && (
            <Link to="/admin" style={styles.mobileLink} onClick={() => setMenuOpen(false)}>
              👑 Admin Dashboard
            </Link>
          )}

          {user ? (
            <button onClick={handleLogout} style={styles.mobileLogoutBtn}>
              🚪 Logout
            </button>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: "10px", marginTop: "12px" }}>
              <Link to="/login" style={{ textDecoration: "none" }} onClick={() => setMenuOpen(false)}>
                <button style={{ ...styles.logoutBtn, width: "100%", padding: "12px" }}>🔑 Login</button>
              </Link>
              <Link to="/signup" style={{ textDecoration: "none" }} onClick={() => setMenuOpen(false)}>
                <button style={{ ...styles.signupBtn, width: "100%", padding: "12px" }}>✨ Sign Up</button>
              </Link>
            </div>
          )}
        </div>
      )}
    </>
  );
}

const styles = {
  nav: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    padding: "14px 32px",
    background: "#111",
    borderBottom: "1px solid #222",
    position: "sticky",
    top: 0,
    zIndex: 1000,
    width: "100%",
    boxSizing: "border-box",
  },
  logoWrap: {
    textDecoration: "none",
    display: "flex",
    alignItems: "center",
    gap: "10px",
  },
  logoImg: {
    height: "36px",
    width: "auto",
    objectFit: "contain",
  },
  logoText: {
    color: "#f97316",
    fontWeight: "800",
    fontSize: "20px",
    letterSpacing: "1px",
  },
  desktopLinks: {
    display: "flex",
    alignItems: "center",
    gap: "24px",
  },
  userWrap: {
    display: "flex",
    alignItems: "center",
    gap: "10px",
  },
  avatar: {
    width: "32px",
    height: "32px",
    borderRadius: "50%",
    background: "linear-gradient(135deg, #f97316, #dc2626)",
    color: "#fff",
    fontSize: "14px",
    fontWeight: "800",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },
  userName: {
    color: "#fff",
    fontSize: "14px",
    fontWeight: "600",
  },
  logoutBtn: {
    background: "transparent",
    border: "1px solid #333",
    color: "#aaa",
    padding: "6px 14px",
    borderRadius: "8px",
    cursor: "pointer",
    fontSize: "13px",
    fontWeight: "500",
  },
  signupBtn: {
    padding: "8px 18px",
    background: "linear-gradient(135deg, #f97316, #dc2626)",
    color: "#fff",
    border: "none",
    borderRadius: "8px",
    cursor: "pointer",
    fontSize: "13px",
    fontWeight: "700",
  },
  cartWrap: {
    position: "relative",
    padding: "8px 14px",
    borderRadius: "10px",
    fontSize: "18px",
    display: "flex",
    alignItems: "center",
    gap: "6px",
    transition: "all 0.2s",
  },
  cartBadge: {
    position: "absolute",
    top: "-6px",
    right: "-6px",
    background: "#f97316",
    color: "#fff",
    borderRadius: "50%",
    fontSize: "10px",
    fontWeight: "700",
    width: "18px",
    height: "18px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  },
  hamburger: {
    background: "transparent",
    border: "1px solid #333",
    color: "#fff",
    fontSize: "18px",
    padding: "8px 12px",
    borderRadius: "8px",
    cursor: "pointer",
  },
  mobileMenu: {
    position: "fixed",
    top: "65px",
    left: 0,
    right: 0,
    background: "#111",
    borderBottom: "1px solid #222",
    padding: "20px 24px",
    display: "flex",
    flexDirection: "column",
    gap: "4px",
    zIndex: 999,
    boxShadow: "0 8px 32px rgba(0,0,0,0.6)",
  },
  mobileUser: {
    display: "flex",
    alignItems: "center",
    gap: "12px",
    padding: "12px 0",
    borderBottom: "1px solid #222",
    marginBottom: "8px",
  },
  mobileUserName: {
    color: "#fff",
    fontWeight: "700",
    fontSize: "15px",
    margin: 0,
  },
  mobileUserEmail: {
    color: "#888",
    fontSize: "13px",
    margin: 0,
  },
  mobileLink: {
    color: "#aaa",
    textDecoration: "none",
    fontSize: "15px",
    fontWeight: "500",
    padding: "12px 0",
    borderBottom: "1px solid #1a1a1a",
    display: "flex",
    alignItems: "center",
    gap: "10px",
  },
  mobileBadge: {
    background: "#f97316",
    color: "#fff",
    borderRadius: "999px",
    fontSize: "11px",
    fontWeight: "700",
    padding: "2px 8px",
  },
  mobileLogoutBtn: {
    background: "transparent",
    border: "1px solid #333",
    color: "#aaa",
    padding: "12px 0",
    borderRadius: "0",
    cursor: "pointer",
    fontSize: "15px",
    fontWeight: "500",
    textAlign: "left",
    marginTop: "8px",
  },
};
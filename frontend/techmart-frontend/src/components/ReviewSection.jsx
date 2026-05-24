import { useState } from "react";

const API = import.meta.env.VITE_API_URL || "https://techmart-backend-ecbi.onrender.com";

export default function ReviewSection({ product, onRefresh }) {
  const [stars, setStars] = useState(5);
  const [comment, setComment] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [hoveredStar, setHoveredStar] = useState(0);

  const token = localStorage.getItem("token");
  const user = JSON.parse(localStorage.getItem("user"));

  const submitReview = async () => {
    setError("");
    setSuccess("");

    if (!token || !user) {
      setError("Please login to leave a review");
      return;
    }

    if (!comment.trim()) {
      setError("Please write a comment");
      return;
    }

    try {
      setLoading(true);
      const res = await fetch(`${API}/api/products/${product._id}/review`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ comment, stars }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Failed to submit review");
        return;
      }

      setSuccess("✅ Review submitted successfully!");
      setComment("");
      setStars(5);
      if (onRefresh) onRefresh();

    } catch (err) {
      setError("Failed to submit review. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const avgRating = product.reviews?.length
    ? (product.reviews.reduce((sum, r) => sum + r.stars, 0) / product.reviews.length).toFixed(1)
    : null;

  return (
    <div style={styles.wrap}>

      {/* HEADER */}
      <div style={styles.header}>
        <h2 style={styles.title}>⭐ Customer Reviews</h2>
        {avgRating && (
          <div style={styles.avgWrap}>
            <span style={styles.avgNumber}>{avgRating}</span>
            <div>
              <div style={styles.starsRow}>
                {[1,2,3,4,5].map(i => (
                  <span key={i} style={{
                    color: i <= Math.round(avgRating) ? "#f97316" : "#333",
                    fontSize: "18px"
                  }}>★</span>
                ))}
              </div>
              <p style={styles.reviewCount}>
                {product.reviews.length} review{product.reviews.length !== 1 ? "s" : ""}
              </p>
            </div>
          </div>
        )}
      </div>

      {/* ADD REVIEW FORM */}
      <div style={styles.formCard}>
        <h3 style={styles.formTitle}>
          {user ? "✍️ Write a Review" : "🔐 Login to Review"}
        </h3>

        {/* STAR SELECTOR */}
        <div style={styles.starSelector}>
          <p style={styles.label}>Your Rating</p>
          <div style={styles.starsRow}>
            {[1,2,3,4,5].map(i => (
              <span
                key={i}
                onClick={() => setStars(i)}
                onMouseEnter={() => setHoveredStar(i)}
                onMouseLeave={() => setHoveredStar(0)}
                style={{
                  fontSize: "32px",
                  cursor: "pointer",
                  color: i <= (hoveredStar || stars) ? "#f97316" : "#333",
                  transition: "color 0.1s",
                }}
              >
                ★
              </span>
            ))}
            <span style={{ color: "#888", fontSize: "14px", marginLeft: "8px" }}>
              {["", "Poor", "Fair", "Good", "Very Good", "Excellent"][hoveredStar || stars]}
            </span>
          </div>
        </div>

        {/* COMMENT */}
        <div style={{ marginBottom: "16px" }}>
          <p style={styles.label}>Your Review</p>
          <textarea
            placeholder={user ? "Share your experience with this product..." : "Please login to write a review"}
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            disabled={!user}
            style={{
              ...styles.textarea,
              opacity: !user ? 0.5 : 1,
              cursor: !user ? "not-allowed" : "text",
            }}
          />
        </div>

        {/* ERROR / SUCCESS */}
        {error && <div style={styles.errorBox}>⚠️ {error}</div>}
        {success && <div style={styles.successBox}>{success}</div>}

        {/* SUBMIT */}
        <button
          onClick={submitReview}
          disabled={loading || !user}
          style={{
            ...styles.submitBtn,
            opacity: loading || !user ? 0.6 : 1,
            cursor: loading || !user ? "not-allowed" : "pointer",
          }}
        >
          {loading ? "Submitting..." : "Submit Review →"}
        </button>
      </div>

      {/* REVIEWS LIST */}
      {product.reviews?.length > 0 ? (
        <div style={styles.reviewsList}>
          {product.reviews.map((r, i) => (
            <div key={i} style={styles.reviewCard}>
              <div style={styles.reviewHeader}>
                <div style={styles.reviewAvatar}>
                  {r.user?.charAt(0).toUpperCase()}
                </div>
                <div style={{ flex: 1 }}>
                  <p style={styles.reviewUser}>{r.user}</p>
                  <p style={styles.reviewDate}>
                    {new Date(r.createdAt).toLocaleDateString("en-NG", {
                      year: "numeric", month: "long", day: "numeric"
                    })}
                  </p>
                </div>
                <div style={styles.reviewStars}>
                  {[1,2,3,4,5].map(i => (
                    <span key={i} style={{
                      color: i <= r.stars ? "#f97316" : "#333",
                      fontSize: "16px"
                    }}>★</span>
                  ))}
                </div>
              </div>
              <p style={styles.reviewComment}>{r.comment}</p>
            </div>
          ))}
        </div>
      ) : (
        <div style={styles.noReviews}>
          <span style={{ fontSize: "48px" }}>💬</span>
          <p style={{ color: "#888", marginTop: "12px" }}>
            No reviews yet. Be the first to review!
          </p>
        </div>
      )}

    </div>
  );
}

const styles = {
  wrap: { marginTop: "60px" },
  header: { display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "24px", flexWrap: "wrap", gap: "16px" },
  title: { color: "#fff", fontSize: "22px", fontWeight: "700" },
  avgWrap: { display: "flex", alignItems: "center", gap: "12px", background: "#1a1a1a", border: "1px solid #2a2a2a", borderRadius: "12px", padding: "12px 16px" },
  avgNumber: { color: "#f97316", fontSize: "36px", fontWeight: "900" },
  starsRow: { display: "flex", alignItems: "center", gap: "2px" },
  reviewCount: { color: "#888", fontSize: "12px", margin: "4px 0 0" },
  formCard: { background: "#1a1a1a", border: "1px solid #2a2a2a", borderRadius: "16px", padding: "24px", marginBottom: "24px" },
  formTitle: { color: "#fff", fontSize: "16px", fontWeight: "700", marginBottom: "20px" },
  starSelector: { marginBottom: "20px" },
  label: { color: "#aaa", fontSize: "13px", fontWeight: "600", textTransform: "uppercase", letterSpacing: "0.5px", marginBottom: "8px" },
  textarea: { width: "100%", minHeight: "100px", padding: "12px 16px", background: "#111", border: "1px solid #333", borderRadius: "10px", color: "#fff", fontSize: "14px", outline: "none", resize: "vertical", boxSizing: "border-box", fontFamily: "inherit" },
  errorBox: { background: "#2a1010", border: "1px solid #dc2626", color: "#f87171", padding: "12px 16px", borderRadius: "10px", fontSize: "14px", marginBottom: "16px" },
  successBox: { background: "#0a2a1a", border: "1px solid #22c55e", color: "#86efac", padding: "12px 16px", borderRadius: "10px", fontSize: "14px", marginBottom: "16px" },
  submitBtn: { padding: "12px 24px", background: "linear-gradient(135deg, #f97316, #dc2626)", color: "#fff", border: "none", borderRadius: "10px", fontSize: "15px", fontWeight: "700" },
  reviewsList: { display: "flex", flexDirection: "column", gap: "16px" },
  reviewCard: { background: "#1a1a1a", border: "1px solid #2a2a2a", borderRadius: "16px", padding: "20px" },
  reviewHeader: { display: "flex", alignItems: "center", gap: "12px", marginBottom: "12px" },
  reviewAvatar: { width: "40px", height: "40px", borderRadius: "50%", background: "linear-gradient(135deg, #f97316, #dc2626)", color: "#fff", fontSize: "16px", fontWeight: "800", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 },
  reviewUser: { color: "#fff", fontWeight: "600", fontSize: "14px", margin: 0 },
  reviewDate: { color: "#888", fontSize: "12px", margin: "2px 0 0" },
  reviewStars: { display: "flex", gap: "2px", marginLeft: "auto" },
  reviewComment: { color: "#aaa", fontSize: "14px", lineHeight: "1.6", margin: 0 },
  noReviews: { textAlign: "center", padding: "40px 0" },
};
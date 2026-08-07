import { useState } from "react";
import { useToast } from "../App";

const API = import.meta.env.VITE_API_URL || "https://techmart-backend-ecbi.onrender.com";

export default function ReviewSection({
  const showToast = useToast(); product, onRefresh }) {
  const [stars, setStars] = useState(5);
  const [comment, setComment] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [hoveredStar, setHoveredStar] = useState(0);
  const [flagging, setFlagging] = useState(null);

  const token = localStorage.getItem("token");
  const user = (() => { try { return JSON.parse(localStorage.getItem("user")); } catch { return null; } })();

  const approvedReviews = product.reviews?.filter((r) => r.approved) || [];

  const avgRating = approvedReviews.length
    ? (approvedReviews.reduce((sum, r) => sum + r.stars, 0) / approvedReviews.length).toFixed(1)
    : null;

  const submitReview = async () => {
    setError("");
    setSuccess("");
    if (!token || !user) { setError("Please login to leave a review"); return; }
    if (!comment.trim()) { setError("Please write a comment"); return; }

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
      if (!res.ok) { setError(data.error || "Failed to submit review"); return; }
      setSuccess("✅ Review submitted! It will appear after admin approval.");
      setComment("");
      setStars(5);
      if (onRefresh) onRefresh();
    } catch (err) {
      setError("Failed to submit review. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const flagReview = async (reviewId) => {
    if (!token) { showToast("Please login to flag a review", "warning"); return; }
    try {
      setFlagging(reviewId);
      await fetch(`${API}/api/products/${product._id}/review/${reviewId}/flag`, {
        method: "PUT",
        headers: { Authorization: `Bearer ${token}` },
      });
      showToast("⚠️ Review flagged for moderation. Thank you!", "success");
      if (onRefresh) onRefresh();
    } catch (err) {
      showToast("Failed to flag review", "error");
    } finally {
      setFlagging(null);
    }
  };

  const getSentimentEmoji = (sentiment) => {
    if (sentiment === "positive") return "😊";
    if (sentiment === "negative") return "😞";
    return "😐";
  };

  const getSentimentColor = (sentiment) => {
    if (sentiment === "positive") return "#22c55e";
    if (sentiment === "negative") return "#dc2626";
    return "#888";
  };

  const ratingCounts = [5, 4, 3, 2, 1].map((s) => ({
    star: s,
    count: approvedReviews.filter((r) => r.stars === s).length,
  }));

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
                {[1, 2, 3, 4, 5].map((i) => (
                  <span key={i} style={{ color: i <= Math.round(avgRating) ? "#f97316" : "#333", fontSize: "18px" }}>★</span>
                ))}
              </div>
              <p style={styles.reviewCount}>{approvedReviews.length} verified review{approvedReviews.length !== 1 ? "s" : ""}</p>
            </div>
          </div>
        )}
      </div>

      {/* RATING BREAKDOWN */}
      {approvedReviews.length > 0 && (
        <div style={styles.breakdownCard}>
          <h3 style={styles.breakdownTitle}>Rating Breakdown</h3>
          {ratingCounts.map(({ star, count }) => (
            <div key={star} style={styles.breakdownRow}>
              <span style={styles.breakdownLabel}>{star} ★</span>
              <div style={styles.barTrack}>
                <div style={{
                  ...styles.barFill,
                  width: approvedReviews.length > 0 ? `${(count / approvedReviews.length) * 100}%` : "0%",
                  background: star >= 4 ? "#22c55e" : star === 3 ? "#f97316" : "#dc2626",
                }} />
              </div>
              <span style={styles.breakdownCount}>{count}</span>
            </div>
          ))}

          {/* SENTIMENT SUMMARY */}
          <div style={styles.sentimentRow}>
            <div style={styles.sentimentItem}>
              <span style={{ fontSize: "20px" }}>😊</span>
              <span style={{ color: "#22c55e", fontWeight: "700" }}>
                {approvedReviews.filter((r) => r.sentiment === "positive").length} Positive
              </span>
            </div>
            <div style={styles.sentimentItem}>
              <span style={{ fontSize: "20px" }}>😐</span>
              <span style={{ color: "var(--text-muted)", fontWeight: "700" }}>
                {approvedReviews.filter((r) => r.sentiment === "neutral").length} Neutral
              </span>
            </div>
            <div style={styles.sentimentItem}>
              <span style={{ fontSize: "20px" }}>😞</span>
              <span style={{ color: "#dc2626", fontWeight: "700" }}>
                {approvedReviews.filter((r) => r.sentiment === "negative").length} Negative
              </span>
            </div>
          </div>
        </div>
      )}

      {/* ADD REVIEW FORM */}
      <div style={styles.formCard}>
        <h3 style={styles.formTitle}>
          {user ? "✍️ Write a Review" : "🔐 Login to Review"}
        </h3>

        {/* VERIFIED BUYER NOTICE */}
        {user && (
          <div style={styles.verifiedNotice}>
            ℹ️ Reviews are verified against purchase history and require admin approval before appearing.
          </div>
        )}

        {/* STAR SELECTOR */}
        <div style={styles.starSelector}>
          <p style={styles.label}>Your Rating</p>
          <div style={styles.starsRow}>
            {[1, 2, 3, 4, 5].map((i) => (
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
            <span style={{ color: "var(--text-muted)", fontSize: "14px", marginLeft: "8px" }}>
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
          <p style={{ color: "#555", fontSize: "12px", marginTop: "4px" }}>
            {comment.length}/500 characters
          </p>
        </div>

        {error && <div style={styles.errorBox}>⚠️ {error}</div>}
        {success && <div style={styles.successBox}>{success}</div>}

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
      {approvedReviews.length > 0 ? (
        <div style={styles.reviewsList}>
          <h3 style={{ color: "var(--text-primary)", fontSize: "16px", fontWeight: "700", marginBottom: "16px" }}>
            {approvedReviews.length} Review{approvedReviews.length !== 1 ? "s" : ""}
          </h3>
          {approvedReviews.map((r, i) => (
            <div key={i} style={styles.reviewCard}>
              <div style={styles.reviewHeader}>
                <div style={styles.reviewAvatar}>
                  {r.user?.charAt(0).toUpperCase()}
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                    <p style={styles.reviewUser}>{r.user}</p>
                    {r.verified && (
                      <span style={styles.verifiedBadge}>✅ Verified Buyer</span>
                    )}
                  </div>
                  <p style={styles.reviewDate}>
                    {new Date(r.createdAt).toLocaleDateString("en-NG", {
                      year: "numeric", month: "long", day: "numeric"
                    })}
                  </p>
                </div>
                <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: "4px" }}>
                  <div style={styles.reviewStars}>
                    {[1, 2, 3, 4, 5].map((i) => (
                      <span key={i} style={{ color: i <= r.stars ? "#f97316" : "#333", fontSize: "16px" }}>★</span>
                    ))}
                  </div>
                  {r.sentiment && (
                    <span style={{ color: getSentimentColor(r.sentiment), fontSize: "12px", fontWeight: "600" }}>
                      {getSentimentEmoji(r.sentiment)} {r.sentiment}
                    </span>
                  )}
                </div>
              </div>

              <p style={styles.reviewComment}>{r.comment}</p>

              {/* FLAG BUTTON */}
              <div style={{ display: "flex", justifyContent: "flex-end", marginTop: "8px" }}>
                <button
                  onClick={() => flagReview(r._id)}
                  disabled={flagging === r._id}
                  style={styles.flagBtn}
                >
                  {flagging === r._id ? "Flagging..." : "⚑ Flag"}
                </button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div style={styles.noReviews}>
          <span style={{ fontSize: "48px" }}>💬</span>
          <p style={{ color: "var(--text-muted)", marginTop: "12px" }}>
            No approved reviews yet. Be the first to review!
          </p>
        </div>
      )}

    </div>
  );
}

const styles = {
  wrap: { marginTop: "60px" },
  header: { display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "24px", flexWrap: "wrap", gap: "16px" },
  title: { color: "var(--text-primary)", fontSize: "22px", fontWeight: "700" },
  avgWrap: { display: "flex", alignItems: "center", gap: "12px", background: "var(--bg-card)", border: "1px solid #2a2a2a", borderRadius: "12px", padding: "12px 16px" },
  avgNumber: { color: "#f97316", fontSize: "36px", fontWeight: "900" },
  starsRow: { display: "flex", alignItems: "center", gap: "2px" },
  reviewCount: { color: "var(--text-muted)", fontSize: "12px", margin: "4px 0 0" },
  breakdownCard: { background: "var(--bg-card)", border: "1px solid #2a2a2a", borderRadius: "16px", padding: "20px", marginBottom: "24px" },
  breakdownTitle: { color: "var(--text-primary)", fontSize: "15px", fontWeight: "700", marginBottom: "16px" },
  breakdownRow: { display: "flex", alignItems: "center", gap: "10px", marginBottom: "8px" },
  breakdownLabel: { color: "var(--text-muted)", fontSize: "13px", minWidth: "30px" },
  barTrack: { flex: 1, height: "8px", background: "var(--bg-input)", borderRadius: "999px", overflow: "hidden" },
  barFill: { height: "100%", borderRadius: "999px", transition: "width 0.3s" },
  breakdownCount: { color: "var(--text-muted)", fontSize: "13px", minWidth: "20px", textAlign: "right" },
  sentimentRow: { display: "flex", justifyContent: "space-around", marginTop: "20px", paddingTop: "16px", borderTop: "1px solid var(--border-light)" },
  sentimentItem: { display: "flex", flexDirection: "column", alignItems: "center", gap: "4px" },
  formCard: { background: "var(--bg-card)", border: "1px solid #2a2a2a", borderRadius: "16px", padding: "24px", marginBottom: "24px" },
  formTitle: { color: "var(--text-primary)", fontSize: "16px", fontWeight: "700", marginBottom: "16px" },
  verifiedNotice: { background: "#0a1a2a", border: "1px solid #3b82f6", color: "#93c5fd", padding: "10px 14px", borderRadius: "8px", fontSize: "13px", marginBottom: "16px" },
  starSelector: { marginBottom: "20px" },
  label: { color: "var(--text-secondary)", fontSize: "13px", fontWeight: "600", textTransform: "uppercase", letterSpacing: "0.5px", marginBottom: "8px" },
  textarea: { width: "100%", minHeight: "100px", padding: "12px 16px", background: "var(--bg-secondary)", border: "1px solid var(--border-color)", borderRadius: "10px", color: "var(--text-primary)", fontSize: "14px", outline: "none", resize: "vertical", boxSizing: "border-box", fontFamily: "inherit" },
  errorBox: { background: "#2a1010", border: "1px solid #dc2626", color: "#f87171", padding: "12px 16px", borderRadius: "10px", fontSize: "14px", marginBottom: "16px" },
  successBox: { background: "#0a2a1a", border: "1px solid #22c55e", color: "#86efac", padding: "12px 16px", borderRadius: "10px", fontSize: "14px", marginBottom: "16px" },
  submitBtn: { padding: "12px 24px", background: "linear-gradient(135deg, #f97316, #dc2626)", color: "var(--text-primary)", border: "none", borderRadius: "10px", fontSize: "15px", fontWeight: "700" },
  reviewsList: { display: "flex", flexDirection: "column", gap: "16px" },
  reviewCard: { background: "var(--bg-card)", border: "1px solid #2a2a2a", borderRadius: "16px", padding: "20px" },
  reviewHeader: { display: "flex", alignItems: "center", gap: "12px", marginBottom: "12px" },
  reviewAvatar: { width: "40px", height: "40px", borderRadius: "50%", background: "linear-gradient(135deg, #f97316, #dc2626)", color: "var(--text-primary)", fontSize: "16px", fontWeight: "800", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 },
  reviewUser: { color: "var(--text-primary)", fontWeight: "600", fontSize: "14px", margin: 0 },
  reviewDate: { color: "var(--text-muted)", fontSize: "12px", margin: "2px 0 0" },
  reviewStars: { display: "flex", gap: "2px" },
  reviewComment: { color: "var(--text-secondary)", fontSize: "14px", lineHeight: "1.6", margin: 0 },
  verifiedBadge: { background: "#0a2a1a", border: "1px solid #22c55e", color: "#22c55e", padding: "2px 8px", borderRadius: "999px", fontSize: "11px", fontWeight: "600" },
  flagBtn: { background: "transparent", border: "1px solid var(--border-color)", color: "var(--text-muted)", padding: "4px 12px", borderRadius: "6px", cursor: "pointer", fontSize: "12px" },
  noReviews: { textAlign: "center", padding: "40px 0" },
};
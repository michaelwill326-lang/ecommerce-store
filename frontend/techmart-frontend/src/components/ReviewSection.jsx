import { useState } from "react";

export default function ReviewSection({ product, refresh }) {
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState("");

  const submitReview = async () => {
    await fetch(`${import.meta.env.VITE_API_URL}/api/products/${product._id}/review`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        user: "Anonymous",
        rating,
        comment
      })
    });

    setComment("");
    refresh();
  };

  return (
    <div className="reviews">

      <h3>⭐ Reviews</h3>

      {/* ADD REVIEW */}
      <div className="review-box">
        <select value={rating} onChange={e => setRating(e.target.value)}>
          {[5,4,3,2,1].map(r => (
            <option key={r}>{r}</option>
          ))}
        </select>

        <textarea
          placeholder="Write review..."
          value={comment}
          onChange={e => setComment(e.target.value)}
        />

        <button onClick={submitReview}>Submit</button>
      </div>

      {/* LIST REVIEWS */}
      {product.reviews?.map((r, i) => (
        <div key={i} className="review">
          <strong>{r.user}</strong>
          <p>{"⭐".repeat(r.rating)}</p>
          <p>{r.comment}</p>
        </div>
      ))}

    </div>
  );
}
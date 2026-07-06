"use client";
import React, { useState, useEffect, useCallback } from "react";
import { C } from "@/utils/constants";
import { useAuth } from "@/context/AuthContext";
import { supabase } from "@/utils/supabase";

const BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

/* â”€â”€ Types â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */
interface Review {
  id:              string;
  reviewer_id:     string;
  reviewer_name:   string;
  reviewer_avatar?: string;
  rating:          number;
  title?:          string;
  body?:           string;
  created_at:      string;
}

interface ReviewSectionProps {
  storeId?:   string;
  productId?: string;
  storeName?: string;
}

/* â”€â”€ Star rating display â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */
export const StarDisplay = ({ rating, size = 14 }: { rating: number; size?: number }) => (
  <div style={{ display: "flex", gap: 1 }}>
    {[1, 2, 3, 4, 5].map(i => (
      <span key={i} style={{ fontSize: size, color: i <= Math.round(rating) ? "#F59E0B" : "#D1D5DB", lineHeight: 1 }}>â˜…</span>
    ))}
  </div>
);

/* â”€â”€ Interactive star picker â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */
const StarPicker = ({ value, onChange }: { value: number; onChange: (v: number) => void }) => {
  const [hover, setHover] = useState(0);
  return (
    <div style={{ display: "flex", gap: 4 }}>
      {[1, 2, 3, 4, 5].map(i => (
        <span
          key={i}
          onMouseEnter={() => setHover(i)}
          onMouseLeave={() => setHover(0)}
          onClick={() => onChange(i)}
          style={{ fontSize: 32, cursor: "pointer", color: i <= (hover || value) ? "#F59E0B" : "#D1D5DB", transition: "color 0.1s", lineHeight: 1 }}
        >
          â˜…
        </span>
      ))}
    </div>
  );
};

/* â”€â”€ Rating breakdown bar â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */
const RatingBar = ({ star, count, total }: { star: number; count: number; total: number }) => {
  const pct = total > 0 ? (count / total) * 100 : 0;
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
      <span style={{ fontSize: 11, color: C.gray, width: 8, textAlign: "right" }}>{star}</span>
      <span style={{ fontSize: 10, color: "#F59E0B" }}>â˜…</span>
      <div style={{ flex: 1, height: 6, background: "#F3F4F6", borderRadius: 3, overflow: "hidden" }}>
        <div style={{ width: `${pct}%`, height: "100%", background: "#F59E0B", borderRadius: 3, transition: "width 0.5s" }} />
      </div>
      <span style={{ fontSize: 11, color: C.gray, width: 20, textAlign: "right" }}>{count}</span>
    </div>
  );
};

/* â”€â”€ Single review card â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */
const ReviewCard = ({
  review, isOwn, onDelete,
}: {
  review:   Review;
  isOwn:    boolean;
  onDelete: (id: string) => void;
}) => {
  const [deleting, setDeleting] = useState(false);

  const handleDelete = async () => {
    if (!confirm("Delete your review?")) return;
    setDeleting(true);
    try {
      const { data: sessionData } = await supabase.auth.getSession();
      const token = sessionData.session?.access_token;
      await fetch(`${BASE}/api/reviews/${review.id}`, {
        method:  "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      onDelete(review.id);
    } finally {
      setDeleting(false);
    }
  };

  const timeAgo = (date: string) => {
    const diff = Date.now() - new Date(date).getTime();
    const days = Math.floor(diff / 86400000);
    if (days < 1)  return "Today";
    if (days < 7)  return `${days}d ago`;
    if (days < 30) return `${Math.floor(days / 7)}w ago`;
    return `${Math.floor(days / 30)}mo ago`;
  };

  return (
    <div style={{ background: C.white, borderRadius: 14, padding: "14px 16px", marginBottom: 10, boxShadow: "0 1px 6px rgba(0,0,0,0.06)" }}>
      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 10 }}>
        {/* Avatar */}
        <div style={{ width: 36, height: 36, borderRadius: "50%", background: `linear-gradient(135deg, ${C.primary}, #FF8C61)`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16, fontWeight: 800, color: "#fff", flexShrink: 0, overflow: "hidden" }}>
          {review.reviewer_avatar
            ? <img src={review.reviewer_avatar} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
            : review.reviewer_name?.charAt(0)?.toUpperCase() || "U"
          }
        </div>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 13, fontWeight: 600, color: C.dark }}>{review.reviewer_name}</div>
          <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <StarDisplay rating={review.rating} size={11} />
            <span style={{ fontSize: 10, color: C.gray }}>{timeAgo(review.created_at)}</span>
          </div>
        </div>
        {isOwn && (
          <button
            onClick={handleDelete}
            disabled={deleting}
            style={{ background: "none", border: "none", cursor: "pointer", fontSize: 13, color: C.gray, padding: 4 }}
          >
            {deleting ? "â€¦" : "ðŸ—‘"}
          </button>
        )}
      </div>

      {/* Title */}
      {review.title && (
        <div style={{ fontSize: 13, fontWeight: 700, color: C.dark, marginBottom: 5 }}>{review.title}</div>
      )}

      {/* Body */}
      {review.body && (
        <div style={{ fontSize: 12, color: C.gray, lineHeight: 1.65 }}>{review.body}</div>
      )}

      {/* Verified badge */}
      <div style={{ marginTop: 8, display: "inline-flex", alignItems: "center", gap: 4, background: "#E1F5EE", borderRadius: 20, padding: "2px 8px" }}>
        <span style={{ fontSize: 9 }}>âœ“</span>
        <span style={{ fontSize: 9, color: "#085041", fontWeight: 600 }}>Verified Review</span>
      </div>
    </div>
  );
};

/* â”€â”€ Write review form â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */
const WriteReviewForm = ({
  storeId, productId, onSubmitted, onCancel,
}: {
  storeId?:    string;
  productId?:  string;
  onSubmitted: (review: Review) => void;
  onCancel:    () => void;
}) => {
  const [rating, setRating] = useState(0);
  const [title,  setTitle]  = useState("");
  const [body,   setBody]   = useState("");
  const [busy,   setBusy]   = useState(false);
  const [error,  setError]  = useState("");

  const LABELS = ["", "Poor", "Fair", "Good", "Very Good", "Excellent"];

  const handleSubmit = async () => {
    if (rating === 0) { setError("Please select a star rating."); return; }
    setBusy(true); setError("");
    try {
      const { data: sessionData } = await supabase.auth.getSession();
      const token = sessionData.session?.access_token;

      const res = await fetch(`${BASE}/api/reviews`, {
        method:  "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ store_id: storeId, product_id: productId, rating, title: title.trim() || undefined, body: body.trim() || undefined }),
      });

      const data = await res.json();
      if (!data.success) throw new Error(data.message);
      onSubmitted(data.review);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to submit review.");
      setBusy(false);
    }
  };

  return (
    <div style={{ background: C.white, borderRadius: 16, padding: "18px 16px", marginBottom: 14, border: `1.5px solid ${C.primary}` }}>
      <div style={{ fontSize: 15, fontWeight: 800, color: C.dark, marginBottom: 14 }}>Write a Review</div>

      {error && (
        <div style={{ background: "#FEE2E2", borderRadius: 8, padding: "8px 12px", marginBottom: 12, fontSize: 12, color: "#991B1B" }}>{error}</div>
      )}

      {/* Stars */}
      <div style={{ marginBottom: 12, textAlign: "center" }}>
        <StarPicker value={rating} onChange={setRating} />
        {rating > 0 && (
          <div style={{ fontSize: 13, fontWeight: 600, color: "#F59E0B", marginTop: 4 }}>{LABELS[rating]}</div>
        )}
      </div>

      {/* Title */}
      <div style={{ marginBottom: 10 }}>
        <label style={{ fontSize: 11, fontWeight: 600, color: C.dark, display: "block", marginBottom: 4 }}>Review Title</label>
        <input
          value={title}
          onChange={e => setTitle(e.target.value)}
          placeholder="Summarise your experienceâ€¦"
          maxLength={100}
          style={{ width: "100%", padding: "10px 12px", border: `1.5px solid ${C.border}`, borderRadius: 10, fontSize: 13, outline: "none", color: C.dark, boxSizing: "border-box" }}
        />
      </div>

      {/* Body */}
      <div style={{ marginBottom: 14 }}>
        <label style={{ fontSize: 11, fontWeight: 600, color: C.dark, display: "block", marginBottom: 4 }}>Your Review <span style={{ color: C.gray, fontWeight: 400 }}>(optional)</span></label>
        <textarea
          value={body}
          onChange={e => setBody(e.target.value)}
          placeholder="Tell others about your experience with this product/storeâ€¦"
          rows={4}
          style={{ width: "100%", padding: "10px 12px", border: `1.5px solid ${C.border}`, borderRadius: 10, fontSize: 13, outline: "none", color: C.dark, boxSizing: "border-box", resize: "vertical", lineHeight: 1.5 }}
        />
      </div>

      <div style={{ display: "flex", gap: 8 }}>
        <button
          onClick={handleSubmit}
          disabled={busy}
          style={{ flex: 2, background: busy ? C.grayLight : C.primary, color: "#fff", border: "none", borderRadius: 12, padding: "12px 0", fontSize: 14, fontWeight: 700, cursor: busy ? "default" : "pointer" }}
        >
          {busy ? "Submittingâ€¦" : "Submit Review"}
        </button>
        <button
          onClick={onCancel}
          style={{ flex: 1, background: C.white, color: C.dark, border: `1.5px solid ${C.border}`, borderRadius: 12, padding: "12px 0", fontSize: 13, fontWeight: 600, cursor: "pointer" }}
        >
          Cancel
        </button>
      </div>
    </div>
  );
};

/* â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
   MAIN REVIEW SECTION COMPONENT
â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â• */
export default function ReviewSection({ storeId, productId }: ReviewSectionProps) {
  const { authUser, isLoggedIn } = useAuth();

  const [reviews,    setReviews]    = useState<Review[]>([]);
  const [total,      setTotal]      = useState(0);
  const [average,    setAverage]    = useState(0);
  const [breakdown,  setBreakdown]  = useState<{ rating: number; count: number }[]>([]);
  const [loading,    setLoading]    = useState(true);
  const [showForm,   setShowForm]   = useState(false);
  const [canReview,  setCanReview]  = useState(false);
  const [alreadyReviewed, setAlreadyReviewed] = useState(false);

  /* Load reviews */
  const loadReviews = useCallback(async () => {
    try {
      const url = storeId
        ? `${BASE}/api/reviews/store/${storeId}`
        : `${BASE}/api/reviews/product/${productId}`;

      const res  = await fetch(url);
      const data = await res.json();

      if (data.success) {
        setReviews(data.reviews);
        setTotal(data.total);
        setAverage(data.average);
        setBreakdown(data.breakdown || []);
      }
    } catch { /* silent */ }
    finally { setLoading(false); }
  }, [storeId, productId]);

  /* Check if user can review */
  const checkCanReview = useCallback(async () => {
    if (!isLoggedIn) return;
    try {
      const { data: sessionData } = await supabase.auth.getSession();
      const token = sessionData.session?.access_token;
      const params = storeId ? `store_id=${storeId}` : `product_id=${productId}`;

      const res  = await fetch(`${BASE}/api/reviews/can-review?${params}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();

      if (data.success) {
        setCanReview(data.can_review);
        setAlreadyReviewed(data.already_reviewed);
      }
    } catch { /* silent */ }
  }, [isLoggedIn, storeId, productId]);

  useEffect(() => { loadReviews(); }, [loadReviews]);
  useEffect(() => { checkCanReview(); }, [checkCanReview]);

  const handleReviewSubmitted = (newReview: Review) => {
    setReviews(prev => [{ ...newReview, reviewer_name: authUser?.user_metadata?.full_name || "You", reviewer_avatar: undefined }, ...prev]);
    setTotal(prev => prev + 1);
    setShowForm(false);
    setCanReview(false);
    setAlreadyReviewed(true);
    loadReviews(); // Refresh to get accurate average
  };

  const handleReviewDeleted = (id: string) => {
    setReviews(prev => prev.filter(r => r.id !== id));
    setTotal(prev => prev - 1);
    setCanReview(true);
    setAlreadyReviewed(false);
    loadReviews();
  };

  const getBreakdownCount = (star: number) =>
    breakdown.find(b => Number(b.rating) === star)?.count || 0;

  return (
    <div style={{ background: C.bg }}>

      {/* â”€â”€ Summary card â”€â”€ */}
      <div style={{ background: C.white, padding: "18px 16px", marginBottom: 10 }}>
        <div style={{ fontSize: 16, fontWeight: 800, color: C.dark, marginBottom: 14 }}>
          Reviews & Ratings
        </div>

        {total === 0 && !loading ? (
          <div style={{ textAlign: "center", padding: "16px 0" }}>
            <div style={{ fontSize: 32, marginBottom: 8 }}>â­</div>
            <div style={{ fontSize: 13, color: C.gray }}>No reviews yet â€” be the first!</div>
          </div>
        ) : (
          <div style={{ display: "flex", gap: 16, alignItems: "center", marginBottom: 16 }}>
            {/* Big number */}
            <div style={{ textAlign: "center", flexShrink: 0 }}>
              <div style={{ fontSize: 42, fontWeight: 900, color: C.dark, lineHeight: 1 }}>{average.toFixed(1)}</div>
              <StarDisplay rating={average} size={14} />
              <div style={{ fontSize: 11, color: C.gray, marginTop: 4 }}>{total} review{total !== 1 ? "s" : ""}</div>
            </div>

            {/* Breakdown bars */}
            <div style={{ flex: 1 }}>
              {[5, 4, 3, 2, 1].map(star => (
                <RatingBar key={star} star={star} count={getBreakdownCount(star)} total={total} />
              ))}
            </div>
          </div>
        )}

        {/* Write review button */}
        {!showForm && (
          <div>
            {!isLoggedIn ? (
              <button
                onClick={() => window.location.href = "/login"}
                style={{ width: "100%", background: C.white, color: C.primary, border: `2px solid ${C.primary}`, borderRadius: 12, padding: "11px 0", fontSize: 13, fontWeight: 700, cursor: "pointer" }}
              >
                Login to Write a Review
              </button>
            ) : alreadyReviewed ? (
              <div style={{ background: "#E1F5EE", borderRadius: 12, padding: "10px 14px", fontSize: 12, color: "#085041", textAlign: "center", fontWeight: 600 }}>
                âœ“ You have already reviewed this {storeId ? "store" : "product"}
              </div>
            ) : canReview ? (
              <button
                onClick={() => setShowForm(true)}
                style={{ width: "100%", background: C.primary, color: "#fff", border: "none", borderRadius: 12, padding: "12px 0", fontSize: 14, fontWeight: 700, cursor: "pointer" }}
              >
                âœï¸ Write a Review
              </button>
            ) : null}
          </div>
        )}
      </div>

      {/* â”€â”€ Review form â”€â”€ */}
      {showForm && (
        <div style={{ padding: "0 16px", marginBottom: 0 }}>
          <WriteReviewForm
            storeId={storeId}
            productId={productId}
            onSubmitted={handleReviewSubmitted}
            onCancel={() => setShowForm(false)}
          />
        </div>
      )}

      {/* â”€â”€ Reviews list â”€â”€ */}
      {loading ? (
        <div style={{ padding: "20px 16px", textAlign: "center", color: C.gray, fontSize: 13 }}>
          Loading reviewsâ€¦
        </div>
      ) : reviews.length > 0 ? (
        <div style={{ padding: "0 16px" }}>
          {reviews.map(review => (
            <ReviewCard
              key={review.id}
              review={review}
              isOwn={review.reviewer_id === authUser?.id}
              onDelete={handleReviewDeleted}
            />
          ))}
        </div>
      ) : null}

    </div>
  );
}


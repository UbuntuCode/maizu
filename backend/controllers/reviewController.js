const { query } = require("../config/db");

/* ── GET STORE REVIEWS ── GET /api/reviews/store/:storeId ───── */
const getStoreReviews = async (req, res) => {
  const { storeId } = req.params;
  const { limit = 20, offset = 0 } = req.query;

  const result = await query(
    `SELECT r.*,
       u.full_name AS reviewer_name,
       u.avatar_url AS reviewer_avatar
     FROM reviews r
     JOIN users u ON r.reviewer_id = u.id
     WHERE r.store_id = $1
     ORDER BY r.created_at DESC
     LIMIT $2 OFFSET $3`,
    [storeId, Number(limit), Number(offset)]
  );

  /* Rating breakdown */
  const breakdown = await query(
    `SELECT rating, COUNT(*) as count
     FROM reviews WHERE store_id = $1
     GROUP BY rating ORDER BY rating DESC`,
    [storeId]
  );

  const total = result.rows.length;
  const avg   = total > 0
    ? result.rows.reduce((s, r) => s + r.rating, 0) / total
    : 0;

  res.status(200).json({
    success:   true,
    reviews:   result.rows,
    total,
    average:   Number(avg.toFixed(1)),
    breakdown: breakdown.rows,
  });
};

/* ── GET PRODUCT REVIEWS ── GET /api/reviews/product/:productId */
const getProductReviews = async (req, res) => {
  const { productId } = req.params;

  const result = await query(
    `SELECT r.*,
       u.full_name AS reviewer_name,
       u.avatar_url AS reviewer_avatar
     FROM reviews r
     JOIN users u ON r.reviewer_id = u.id
     WHERE r.product_id = $1
     ORDER BY r.created_at DESC`,
    [productId]
  );

  const total = result.rows.length;
  const avg   = total > 0
    ? result.rows.reduce((s, r) => s + r.rating, 0) / total
    : 0;

  res.status(200).json({
    success:  true,
    reviews:  result.rows,
    total,
    average:  Number(avg.toFixed(1)),
  });
};

/* ── CREATE REVIEW ── POST /api/reviews ─────────────────────── */
const createReview = async (req, res) => {
  const { store_id, product_id, order_id, rating, title, body } = req.body;
  const reviewer_id = req.user.id;

  if (!rating || rating < 1 || rating > 5) {
    return res.status(400).json({ success: false, message: "Rating must be between 1 and 5." });
  }
  if (!store_id && !product_id) {
    return res.status(400).json({ success: false, message: "Must review a store or product." });
  }

  /* Check if user already reviewed this store/product */
  if (store_id) {
    const existing = await query(
      "SELECT id FROM reviews WHERE reviewer_id = $1 AND store_id = $2",
      [reviewer_id, store_id]
    );
    if (existing.rows.length > 0) {
      return res.status(409).json({ success: false, message: "You have already reviewed this store." });
    }
  }

  if (product_id) {
    const existing = await query(
      "SELECT id FROM reviews WHERE reviewer_id = $1 AND product_id = $2",
      [reviewer_id, product_id]
    );
    if (existing.rows.length > 0) {
      return res.status(409).json({ success: false, message: "You have already reviewed this product." });
    }
  }

  const result = await query(
    `INSERT INTO reviews (reviewer_id, store_id, product_id, order_id, rating, title, body)
     VALUES ($1, $2, $3, $4, $5, $6, $7)
     RETURNING *`,
    [reviewer_id, store_id || null, product_id || null, order_id || null, rating, title || null, body || null]
  );

  res.status(201).json({ success: true, review: result.rows[0] });
};

/* ── UPDATE REVIEW ── PUT /api/reviews/:id ──────────────────── */
const updateReview = async (req, res) => {
  const { id } = req.params;
  const { rating, title, body } = req.body;

  const check = await query("SELECT reviewer_id FROM reviews WHERE id = $1", [id]);
  if (check.rows.length === 0) return res.status(404).json({ success: false, message: "Review not found." });
  if (check.rows[0].reviewer_id !== req.user.id) return res.status(403).json({ success: false, message: "Not authorised." });

  const result = await query(
    `UPDATE reviews
     SET rating = COALESCE($1, rating),
         title  = COALESCE($2, title),
         body   = COALESCE($3, body),
         updated_at = NOW()
     WHERE id = $4 RETURNING *`,
    [rating, title, body, id]
  );

  res.status(200).json({ success: true, review: result.rows[0] });
};

/* ── DELETE REVIEW ── DELETE /api/reviews/:id ───────────────── */
const deleteReview = async (req, res) => {
  const check = await query("SELECT reviewer_id FROM reviews WHERE id = $1", [req.params.id]);
  if (check.rows.length === 0) return res.status(404).json({ success: false, message: "Review not found." });
  if (check.rows[0].reviewer_id !== req.user.id) return res.status(403).json({ success: false, message: "Not authorised." });

  await query("DELETE FROM reviews WHERE id = $1", [req.params.id]);
  res.status(200).json({ success: true, message: "Review deleted." });
};

/* ── CHECK CAN REVIEW ── GET /api/reviews/can-review ───────── */
/* Returns whether the current user has bought from this store/product */
const canReview = async (req, res) => {
  const { store_id, product_id } = req.query;
  const userId = req.user.id;

  let alreadyReviewed = false;
  let hasPurchased    = true; // Allow review even without purchase for now

  if (store_id) {
    const existing = await query(
      "SELECT id FROM reviews WHERE reviewer_id = $1 AND store_id = $2",
      [userId, store_id]
    );
    alreadyReviewed = existing.rows.length > 0;
  }

  if (product_id) {
    const existing = await query(
      "SELECT id FROM reviews WHERE reviewer_id = $1 AND product_id = $2",
      [userId, product_id]
    );
    alreadyReviewed = existing.rows.length > 0;
  }

  res.status(200).json({
    success: true,
    can_review: !alreadyReviewed && hasPurchased,
    already_reviewed: alreadyReviewed,
  });
};

module.exports = { getStoreReviews, getProductReviews, createReview, updateReview, deleteReview, canReview };

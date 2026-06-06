const { query } = require("../config/db");

const getWishlist = async (req, res) => {
  const result = await query(
    `SELECT
       w.id           AS wishlist_id,
       w.created_at   AS saved_at,
       p.id           AS product_id,
       p.name,
       p.price,
       p.image_urls,
       p.stock_quantity,
       p.category,
       p.is_trending,
       p.like_count,
       p.view_count,
       p.store_id,
       s.name         AS store_name,
       s.logo_url     AS store_logo
     FROM wishlists w
     JOIN products p ON w.product_id = p.id
     JOIN stores   s ON p.store_id   = s.id
     WHERE w.user_id = $1
       AND p.is_active = true
     ORDER BY w.created_at DESC`,
    [req.user.id]
  );
  res.status(200).json({ success: true, items: result.rows });
};

const toggleWishlist = async (req, res) => {
  const { product_id } = req.body;
  const user_id        = req.user.id;

  if (!product_id) {
    return res.status(400).json({ success: false, message: "product_id is required." });
  }

  const existing = await query(
    "SELECT id FROM wishlists WHERE user_id = $1 AND product_id = $2",
    [user_id, product_id]
  );

  if (existing.rows.length > 0) {
    await query(
      "DELETE FROM wishlists WHERE user_id = $1 AND product_id = $2",
      [user_id, product_id]
    );
    return res.status(200).json({ success: true, saved: false });
  }

  await query(
    "INSERT INTO wishlists (user_id, product_id) VALUES ($1, $2) ON CONFLICT DO NOTHING",
    [user_id, product_id]
  );
  return res.status(200).json({ success: true, saved: true });
};

const checkWishlist = async (req, res) => {
  const { product_ids } = req.query;
  if (!product_ids) return res.status(200).json({ success: true, saved: {} });

  const ids = product_ids.split(",").filter(Boolean);
  if (ids.length === 0) return res.status(200).json({ success: true, saved: {} });

  const result = await query(
    "SELECT product_id FROM wishlists WHERE user_id = $1 AND product_id = ANY($2::uuid[])",
    [req.user.id, ids]
  );

  var saved = {};
  result.rows.forEach(function(row) { saved[row.product_id] = true; });

  res.status(200).json({ success: true, saved: saved });
};

const removeFromWishlist = async (req, res) => {
  await query(
    "DELETE FROM wishlists WHERE user_id = $1 AND product_id = $2",
    [req.user.id, req.params.productId]
  );
  res.status(200).json({ success: true, saved: false });
};

const getProductWishlistCount = async (req, res) => {
  const result = await query(
    "SELECT COUNT(*) AS count FROM wishlists WHERE product_id = $1",
    [req.params.productId]
  );
  res.status(200).json({ success: true, count: Number(result.rows[0].count) });
};

module.exports = {
  getWishlist,
  toggleWishlist,
  checkWishlist,
  removeFromWishlist,
  getProductWishlistCount,
};
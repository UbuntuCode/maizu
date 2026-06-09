const { query } = require("../config/db");

/* ── BOOST PLANS ────────────────────────────────────────────── */
const BOOST_PLANS = {
  starter: {
    name:        "Starter Boost",
    price:       49,
    duration:    7,        // days
    position:    30,
    description: "Get noticed for 1 week",
    features:    ["7 days featured", "Home page placement", "Store directory boost"],
    color:       "#2563EB",
    emoji:       "🚀",
  },
  growth: {
    name:        "Growth Boost",
    price:       99,
    duration:    14,
    position:    20,
    description: "2 weeks of top visibility",
    features:    ["14 days featured", "Home page priority", "Search results boost", "Analytics report"],
    color:       "#7C3AED",
    emoji:       "📈",
    popular:     true,
  },
  premium: {
    name:        "Premium Boost",
    price:       199,
    duration:    30,
    position:    10,
    description: "A full month at the top",
    features:    ["30 days featured", "Top home page slot", "🔥 Trending badge", "Priority everywhere", "Monthly analytics"],
    color:       "#E8401C",
    emoji:       "⭐",
  },
};

/* ── GET BOOST PLANS ── GET /api/featured/plans ─────────────── */
const getBoostPlans = async (req, res) => {
  res.status(200).json({ success: true, plans: BOOST_PLANS });
};

/* ── GET MY BOOSTS ── GET /api/featured/my ──────────────────── */
const getMyBoosts = async (req, res) => {
  const result = await query(
    `SELECT f.*, s.name AS store_name, s.logo_url
     FROM featured_stores f
     JOIN stores s ON f.store_id = s.id
     WHERE f.vendor_id = $1
     ORDER BY f.created_at DESC`,
    [req.user.id]
  );
  res.status(200).json({ success: true, boosts: result.rows });
};

/* ── GET ACTIVE FEATURED STORES ── GET /api/featured/active ─── */
const getActiveFeatured = async (req, res) => {
  const { limit = 10 } = req.query;
  const result = await query(
    `SELECT f.*, s.name, s.logo_url, s.banner_url,
            s.category, s.rating, s.follower_count,
            s.product_count, s.description
     FROM featured_stores f
     JOIN stores s ON f.store_id = s.id
     WHERE f.status = 'active'
       AND f.expires_at > NOW()
       AND s.is_active = true
     ORDER BY f.position ASC, f.created_at DESC
     LIMIT $1`,
    [Number(limit)]
  );

  /* Update impressions */
  if (result.rows.length > 0) {
    const ids = result.rows.map(r => r.id);
    await query(
      `UPDATE featured_stores SET impressions = impressions + 1
       WHERE id = ANY($1)`,
      [ids]
    );
  }

  res.status(200).json({ success: true, stores: result.rows });
};

/* ── BOOST STORE ── POST /api/featured/boost ────────────────── */
const boostStore = async (req, res) => {
  const { store_id, plan, payment_ref } = req.body;
  const vendor_id = req.user.id;

  if (!store_id || !plan) {
    return res.status(400).json({ success: false, message: "store_id and plan are required." });
  }

  if (!BOOST_PLANS[plan]) {
    return res.status(400).json({ success: false, message: "Invalid boost plan." });
  }

  /* Check store belongs to vendor */
  const storeCheck = await query(
    "SELECT id, name FROM stores WHERE id = $1 AND owner_id = $2",
    [store_id, vendor_id]
  );
  if (storeCheck.rows.length === 0) {
    return res.status(403).json({ success: false, message: "Store not found or not yours." });
  }

  const planInfo   = BOOST_PLANS[plan];
  const expiresAt  = new Date();
  expiresAt.setDate(expiresAt.getDate() + planInfo.duration);

  /* Check if store already has an active boost */
  const existing = await query(
    `SELECT id FROM featured_stores
     WHERE store_id = $1 AND status = 'active' AND expires_at > NOW()`,
    [store_id]
  );

  if (existing.rows.length > 0) {
    /* Extend existing boost */
    await query(
      `UPDATE featured_stores
       SET expires_at = expires_at + INTERVAL '${planInfo.duration} days',
           plan = $1, amount_paid = amount_paid + $2, payment_ref = $3
       WHERE store_id = $4 AND status = 'active'`,
      [plan, planInfo.price, payment_ref || null, store_id]
    );
  } else {
    /* Create new boost */
    await query(
      `INSERT INTO featured_stores
         (store_id, vendor_id, plan, status, amount_paid, payment_ref, expires_at, position)
       VALUES ($1, $2, $3, 'active', $4, $5, $6, $7)`,
      [store_id, vendor_id, plan, planInfo.price, payment_ref || null, expiresAt, planInfo.position]
    );
  }

  /* Mark store as trending */
  await query(
    "UPDATE stores SET is_trending = true WHERE id = $1",
    [store_id]
  );

  res.status(201).json({
    success:    true,
    store_name: storeCheck.rows[0].name,
    plan:       planInfo.name,
    expires_at: expiresAt,
    message:    `${storeCheck.rows[0].name} is now boosted for ${planInfo.duration} days!`,
  });
};

/* ── TRACK CLICK ── POST /api/featured/:id/click ────────────── */
const trackClick = async (req, res) => {
  await query(
    "UPDATE featured_stores SET clicks = clicks + 1 WHERE id = $1",
    [req.params.id]
  );
  res.status(200).json({ success: true });
};

/* ── CANCEL BOOST ── DELETE /api/featured/:id ───────────────── */
const cancelBoost = async (req, res) => {
  const check = await query(
    "SELECT vendor_id, store_id FROM featured_stores WHERE id = $1",
    [req.params.id]
  );
  if (check.rows.length === 0) return res.status(404).json({ success: false, message: "Boost not found." });
  if (check.rows[0].vendor_id !== req.user.id) return res.status(403).json({ success: false, message: "Not authorised." });

  await query(
    "UPDATE featured_stores SET status = 'cancelled' WHERE id = $1",
    [req.params.id]
  );
  await query(
    "UPDATE stores SET is_trending = false WHERE id = $1",
    [check.rows[0].store_id]
  );

  res.status(200).json({ success: true });
};

module.exports = { getBoostPlans, getMyBoosts, getActiveFeatured, boostStore, trackClick, cancelBoost };

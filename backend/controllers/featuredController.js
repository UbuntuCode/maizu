const { query } = require("../config/db");

/* ── BOOST PLANS ──────────────────────────────────────────────── */
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

/* ── GET ACTIVE FEATURED STORES ── GET /api/featured/active ── */
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

/* ── BOOST STORE ── POST /api/featured/boost ──────────────────
   SECURITY: creates a PENDING boost only. Nothing activates and
   is_trending is never touched until an admin verifies the money
   arrived (see adminController approve/reject).                  */
const boostStore = async (req, res) => {
  const { store_id, plan, payment_ref } = req.body;
  const vendor_id = req.user.id;

  if (!store_id || !plan) {
    return res.status(400).json({ success: false, message: "store_id and plan are required." });
  }
  if (!BOOST_PLANS[plan]) {
    return res.status(400).json({ success: false, message: "Invalid boost plan." });
  }
  /* Payment reference is now REQUIRED — it's what we verify against the bank */
  if (!payment_ref || String(payment_ref).trim().length < 4) {
    return res.status(400).json({
      success: false,
      message: "Please provide your EFT payment reference so we can verify your payment.",
    });
  }

  /* Check store belongs to vendor */
  const storeCheck = await query(
    "SELECT id, name FROM stores WHERE id = $1 AND owner_id = $2",
    [store_id, vendor_id]
  );
  if (storeCheck.rows.length === 0) {
    return res.status(403).json({ success: false, message: "Store not found or not yours." });
  }

  /* One pending request per store at a time — prevents queue spam */
  const pendingCheck = await query(
    `SELECT id FROM featured_stores WHERE store_id = $1 AND status = 'pending'`,
    [store_id]
  );
  if (pendingCheck.rows.length > 0) {
    return res.status(409).json({
      success: false,
      message: "You already have a boost awaiting verification for this store. We'll review it shortly.",
    });
  }

  const planInfo = BOOST_PLANS[plan];

  /* Provisional expiry (expires_at is NOT NULL). The REAL expiry is
     recalculated from the approval timestamp when the admin approves. */
  const provisionalExpiry = new Date();
  provisionalExpiry.setDate(provisionalExpiry.getDate() + planInfo.duration);

  const inserted = await query(
    `INSERT INTO featured_stores
       (store_id, vendor_id, plan, status, amount_paid, payment_ref,
        payment_method, expires_at, position)
     VALUES ($1, $2, $3, 'pending', $4, $5, 'eft', $6, $7)
     RETURNING id`,
    [store_id, vendor_id, plan, planInfo.price, String(payment_ref).trim(), provisionalExpiry, planInfo.position]
  );

  res.status(201).json({
    success:    true,
    boost_id:   inserted.rows[0].id,
    store_name: storeCheck.rows[0].name,
    plan:       planInfo.name,
    status:     "pending",
    message:    "Boost submitted! It activates once we verify your payment — usually within a few hours during business hours.",
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

/* ── CANCEL BOOST ── DELETE /api/featured/:id ─────────────────
   Vendors may cancel their own pending or active boost. is_trending
   only clears if the store has no OTHER active boost remaining.    */
const cancelBoost = async (req, res) => {
  const check = await query(
    "SELECT vendor_id, store_id, status FROM featured_stores WHERE id = $1",
    [req.params.id]
  );
  if (check.rows.length === 0) return res.status(404).json({ success: false, message: "Boost not found." });
  if (check.rows[0].vendor_id !== req.user.id) return res.status(403).json({ success: false, message: "Not authorised." });

  await query(
    "UPDATE featured_stores SET status = 'cancelled' WHERE id = $1",
    [req.params.id]
  );

  const stillActive = await query(
    `SELECT id FROM featured_stores
     WHERE store_id = $1 AND status = 'active' AND expires_at > NOW()`,
    [check.rows[0].store_id]
  );
  if (stillActive.rows.length === 0) {
    await query("UPDATE stores SET is_trending = false WHERE id = $1", [check.rows[0].store_id]);
  }

  res.status(200).json({ success: true });
};

module.exports = { getBoostPlans, getMyBoosts, getActiveFeatured, boostStore, trackClick, cancelBoost, BOOST_PLANS };
const { query } = require("../config/db");

/* ── PLAN DEFINITIONS ───────────────────────────────────────── */
const PLANS = {
  free: {
    name:          "Free",
    price:         0,
    max_stores:    1,
    max_products:  10,
    commission:    0.05,   // 5%
    features: [
      "1 store",
      "Up to 10 products",
      "5% commission per sale",
      "Basic analytics",
      "WhatsApp sharing",
    ],
  },
  basic: {
    name:          "Basic",
    price:         99,
    max_stores:    3,
    max_products:  50,
    commission:    0.03,   // 3%
    features: [
      "Up to 3 stores",
      "Up to 50 products",
      "3% commission per sale",
      "Full analytics dashboard",
      "Promo codes",
      "Priority support",
      "WhatsApp sharing",
    ],
  },
  pro: {
    name:          "Pro",
    price:         299,
    max_stores:    999,
    max_products:  999,
    commission:    0.01,   // 1%
    features: [
      "Unlimited stores",
      "Unlimited products",
      "1% commission per sale",
      "Advanced analytics",
      "Promo codes",
      "Featured store placement",
      "Priority support",
      "Custom store banner",
      "WhatsApp sharing",
    ],
  },
};

/* ── GET PLANS ── GET /api/subscriptions/plans ──────────────── */
const getPlans = async (req, res) => {
  res.status(200).json({ success: true, plans: PLANS });
};

/* ── GET MY SUBSCRIPTION ── GET /api/subscriptions/me ───────── */
const getMySubscription = async (req, res) => {
  const userId = req.user.id;

  const userResult = await query(
    "SELECT plan, plan_expires_at, plan_started_at FROM users WHERE id = $1",
    [userId]
  );

  if (userResult.rows.length === 0) {
    return res.status(404).json({ success: false, message: "User not found." });
  }

  const user = userResult.rows[0];
  const plan = user.plan || "free";

  /* Check if plan has expired */
  if (plan !== "free" && user.plan_expires_at && new Date(user.plan_expires_at) < new Date()) {
    /* Downgrade to free */
    await query(
      "UPDATE users SET plan = 'free', plan_expires_at = NULL WHERE id = $1",
      [userId]
    );
    return res.status(200).json({
      success: true,
      plan:     "free",
      plan_info: PLANS.free,
      expired:   true,
    });
  }

  /* Pending upgrade awaiting admin verification? Tell the frontend */
  const pendingResult = await query(
    "SELECT id, plan, amount_paid, created_at FROM subscriptions WHERE user_id = $1 AND status = 'pending' ORDER BY created_at DESC LIMIT 1",
    [userId]
  );

  /* Most recent rejection (only relevant if nothing is pending) */
  const rejectedResult = pendingResult.rows.length === 0
    ? await query(
        `SELECT id, plan, rejected_reason, created_at FROM subscriptions
         WHERE user_id = $1 AND status = 'rejected'
         ORDER BY created_at DESC LIMIT 1`,
        [userId]
      )
    : { rows: [] };

  /* Get usage stats */
  const storeCount = await query(
    "SELECT COUNT(*) AS count FROM stores WHERE owner_id = $1 AND is_active = true",
    [userId]
  );
  const productCount = await query(
    `SELECT COUNT(*) AS count FROM products p
     JOIN stores s ON p.store_id = s.id
     WHERE s.owner_id = $1 AND p.is_active = true`,
    [userId]
  );

  res.status(200).json({
    success:      true,
    plan,
    plan_info:    PLANS[plan] || PLANS.free,
    plan_expires_at: user.plan_expires_at,
    plan_started_at: user.plan_started_at,
    pending_upgrade:  pendingResult.rows[0] || null,
    rejected_upgrade: rejectedResult.rows[0] || null,
    usage: {
      stores:   Number(storeCount.rows[0].count),
      products: Number(productCount.rows[0].count),
    },
  });
};

/* ── UPGRADE PLAN ── POST /api/subscriptions/upgrade ─────────
   SECURITY: creates a PENDING record only. The user's plan does
   NOT change until an admin verifies the EFT arrived
   (adminController.approveSubscription). The old code here
   auto-approved "for demo purposes" — that was exploit P16.
─────────────────────────────────────────────────────────────── */
const upgradePlan = async (req, res) => {
  const { plan, payment_method, payment_ref } = req.body;
  const userId = req.user.id;

  if (!["basic", "pro"].includes(plan)) {
    return res.status(400).json({ success: false, message: "Invalid plan. Choose basic or pro." });
  }

  /* Payment reference is REQUIRED — it's what we verify against the bank */
  if (!payment_ref || String(payment_ref).trim().length < 4) {
    return res.status(400).json({
      success: false,
      message: "Please provide your EFT payment reference so we can verify your payment.",
    });
  }

  /* One pending upgrade per user at a time */
  const pendingCheck = await query(
    "SELECT id FROM subscriptions WHERE user_id = $1 AND status = 'pending'",
    [userId]
  );
  if (pendingCheck.rows.length > 0) {
    return res.status(409).json({
      success: false,
      message: "You already have an upgrade awaiting verification. We'll review it shortly.",
    });
  }

  const planInfo = PLANS[plan];

  /* Provisional expiry — the REAL period starts when the admin approves */
  const expiresAt = new Date();
  expiresAt.setMonth(expiresAt.getMonth() + 1);

  const inserted = await query(
    `INSERT INTO subscriptions
       (user_id, plan, status, amount_paid, payment_method, payment_ref, expires_at)
     VALUES ($1, $2, 'pending', $3, $4, $5, $6)
     RETURNING id`,
    [userId, plan, planInfo.price, payment_method || "eft", String(payment_ref).trim(), expiresAt]
  );

  res.status(200).json({
    success:         true,
    subscription_id: inserted.rows[0].id,
    plan,
    plan_info:       planInfo,
    status:          "pending",
    message:         "Upgrade submitted! Your plan activates once we verify your payment — usually within a few hours.",
  });
};

/* ── CANCEL PLAN ── POST /api/subscriptions/cancel ──────────── */
const cancelPlan = async (req, res) => {
  const userId = req.user.id;

  await query(
    `UPDATE subscriptions
     SET status = 'cancelled', cancelled_at = NOW()
     WHERE user_id = $1 AND status = 'active'`,
    [userId]
  );

  /* Downgrade to free at end of billing period */
  await query(
    "UPDATE users SET plan = 'free', plan_expires_at = NULL WHERE id = $1",
    [userId]
  );

  res.status(200).json({ success: true, message: "Plan cancelled. You have been moved to the Free plan." });
};

/* ── CHECK PLAN LIMIT ── (internal helper) ───────────────────── */
const checkPlanLimit = async (userId, resource) => {
  const userResult = await query(
    "SELECT plan FROM users WHERE id = $1",
    [userId]
  );

  const plan     = userResult.rows[0]?.plan || "free";
  const planInfo = PLANS[plan];

  if (resource === "store") {
    const count = await query(
      "SELECT COUNT(*) AS count FROM stores WHERE owner_id = $1",
      [userId]
    );
    const current = Number(count.rows[0].count);
    return {
      allowed: current < planInfo.max_stores,
      current,
      max:     planInfo.max_stores,
      plan,
    };
  }

  if (resource === "product") {
    const count = await query(
      `SELECT COUNT(*) AS count FROM products p
       JOIN stores s ON p.store_id = s.id
       WHERE s.owner_id = $1`,
      [userId]
    );
    const current = Number(count.rows[0].count);
    return {
      allowed: current < planInfo.max_products,
      current,
      max:     planInfo.max_products,
      plan,
    };
  }

  return { allowed: true, plan };
};

/* ── CHECK LIMITS ── GET /api/subscriptions/check/:resource ─── */
const checkLimits = async (req, res) => {
  const result = await checkPlanLimit(req.user.id, req.params.resource);
  res.status(200).json({ success: true, ...result });
};

module.exports = {
  getPlans,
  getMySubscription,
  upgradePlan,
  cancelPlan,
  checkPlanLimit,
  checkLimits,
  PLANS,
};

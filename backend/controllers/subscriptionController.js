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
    usage: {
      stores:   Number(storeCount.rows[0].count),
      products: Number(productCount.rows[0].count),
    },
  });
};

/* ── UPGRADE PLAN ── POST /api/subscriptions/upgrade ─────────
   For now: manual EFT payment — admin confirms upgrade.
   When PayFast is live this will auto-upgrade.
─────────────────────────────────────────────────────────────── */
const upgradePlan = async (req, res) => {
  const { plan, payment_method, payment_ref } = req.body;
  const userId = req.user.id;

  if (!["basic", "pro"].includes(plan)) {
    return res.status(400).json({ success: false, message: "Invalid plan. Choose basic or pro." });
  }

  const planInfo = PLANS[plan];

  /* Create pending subscription record */
  const expiresAt = new Date();
  expiresAt.setMonth(expiresAt.getMonth() + 1); // 1 month

  await query(
    `INSERT INTO subscriptions
       (user_id, plan, status, amount_paid, payment_method, payment_ref, expires_at)
     VALUES ($1, $2, 'pending', $3, $4, $5, $6)`,
    [userId, plan, planInfo.price, payment_method || "eft", payment_ref || null, expiresAt]
  );

  /* For EFT — mark as pending, admin confirms later */
  /* For now auto-approve for demo purposes */
  await query(
    `UPDATE users
     SET plan = $1, plan_started_at = NOW(), plan_expires_at = $2
     WHERE id = $3`,
    [plan, expiresAt, userId]
  );

  await query(
    "UPDATE subscriptions SET status = 'active' WHERE user_id = $1 AND plan = $2 AND status = 'pending'",
    [userId, plan]
  );

  res.status(200).json({
    success:    true,
    plan,
    plan_info:  planInfo,
    expires_at: expiresAt,
    message:    `Successfully upgraded to ${planInfo.name} plan!`,
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

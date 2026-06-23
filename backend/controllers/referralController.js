const { query } = require("../config/db");

/* ── Reward config ───────────────────────────────────────────
   Buyer refers buyer  → R20 credit once referee makes first purchase
   Vendor refers vendor → 1 month free Basic plan once referee lists 3+ products
   Anyone refers vendor → R50 credit once that vendor's first sale completes
─────────────────────────────────────────────────────────────── */
const REWARDS = {
  buyer_first_purchase:  { type: "discount_credit", amount: 20  },
  vendor_first_listing:  { type: "discount_credit", amount: 0   }, // handled via free_month below
  vendor_first_sale:     { type: "discount_credit", amount: 50  },
};

/* ══════════════════════════════════════════════════════════════
   GET MY REFERRAL INFO
   GET /api/referrals/my-code
══════════════════════════════════════════════════════════════ */
const getMyReferralInfo = async (req, res) => {
  const userId = req.user.id;

  const userResult = await query("SELECT referral_code FROM users WHERE id = $1", [userId]);
  const code = userResult.rows[0]?.referral_code;

  const [referralsResult, creditsResult] = await Promise.all([
    query(
      `SELECT r.*, u.full_name, u.email, u.created_at AS joined_at
       FROM referrals r JOIN users u ON r.referred_user_id = u.id
       WHERE r.referrer_id = $1 ORDER BY r.created_at DESC`,
      [userId]
    ),
    query("SELECT COALESCE(SUM(amount), 0) AS balance FROM referral_credits WHERE user_id = $1", [userId]),
  ]);

  const referrals = referralsResult.rows;
  const stats = {
    total_referred:  referrals.length,
    pending:         referrals.filter(r => r.status === "pending").length,
    qualified:       referrals.filter(r => r.status === "qualified" || r.status === "rewarded").length,
    total_earned:    referrals.reduce((sum, r) => sum + Number(r.reward_amount || 0), 0),
    credit_balance:  Number(creditsResult.rows[0].balance),
  };

  const baseUrl = process.env.CLIENT_URL || "https://maizu.co.za";

  res.status(200).json({
    success: true,
    referral_code: code,
    referral_link: `${baseUrl}/register?ref=${code}`,
    stats,
    referrals: referrals.map(r => ({
      id: r.id,
      name: r.full_name,
      role: r.referred_role,
      status: r.status,
      reward_amount: r.reward_amount,
      joined_at: r.joined_at,
    })),
  });
};

/* ══════════════════════════════════════════════════════════════
   REGISTER A REFERRAL
   POST /api/referrals/register
   Called right after a new user signs up with a ?ref= code
══════════════════════════════════════════════════════════════ */
const registerReferral = async (req, res) => {
  const { referral_code } = req.body;
  const newUserId = req.user.id;

  if (!referral_code) {
    return res.status(400).json({ success: false, message: "referral_code is required." });
  }

  try {
    /* Find the referrer */
    const referrerResult = await query("SELECT id, role FROM users WHERE referral_code = $1", [referral_code.toUpperCase()]);
    if (referrerResult.rows.length === 0) {
      return res.status(404).json({ success: false, message: "Invalid referral code." });
    }
    const referrer = referrerResult.rows[0];

    if (referrer.id === newUserId) {
      return res.status(400).json({ success: false, message: "You cannot refer yourself." });
    }

    /* Check this user hasn't already been referred */
    const existing = await query("SELECT id FROM referrals WHERE referred_user_id = $1", [newUserId]);
    if (existing.rows.length > 0) {
      return res.status(409).json({ success: false, message: "Referral already recorded for this account." });
    }

    /* Get new user's role */
    const newUserResult = await query("SELECT role FROM users WHERE id = $1", [newUserId]);
    const referredRole  = newUserResult.rows[0]?.role || "buyer";

    /* Record referral + set referred_by on the new user */
    await query("UPDATE users SET referred_by = $1 WHERE id = $2", [referrer.id, newUserId]);

    const result = await query(
      `INSERT INTO referrals (referrer_id, referred_user_id, referred_role, status)
       VALUES ($1, $2, $3, 'pending') RETURNING *`,
      [referrer.id, newUserId, referredRole]
    );

    res.status(201).json({ success: true, referral: result.rows[0] });
  } catch (err) {
    console.error("Register referral error:", err.message);
    res.status(500).json({ success: false, message: "Failed to register referral." });
  }
};

/* ══════════════════════════════════════════════════════════════
   INTERNAL: QUALIFY A REFERRAL
   Called from orderController / vendorController when a
   referred user hits a qualifying milestone — NOT a public route.
══════════════════════════════════════════════════════════════ */
const qualifyReferral = async (userId, eventType) => {
  try {
    const referralResult = await query(
      "SELECT * FROM referrals WHERE referred_user_id = $1 AND status = 'pending'",
      [userId]
    );
    if (referralResult.rows.length === 0) return;

    const referral = referralResult.rows[0];
    const reward = REWARDS[eventType];
    if (!reward) return;

    await query(
      `UPDATE referrals
       SET status = 'qualified', qualifying_event = $1, reward_type = $2, reward_amount = $3, qualified_at = NOW()
       WHERE id = $4`,
      [eventType, reward.type, reward.amount, referral.id]
    );

    /* Credit the referrer's account */
    if (reward.amount > 0) {
      const balanceResult = await query("SELECT COALESCE(SUM(amount),0) AS balance FROM referral_credits WHERE user_id = $1", [referral.referrer_id]);
      const newBalance = Number(balanceResult.rows[0].balance) + reward.amount;

      await query(
        `INSERT INTO referral_credits (user_id, referral_id, amount, description, balance_after)
         VALUES ($1, $2, $3, $4, $5)`,
        [referral.referrer_id, referral.id, reward.amount, `Referral reward: ${eventType}`, newBalance]
      );

      await query("UPDATE referrals SET status = 'rewarded', reward_paid_at = NOW() WHERE id = $1", [referral.id]);
    }

    /* Special case: vendor referring vendor who lists 3+ products → free month Basic */
    if (eventType === "vendor_first_listing") {
      await query(
        `INSERT INTO subscriptions (vendor_id, plan, status, start_date, end_date)
         VALUES ($1, 'basic', 'active', NOW(), NOW() + INTERVAL '30 days')
         ON CONFLICT DO NOTHING`,
        [referral.referrer_id]
      );
    }

    /* Notify referrer */
    try {
      const { sendNotification } = require("./notificationController");
      await sendNotification(
        referral.referrer_id,
        "referral_reward",
        "You earned a referral reward! 🎉",
        reward.amount > 0
          ? `Your referral just qualified — R${reward.amount} credit added to your account.`
          : "Your referral just qualified for a reward!",
        { referral_id: referral.id }
      );
    } catch { /* non-critical */ }

  } catch (err) {
    console.error("Qualify referral error:", err.message);
  }
};

/* ══════════════════════════════════════════════════════════════
   GET CREDIT BALANCE & HISTORY
   GET /api/referrals/credits
══════════════════════════════════════════════════════════════ */
const getCredits = async (req, res) => {
  const result = await query(
    "SELECT * FROM referral_credits WHERE user_id = $1 ORDER BY created_at DESC",
    [req.user.id]
  );
  const balance = result.rows.reduce((sum, r) => sum + Number(r.amount), 0);

  res.status(200).json({ success: true, balance, history: result.rows });
};

/* ══════════════════════════════════════════════════════════════
   ADMIN: LEADERBOARD
   GET /api/referrals/admin/leaderboard
══════════════════════════════════════════════════════════════ */
const getLeaderboard = async (req, res) => {
  const result = await query(
    `SELECT u.id, u.full_name, u.email, u.referral_code,
            COUNT(r.id) AS total_referred,
            COUNT(r.id) FILTER (WHERE r.status IN ('qualified','rewarded')) AS qualified,
            COALESCE(SUM(r.reward_amount), 0) AS total_rewarded
     FROM users u
     JOIN referrals r ON r.referrer_id = u.id
     GROUP BY u.id, u.full_name, u.email, u.referral_code
     ORDER BY qualified DESC, total_referred DESC
     LIMIT 50`
  );
  res.status(200).json({ success: true, leaderboard: result.rows });
};

module.exports = {
  getMyReferralInfo,
  registerReferral,
  qualifyReferral, /* exported for internal use by other controllers */
  getCredits,
  getLeaderboard,
};

const { query } = require("../config/db");
const { sendNotification } = require("./notificationController");
const { BOOST_PLANS }      = require("./featuredController");

/* ══════════════════════════════════════════════════════════════
   DASHBOARD STATS
══════════════════════════════════════════════════════════════ */
const getDashboardStats = async (req, res) => {
  try {
    const [users, stores, orders, revenue, newUsers, newOrders] = await Promise.all([
      query("SELECT COUNT(*) AS count FROM users"),
      query("SELECT COUNT(*) AS count FROM stores WHERE is_active = true"),
      query("SELECT COUNT(*) AS count FROM orders"),
      query("SELECT COALESCE(SUM(total_amount),0) AS total FROM orders WHERE status != 'cancelled'"),
      /* New users last 7 days */
      query("SELECT COUNT(*) AS count FROM users WHERE created_at >= NOW() - INTERVAL '7 days'"),
      /* New orders last 7 days */
      query("SELECT COUNT(*) AS count FROM orders WHERE created_at >= NOW() - INTERVAL '7 days'"),
    ]);

    /* Daily signups last 14 days */
    const signupsResult = await query(
      `SELECT DATE(created_at) AS day, COUNT(*) AS count
       FROM users
       WHERE created_at >= NOW() - INTERVAL '14 days'
       GROUP BY DATE(created_at) ORDER BY day ASC`
    );

    /* Orders by status */
    const orderStatusResult = await query(
      `SELECT status, COUNT(*) AS count
       FROM orders GROUP BY status`
    );

    /* Top 5 stores by revenue */
    const topStoresResult = await query(
      `SELECT s.name, s.logo_url, s.id,
              COALESCE(SUM(oi.subtotal),0) AS revenue,
              COUNT(DISTINCT o.id) AS orders
       FROM stores s
       LEFT JOIN order_items oi ON oi.store_id = s.id
       LEFT JOIN orders o ON o.id = oi.order_id AND o.status != 'cancelled'
       GROUP BY s.id, s.name, s.logo_url
       ORDER BY revenue DESC LIMIT 5`
    );

    /* Revenue last 14 days */
    const revenueResult = await query(
      `SELECT DATE(created_at) AS day, COALESCE(SUM(total_amount),0) AS revenue
       FROM orders
       WHERE created_at >= NOW() - INTERVAL '14 days'
         AND status != 'cancelled'
       GROUP BY DATE(created_at) ORDER BY day ASC`
    );

    res.status(200).json({
      success: true,
      stats: {
        total_users:   Number(users.rows[0].count),
        total_stores:  Number(stores.rows[0].count),
        total_orders:  Number(orders.rows[0].count),
        total_revenue: Number(revenue.rows[0].total),
        new_users_7d:  Number(newUsers.rows[0].count),
        new_orders_7d: Number(newOrders.rows[0].count),
      },
      charts: {
        signups:       signupsResult.rows,
        order_status:  orderStatusResult.rows,
        top_stores:    topStoresResult.rows,
        revenue:       revenueResult.rows,
      },
    });
  } catch (err) {
    console.error("Admin stats error:", err.message);
    res.status(500).json({ success: false, message: "Failed to load stats." });
  }
};

/* ══════════════════════════════════════════════════════════════
   USER MANAGEMENT
══════════════════════════════════════════════════════════════ */
const getUsers = async (req, res) => {
  const { search, role, limit = 50, offset = 0 } = req.query;

  var sql    = "SELECT id, full_name, email, role, plan, created_at, avatar_url FROM users WHERE 1=1";
  var params = [];

  if (search) {
    params.push(`%${search}%`);
    sql += ` AND (full_name ILIKE $${params.length} OR email ILIKE $${params.length})`;
  }
  if (role && role !== "all") {
    params.push(role);
    sql += ` AND role = $${params.length}`;
  }
  sql += " ORDER BY created_at DESC";
  params.push(Number(limit));
  sql += ` LIMIT $${params.length}`;
  params.push(Number(offset));
  sql += ` OFFSET $${params.length}`;

  const result = await query(sql, params);

  /* Count */
  var countSql    = "SELECT COUNT(*) AS total FROM users WHERE 1=1";
  var countParams = [];
  if (search)                 { countParams.push(`%${search}%`); countSql += ` AND (full_name ILIKE $${countParams.length} OR email ILIKE $${countParams.length})`; }
  if (role && role !== "all") { countParams.push(role);           countSql += ` AND role = $${countParams.length}`; }
  const countResult = await query(countSql, countParams);

  res.status(200).json({ success: true, users: result.rows, total: Number(countResult.rows[0].total) });
};

const updateUserRole = async (req, res) => {
  const { id }   = req.params;
  const { role } = req.body;

  if (!["buyer", "vendor", "admin"].includes(role)) {
    return res.status(400).json({ success: false, message: "Invalid role." });
  }
  if (id === req.user.id) {
    return res.status(400).json({ success: false, message: "Cannot change your own role." });
  }

  const result = await query(
    "UPDATE users SET role = $1 WHERE id = $2 RETURNING id, full_name, email, role",
    [role, id]
  );
  if (result.rows.length === 0) return res.status(404).json({ success: false, message: "User not found." });
  res.status(200).json({ success: true, user: result.rows[0] });
};

const deleteUser = async (req, res) => {
  const { id } = req.params;
  if (id === req.user.id) {
    return res.status(400).json({ success: false, message: "Cannot delete your own account." });
  }
  await query("DELETE FROM users WHERE id = $1", [id]);
  res.status(200).json({ success: true, message: "User deleted." });
};

/* ══════════════════════════════════════════════════════════════
   STORE MANAGEMENT
══════════════════════════════════════════════════════════════ */
const getStores = async (req, res) => {
  const { search, limit = 50, offset = 0 } = req.query;

  var sql    = `SELECT s.*, u.full_name AS owner_name, u.email AS owner_email
                FROM stores s JOIN users u ON s.owner_id = u.id WHERE 1=1`;
  var params = [];

  if (search) {
    params.push(`%${search}%`);
    sql += ` AND (s.name ILIKE $${params.length} OR u.full_name ILIKE $${params.length})`;
  }

  sql += " ORDER BY s.created_at DESC";
  params.push(Number(limit));
  sql += ` LIMIT $${params.length}`;
  params.push(Number(offset));
  sql += ` OFFSET $${params.length}`;

  const result = await query(sql, params);

  var countSql = "SELECT COUNT(*) AS total FROM stores s JOIN users u ON s.owner_id = u.id WHERE 1=1";
  var cp = [];
  if (search) { cp.push(`%${search}%`); countSql += ` AND (s.name ILIKE $1 OR u.full_name ILIKE $1)`; }
  const countResult = await query(countSql, cp);

  res.status(200).json({ success: true, stores: result.rows, total: Number(countResult.rows[0].total) });
};

const toggleStoreActive = async (req, res) => {
  const result = await query(
    "UPDATE stores SET is_active = NOT is_active WHERE id = $1 RETURNING id, name, is_active",
    [req.params.id]
  );
  if (result.rows.length === 0) return res.status(404).json({ success: false, message: "Store not found." });
  res.status(200).json({ success: true, store: result.rows[0] });
};

const toggleStoreTrending = async (req, res) => {
  const result = await query(
    "UPDATE stores SET is_trending = NOT is_trending WHERE id = $1 RETURNING id, name, is_trending",
    [req.params.id]
  );
  if (result.rows.length === 0) return res.status(404).json({ success: false, message: "Store not found." });
  res.status(200).json({ success: true, store: result.rows[0] });
};

const adminDeleteStore = async (req, res) => {
  await query("DELETE FROM stores WHERE id = $1", [req.params.id]);
  res.status(200).json({ success: true, message: "Store deleted." });
};

/* ══════════════════════════════════════════════════════════════
   ORDER MANAGEMENT
══════════════════════════════════════════════════════════════ */
const getAllOrders = async (req, res) => {
  const { status, search, limit = 50, offset = 0 } = req.query;

  var sql    = `SELECT o.*, u.full_name AS buyer_name, u.email AS buyer_email
                FROM orders o JOIN users u ON o.buyer_id = u.id WHERE 1=1`;
  var params = [];

  if (status && status !== "all") {
    params.push(status);
    sql += ` AND o.status = $${params.length}`;
  }
  if (search) {
    params.push(`%${search}%`);
    sql += ` AND (u.full_name ILIKE $${params.length} OR u.email ILIKE $${params.length})`;
  }

  sql += " ORDER BY o.created_at DESC";
  params.push(Number(limit));
  sql += ` LIMIT $${params.length}`;
  params.push(Number(offset));
  sql += ` OFFSET $${params.length}`;

  const result      = await query(sql, params);
  const countResult = await query("SELECT COUNT(*) AS total FROM orders");

  res.status(200).json({ success: true, orders: result.rows, total: Number(countResult.rows[0].total) });
};

const adminUpdateOrderStatus = async (req, res) => {
  const { status } = req.body;
  const valid = ["pending", "confirmed", "shipped", "delivered", "cancelled"];
  if (!valid.includes(status)) return res.status(400).json({ success: false, message: "Invalid status." });

  const result = await query(
    "UPDATE orders SET status = $1, updated_at = NOW() WHERE id = $2 RETURNING *",
    [status, req.params.id]
  );
  if (result.rows.length === 0) return res.status(404).json({ success: false, message: "Order not found." });
  res.status(200).json({ success: true, order: result.rows[0] });
};

/* ══════════════════════════════════════════════════════════════
   BOOST PAYMENT VERIFICATION
   Boosts are created as 'pending' by featuredController.boostStore.
   Nothing activates until an admin confirms the EFT arrived.
══════════════════════════════════════════════════════════════ */

/* ── LIST BOOSTS ── GET /api/admin/boosts?status=pending ────── */
const getBoosts = async (req, res) => {
  const { status = "pending" } = req.query;
  const valid = ["pending", "active", "rejected", "expired", "cancelled", "all"];
  if (!valid.includes(status)) {
    return res.status(400).json({ success: false, message: "Invalid status filter." });
  }

  const where  = status === "all" ? "" : "WHERE f.status = $1";
  const params = status === "all" ? [] : [status];

  const result = await query(
    `SELECT f.*, s.name AS store_name, s.logo_url,
            u.full_name AS vendor_name, u.email AS vendor_email
     FROM featured_stores f
     JOIN stores s ON f.store_id = s.id
     JOIN users  u ON f.vendor_id = u.id
     ${where}
     ORDER BY f.created_at DESC
     LIMIT 100`,
    params
  );
  res.status(200).json({ success: true, boosts: result.rows });
};

/* ── APPROVE BOOST ── PUT /api/admin/boosts/:id/approve ───────
   ONLY call after the money is confirmed in the bank account.   */
const approveBoost = async (req, res) => {
  const boostResult = await query(
    "SELECT * FROM featured_stores WHERE id = $1 AND status = 'pending'",
    [req.params.id]
  );
  if (boostResult.rows.length === 0) {
    return res.status(404).json({ success: false, message: "Pending boost not found (already handled?)." });
  }
  const boost    = boostResult.rows[0];
  const planInfo = BOOST_PLANS[boost.plan];
  if (!planInfo) {
    return res.status(400).json({ success: false, message: `Unknown plan '${boost.plan}' on this boost.` });
  }

  /* Real expiry counts from approval — but if the store already has an
     active boost, the new one starts when that one ends (no lost days). */
  const activeResult = await query(
    `SELECT MAX(expires_at) AS current_expiry FROM featured_stores
     WHERE store_id = $1 AND status = 'active' AND expires_at > NOW()`,
    [boost.store_id]
  );
  const base      = activeResult.rows[0].current_expiry
                    ? new Date(activeResult.rows[0].current_expiry)
                    : new Date();
  const expiresAt = new Date(base);
  expiresAt.setDate(expiresAt.getDate() + planInfo.duration);

  const updated = await query(
    `UPDATE featured_stores
     SET status = 'active', approved_by = $1, approved_at = NOW(), expires_at = $2
     WHERE id = $3 AND status = 'pending'
     RETURNING *`,
    [req.user.id, expiresAt, req.params.id]
  );
  if (updated.rows.length === 0) {
    return res.status(409).json({ success: false, message: "Boost was already handled by someone else." });
  }

  await query("UPDATE stores SET is_trending = true WHERE id = $1", [boost.store_id]);

  const storeName = (await query("SELECT name FROM stores WHERE id = $1", [boost.store_id])).rows[0]?.name || "Your store";

  await sendNotification(
    boost.vendor_id,
    "boost_approved",
    "Boost activated! 🚀",
    `Payment verified — ${storeName} is now featured until ${expiresAt.toLocaleDateString("en-ZA", { day: "numeric", month: "short", year: "numeric" })}.`,
    { boost_id: boost.id, store_id: boost.store_id }
  );

  /* Invoice email — activates automatically once utils/email.js (Task C1)
     exists. Safe no-op until then. */
  try {
    const email = require("../utils/email");
    if (email && email.sendEmail && email.boostInvoiceEmail) {
      const vendor = (await query("SELECT full_name, email FROM users WHERE id = $1", [boost.vendor_id])).rows[0];
      if (vendor) {
        const { subject, html } = email.boostInvoiceEmail({
          vendorName:    vendor.full_name,
          storeName,
          planName:      planInfo.name,
          amount:        boost.amount_paid,
          receiptNumber: "MZU-BOOST-" + boost.id.slice(0, 8).toUpperCase(), // TODO: sequential numbers when C1's getNextReceiptNumber lands
          paymentMethod: boost.payment_method || "EFT",
          date:          new Date().toLocaleDateString("en-ZA"),
        });
        await email.sendEmail({ to: vendor.email, subject, html });
      }
    }
  } catch { /* email module not built yet — expected until Task C1 merges */ }

  res.status(200).json({ success: true, boost: updated.rows[0] });
};

/* ── REJECT BOOST ── PUT /api/admin/boosts/:id/reject ───────── */
const rejectBoost = async (req, res) => {
  const { reason } = req.body;
  if (!reason || String(reason).trim().length < 3) {
    return res.status(400).json({ success: false, message: "A rejection reason is required — the vendor will see it." });
  }

  const updated = await query(
    `UPDATE featured_stores
     SET status = 'rejected', rejected_reason = $1, approved_by = $2, approved_at = NOW()
     WHERE id = $3 AND status = 'pending'
     RETURNING *`,
    [String(reason).trim(), req.user.id, req.params.id]
  );
  if (updated.rows.length === 0) {
    return res.status(404).json({ success: false, message: "Pending boost not found (already handled?)." });
  }
  const boost = updated.rows[0];

  await sendNotification(
    boost.vendor_id,
    "boost_rejected",
    "Boost payment issue ⚠️",
    `We couldn't verify your boost payment: ${String(reason).trim()}. Reply to support or resubmit with the correct reference.`,
    { boost_id: boost.id, store_id: boost.store_id }
  );

  res.status(200).json({ success: true, boost });
};

/* ══════════════════════════════════════════════════════════════
   SUBSCRIPTION PAYMENT VERIFICATION — same pattern as boosts.
   Upgrades are created as 'pending' by subscriptionController.
   users.plan only changes when an admin approves.
══════════════════════════════════════════════════════════════ */

/* ── LIST ── GET /api/admin/subscriptions?status=pending ────── */
const getSubscriptions = async (req, res) => {
  const { status = "pending" } = req.query;
  const valid = ["pending", "active", "rejected", "expired", "cancelled", "all"];
  if (!valid.includes(status)) {
    return res.status(400).json({ success: false, message: "Invalid status filter." });
  }
  const where  = status === "all" ? "" : "WHERE sub.status = $1";
  const params = status === "all" ? [] : [status];

  const result = await query(
    `SELECT sub.*, u.full_name AS vendor_name, u.email AS vendor_email, u.plan AS current_plan
     FROM subscriptions sub
     JOIN users u ON sub.user_id = u.id
     ${where}
     ORDER BY sub.created_at DESC
     LIMIT 100`,
    params
  );
  res.status(200).json({ success: true, subscriptions: result.rows });
};

/* ── APPROVE ── PUT /api/admin/subscriptions/:id/approve ──────
   ONLY after the money is confirmed in the bank account.        */
const approveSubscription = async (req, res) => {
  const subResult = await query(
    "SELECT * FROM subscriptions WHERE id = $1 AND status = 'pending'",
    [req.params.id]
  );
  if (subResult.rows.length === 0) {
    return res.status(404).json({ success: false, message: "Pending subscription not found (already handled?)." });
  }
  const sub = subResult.rows[0];

  /* Period runs one month from approval */
  const expiresAt = new Date();
  expiresAt.setMonth(expiresAt.getMonth() + 1);

  const updated = await query(
    `UPDATE subscriptions
     SET status = 'active', approved_by = $1, approved_at = NOW(),
         started_at = NOW(), expires_at = $2
     WHERE id = $3 AND status = 'pending'
     RETURNING *`,
    [req.user.id, expiresAt, req.params.id]
  );
  if (updated.rows.length === 0) {
    return res.status(409).json({ success: false, message: "Subscription was already handled by someone else." });
  }

  /* Supersede any previous active subscription rows for this user */
  await query(
    `UPDATE subscriptions SET status = 'expired'
     WHERE user_id = $1 AND status = 'active' AND id <> $2`,
    [sub.user_id, req.params.id]
  );

  /* NOW the plan actually changes */
  await query(
    `UPDATE users SET plan = $1, plan_started_at = NOW(), plan_expires_at = $2 WHERE id = $3`,
    [sub.plan, expiresAt, sub.user_id]
  );

  await sendNotification(
    sub.user_id,
    "plan_approved",
    "Plan upgraded! 💳",
    `Payment verified — you're now on the ${sub.plan.charAt(0).toUpperCase() + sub.plan.slice(1)} plan until ${expiresAt.toLocaleDateString("en-ZA", { day: "numeric", month: "short", year: "numeric" })}.`,
    { subscription_id: sub.id }
  );

  /* Invoice email — lights up when utils/email.js (Task C1) exists */
  try {
    const email = require("../utils/email");
    if (email && email.sendEmail && email.boostInvoiceEmail) {
      const vendor = (await query("SELECT full_name, email FROM users WHERE id = $1", [sub.user_id])).rows[0];
      if (vendor) {
        const { subject, html } = email.boostInvoiceEmail({
          vendorName:    vendor.full_name,
          storeName:     "Maizu subscription",
          planName:      `${sub.plan.charAt(0).toUpperCase() + sub.plan.slice(1)} plan (1 month)`,
          amount:        sub.amount_paid,
          receiptNumber: "MZU-SUB-" + sub.id.slice(0, 8).toUpperCase(),
          paymentMethod: sub.payment_method || "EFT",
          date:          new Date().toLocaleDateString("en-ZA"),
        });
        await email.sendEmail({ to: vendor.email, subject, html });
      }
    }
  } catch { /* email module not built yet — expected until Task C1 merges */ }

  res.status(200).json({ success: true, subscription: updated.rows[0] });
};

/* ── REJECT ── PUT /api/admin/subscriptions/:id/reject ──────── */
const rejectSubscription = async (req, res) => {
  const { reason } = req.body;
  if (!reason || String(reason).trim().length < 3) {
    return res.status(400).json({ success: false, message: "A rejection reason is required — the vendor will see it." });
  }

  const updated = await query(
    `UPDATE subscriptions
     SET status = 'rejected', rejected_reason = $1, approved_by = $2, approved_at = NOW()
     WHERE id = $3 AND status = 'pending'
     RETURNING *`,
    [String(reason).trim(), req.user.id, req.params.id]
  );
  if (updated.rows.length === 0) {
    return res.status(404).json({ success: false, message: "Pending subscription not found (already handled?)." });
  }
  const sub = updated.rows[0];

  await sendNotification(
    sub.user_id,
    "plan_rejected",
    "Plan payment issue ⚠️",
    `We couldn't verify your upgrade payment: ${String(reason).trim()}. Your current plan is unchanged — please check your reference and resubmit.`,
    { subscription_id: sub.id }
  );

  res.status(200).json({ success: true, subscription: sub });
};

module.exports = {
  getDashboardStats,
  getUsers, updateUserRole, deleteUser,
  getStores, toggleStoreActive, toggleStoreTrending, adminDeleteStore,
  getAllOrders, adminUpdateOrderStatus,
  getBoosts, approveBoost, rejectBoost,
  getSubscriptions, approveSubscription, rejectSubscription,
};

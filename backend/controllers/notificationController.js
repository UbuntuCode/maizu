const { query } = require("../config/db");

/* ── GET MY NOTIFICATIONS ── GET /api/notifications ─────────── */
const getNotifications = async (req, res) => {
  const { limit = 30 } = req.query;

  const result = await query(
    `SELECT * FROM notifications
     WHERE user_id = $1
     ORDER BY created_at DESC
     LIMIT $2`,
    [req.user.id, Number(limit)]
  );

  const unreadCount = result.rows.filter(n => !n.is_read).length;

  res.status(200).json({
    success:      true,
    notifications: result.rows,
    unread_count: unreadCount,
  });
};

/* ── MARK AS READ ── PUT /api/notifications/:id/read ─────────── */
const markAsRead = async (req, res) => {
  await query(
    "UPDATE notifications SET is_read = true WHERE id = $1 AND user_id = $2",
    [req.params.id, req.user.id]
  );
  res.status(200).json({ success: true });
};

/* ── MARK ALL AS READ ── PUT /api/notifications/read-all ─────── */
const markAllAsRead = async (req, res) => {
  await query(
    "UPDATE notifications SET is_read = true WHERE user_id = $1",
    [req.user.id]
  );
  res.status(200).json({ success: true });
};

/* ── DELETE NOTIFICATION ── DELETE /api/notifications/:id ────── */
const deleteNotification = async (req, res) => {
  await query(
    "DELETE FROM notifications WHERE id = $1 AND user_id = $2",
    [req.params.id, req.user.id]
  );
  res.status(200).json({ success: true });
};

/* ── CLEAR ALL ── DELETE /api/notifications ─────────────────── */
const clearAll = async (req, res) => {
  await query(
    "DELETE FROM notifications WHERE user_id = $1",
    [req.user.id]
  );
  res.status(200).json({ success: true });
};

/* ── SEND NOTIFICATION (internal helper) ─────────────────────── */
/* Called from orderController when order status changes */
const sendNotification = async (userId, type, title, body, data = {}) => {
  try {
    await query(
      `INSERT INTO notifications (user_id, type, title, body, data)
       VALUES ($1, $2, $3, $4, $5)`,
      [userId, type, title, body, JSON.stringify(data)]
    );
  } catch (err) {
    console.error("Failed to send notification:", err.message);
  }
};

module.exports = {
  getNotifications,
  markAsRead,
  markAllAsRead,
  deleteNotification,
  clearAll,
  sendNotification,
};

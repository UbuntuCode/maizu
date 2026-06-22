const { query }              = require("../config/db");
const { uploadToCloudinary } = require("../config/cloudinary");

/* ── GET ALL STORES ── GET /api/vendors ─────────────────────── */
const getAllStores = async (req, res) => {
  const { category, search, limit = 20, offset = 0 } = req.query;

  let sql    = `SELECT s.*, u.full_name AS owner_name FROM stores s JOIN users u ON s.owner_id = u.id WHERE s.is_active = true`;
  const params = [];

  if (category && category !== "All") {
    params.push(category);
    sql += ` AND s.category = $${params.length}`;
  }
  if (search) {
    params.push(`%${search}%`);
    sql += ` AND s.name ILIKE $${params.length}`;
  }

  sql += ` ORDER BY s.is_trending DESC, s.rating DESC`;
  params.push(Number(limit));
  sql += ` LIMIT $${params.length}`;
  params.push(Number(offset));
  sql += ` OFFSET $${params.length}`;

  const result = await query(sql, params);
  res.status(200).json({ success: true, stores: result.rows, count: result.rows.length });
};

/* ── GET SINGLE STORE ── GET /api/vendors/:id ───────────────── */
const getStore = async (req, res) => {
  const result = await query(
    `SELECT s.*, u.full_name AS owner_name, u.email AS owner_email
     FROM stores s JOIN users u ON s.owner_id = u.id
     WHERE s.id = $1`,
    [req.params.id]
  );

  if (result.rows.length === 0) {
    return res.status(404).json({ success: false, message: "Store not found." });
  }

  res.status(200).json({ success: true, store: result.rows[0] });
};

/* ── GET MY STORES ── GET /api/vendors/my/stores ────────────── */
const getMyStores = async (req, res) => {
  const result = await query(
    "SELECT * FROM stores WHERE owner_id = $1 ORDER BY created_at DESC",
    [req.user.id]
  );
  res.status(200).json({ success: true, stores: result.rows });
};

/* ── BECOME A VENDOR ── PUT /api/vendors/become-vendor ──────── */
/* Upgrades a buyer's role to vendor instantly, with no store
   required yet. This is what /app/become-vendor/page.tsx calls
   before sending the user to the store creation form.
   NOTE: createStore() below also auto-upgrades on first store —
   this endpoint exists so the role can flip BEFORE a store exists,
   e.g. to unlock vendor-only UI immediately after tapping
   "Become a Vendor". */
const becomeVendor = async (req, res) => {
  try {
    const result = await query(
      "UPDATE users SET role = 'vendor' WHERE id = $1 RETURNING id, full_name, email, role",
      [req.user.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, message: "User not found." });
    }

    res.status(200).json({ success: true, user: result.rows[0], message: "You are now a vendor!" });
  } catch (err) {
    console.error("Become vendor error:", err.message);
    res.status(500).json({ success: false, message: "Failed to update your account." });
  }
};

/* ── CREATE STORE ── POST /api/vendors ──────────────────────── */
const createStore = async (req, res) => {
  const { name, description, category, floor_location } = req.body;

  if (!name || !category) {
    return res.status(400).json({ success: false, message: "Name and category required." });
  }

  let logo_url   = null;
  let banner_url = null;

  if (req.files?.logo?.[0]) {
    const up = await uploadToCloudinary(req.files.logo[0].buffer, "maizu/logos");
    logo_url = up.url;
  }
  if (req.files?.banner?.[0]) {
    const up = await uploadToCloudinary(req.files.banner[0].buffer, "maizu/banners");
    banner_url = up.url;
  }

  const result = await query(
    `INSERT INTO stores (owner_id, name, description, category, floor_location, logo_url, banner_url)
     VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *`,
    [req.user.id, name.trim(), description, category, floor_location, logo_url, banner_url]
  );

  /* Auto-upgrade user to vendor when they create their first store
     (kept as a safety net even though /become-vendor already does this) */
  await query(
    "UPDATE users SET role = 'vendor' WHERE id = $1 AND role = 'buyer'",
    [req.user.id]
  );

  res.status(201).json({ success: true, store: result.rows[0] });
};

/* ── UPDATE STORE ── PUT /api/vendors/:id ───────────────────── */
const updateStore = async (req, res) => {
  const { id } = req.params;
  const { name, description, category, floor_location } = req.body;

  const check = await query("SELECT owner_id FROM stores WHERE id = $1", [id]);
  if (check.rows.length === 0) return res.status(404).json({ success: false, message: "Store not found." });
  if (check.rows[0].owner_id !== req.user.id) return res.status(403).json({ success: false, message: "Not authorised." });

  const result = await query(
    `UPDATE stores
     SET name           = COALESCE($1, name),
         description    = COALESCE($2, description),
         category       = COALESCE($3, category),
         floor_location = COALESCE($4, floor_location),
         updated_at     = NOW()
     WHERE id = $5 RETURNING *`,
    [name, description, category, floor_location, id]
  );

  res.status(200).json({ success: true, store: result.rows[0] });
};

/* ── DELETE STORE ── DELETE /api/vendors/:id ────────────────── */
const deleteStore = async (req, res) => {
  const check = await query("SELECT owner_id FROM stores WHERE id = $1", [req.params.id]);
  if (check.rows.length === 0) return res.status(404).json({ success: false, message: "Store not found." });
  if (check.rows[0].owner_id !== req.user.id) return res.status(403).json({ success: false, message: "Not authorised." });

  await query("DELETE FROM stores WHERE id = $1", [req.params.id]);
  res.status(200).json({ success: true, message: "Store deleted." });
};

/* ── FOLLOW / UNFOLLOW ── POST /api/vendors/:id/follow ─────── */
const followStore = async (req, res) => {
  const { id }   = req.params;
  const userId   = req.user.id;

  const existing = await query(
    "SELECT id FROM store_followers WHERE store_id = $1 AND user_id = $2",
    [id, userId]
  );

  if (existing.rows.length > 0) {
    await query("DELETE FROM store_followers WHERE store_id = $1 AND user_id = $2", [id, userId]);
    await query("UPDATE stores SET follower_count = follower_count - 1 WHERE id = $1", [id]);
    return res.status(200).json({ success: true, following: false });
  }

  await query(
    "INSERT INTO store_followers (store_id, user_id) VALUES ($1, $2)",
    [id, userId]
  );
  await query("UPDATE stores SET follower_count = follower_count + 1 WHERE id = $1", [id]);
  res.status(200).json({ success: true, following: true });
};

module.exports = {
  getAllStores,
  getStore,
  getMyStores,
  becomeVendor,
  createStore,
  updateStore,
  deleteStore,
  followStore,
};

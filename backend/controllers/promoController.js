const { query } = require("../config/db");

/* ── VALIDATE PROMO ── POST /api/promos/validate ────────────── */
const validatePromo = async (req, res) => {
  const { code, order_total, store_id } = req.body;

  if (!code?.trim()) {
    return res.status(400).json({ success: false, message: "Please enter a promo code." });
  }

  const result = await query(
    `SELECT * FROM promo_codes
     WHERE UPPER(code) = UPPER($1)
       AND is_active = true`,
    [code.trim()]
  );

  if (result.rows.length === 0) {
    return res.status(404).json({ success: false, message: "Invalid promo code. Please check and try again." });
  }

  const promo = result.rows[0];

  /* Check expiry */
  if (promo.expires_at && new Date(promo.expires_at) < new Date()) {
    return res.status(400).json({ success: false, message: "This promo code has expired." });
  }

  /* Check max uses */
  if (promo.max_uses && promo.uses_count >= promo.max_uses) {
    return res.status(400).json({ success: false, message: "This promo code has reached its usage limit." });
  }

  /* Check minimum order amount */
  if (promo.min_order_amount && Number(order_total) < Number(promo.min_order_amount)) {
    return res.status(400).json({
      success: false,
      message: `Minimum order of R${Number(promo.min_order_amount).toFixed(2)} required for this code.`,
    });
  }

  /* Check if buyer already used this promo */
  const alreadyUsed = await query(
    `SELECT id FROM promo_code_uses
     WHERE promo_id = $1 AND buyer_id = $2`,
    [promo.id, req.user.id]
  );
  if (alreadyUsed.rows.length > 0) {
    return res.status(400).json({ success: false, message: "You have already used this promo code." });
  }

  /* Calculate discount */
  const orderTotal    = Number(order_total) || 0;
  let   discountAmount = 0;

  if (promo.discount_type === "percent") {
    discountAmount = (orderTotal * Number(promo.discount_value)) / 100;
  } else {
    discountAmount = Math.min(Number(promo.discount_value), orderTotal);
  }

  discountAmount = Math.round(discountAmount * 100) / 100;

  res.status(200).json({
    success:   true,
    valid:     true,
    promo: {
      id:              promo.id,
      code:            promo.code,
      description:     promo.description,
      discount_type:   promo.discount_type,
      discount_value:  Number(promo.discount_value),
      discount_amount: discountAmount,
      final_total:     Math.max(0, orderTotal - discountAmount),
    },
  });
};

/* ── CREATE PROMO ── POST /api/promos ───────────────────────── */
const createPromo = async (req, res) => {
  const {
    store_id, code, description,
    discount_type, discount_value,
    min_order_amount, max_uses, expires_at,
  } = req.body;

  const vendorId = req.user.id;

  if (!code?.trim() || !discount_type || !discount_value) {
    return res.status(400).json({ success: false, message: "Code, discount type and value are required." });
  }

  if (!["percent", "fixed"].includes(discount_type)) {
    return res.status(400).json({ success: false, message: "Discount type must be percent or fixed." });
  }

  if (discount_type === "percent" && Number(discount_value) > 100) {
    return res.status(400).json({ success: false, message: "Percentage discount cannot exceed 100%." });
  }

  /* Check code is unique */
  const existing = await query(
    "SELECT id FROM promo_codes WHERE UPPER(code) = UPPER($1)",
    [code.trim()]
  );
  if (existing.rows.length > 0) {
    return res.status(409).json({ success: false, message: "That promo code already exists. Choose a different code." });
  }

  const result = await query(
    `INSERT INTO promo_codes
       (vendor_id, store_id, code, description, discount_type, discount_value, min_order_amount, max_uses, expires_at)
     VALUES ($1, $2, UPPER($3), $4, $5, $6, $7, $8, $9)
     RETURNING *`,
    [
      vendorId,
      store_id || null,
      code.trim(),
      description || null,
      discount_type,
      discount_value,
      min_order_amount || 0,
      max_uses || null,
      expires_at || null,
    ]
  );

  res.status(201).json({ success: true, promo: result.rows[0] });
};

/* ── GET MY PROMOS ── GET /api/promos/my ────────────────────── */
const getMyPromos = async (req, res) => {
  const result = await query(
    `SELECT p.*, s.name AS store_name
     FROM promo_codes p
     LEFT JOIN stores s ON p.store_id = s.id
     WHERE p.vendor_id = $1
     ORDER BY p.created_at DESC`,
    [req.user.id]
  );

  res.status(200).json({ success: true, promos: result.rows });
};

/* ── TOGGLE PROMO ── PUT /api/promos/:id/toggle ─────────────── */
const togglePromo = async (req, res) => {
  const { id } = req.params;

  const check = await query(
    "SELECT vendor_id, is_active FROM promo_codes WHERE id = $1",
    [id]
  );
  if (check.rows.length === 0) return res.status(404).json({ success: false, message: "Promo not found." });
  if (check.rows[0].vendor_id !== req.user.id) return res.status(403).json({ success: false, message: "Not authorised." });

  const result = await query(
    "UPDATE promo_codes SET is_active = NOT is_active WHERE id = $1 RETURNING *",
    [id]
  );

  res.status(200).json({ success: true, promo: result.rows[0] });
};

/* ── DELETE PROMO ── DELETE /api/promos/:id ─────────────────── */
const deletePromo = async (req, res) => {
  const check = await query(
    "SELECT vendor_id FROM promo_codes WHERE id = $1",
    [req.params.id]
  );
  if (check.rows.length === 0) return res.status(404).json({ success: false, message: "Promo not found." });
  if (check.rows[0].vendor_id !== req.user.id) return res.status(403).json({ success: false, message: "Not authorised." });

  await query("DELETE FROM promo_codes WHERE id = $1", [req.params.id]);
  res.status(200).json({ success: true, message: "Promo code deleted." });
};

module.exports = { validatePromo, createPromo, getMyPromos, togglePromo, deletePromo };

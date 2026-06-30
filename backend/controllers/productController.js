const { query }              = require("../config/db");
const { uploadToCloudinary } = require("../config/cloudinary");
const { sendNotification }   = require("./notificationController");

/* ── GET ALL PRODUCTS ── GET /api/products ──────────────────── */
const getAllProducts = async (req, res) => {
  const { store_id, category, search, limit = 20, offset = 0 } = req.query;

  let sql    = `SELECT p.*, s.name AS store_name FROM products p JOIN stores s ON p.store_id = s.id WHERE p.is_active = true`;
  const params = [];

  if (store_id) { params.push(store_id); sql += ` AND p.store_id = $${params.length}`; }
  if (category) { params.push(category); sql += ` AND p.category = $${params.length}`; }
  if (search)   { params.push(`%${search}%`); sql += ` AND p.name ILIKE $${params.length}`; }

  params.push(Number(limit));  sql += ` LIMIT $${params.length}`;
  params.push(Number(offset)); sql += ` OFFSET $${params.length}`;

  const result = await query(sql, params);
  res.status(200).json({ success: true, products: result.rows, count: result.rows.length });
};

/* ── GET SINGLE PRODUCT ── GET /api/products/:id ─────────────── */
const getProduct = async (req, res) => {
  const result = await query(
    `SELECT p.*, s.name AS store_name FROM products p JOIN stores s ON p.store_id = s.id WHERE p.id = $1`,
    [req.params.id]
  );

  if (result.rows.length === 0) {
    return res.status(404).json({ success: false, message: "Product not found." });
  }

  await query("UPDATE products SET view_count = view_count + 1 WHERE id = $1", [req.params.id]);
  res.status(200).json({ success: true, product: result.rows[0] });
};

/* ── CREATE PRODUCT ── POST /api/products ────────────────────── */
const createProduct = async (req, res) => {
  const { store_id, name, description, price, category, stock_quantity = 0 } = req.body;

  if (!store_id || !name || !price) {
    return res.status(400).json({ success: false, message: "store_id, name and price required." });
  }

  const storeCheck = await query("SELECT owner_id, name FROM stores WHERE id = $1", [store_id]);
  if (storeCheck.rows.length === 0) return res.status(404).json({ success: false, message: "Store not found." });
  if (storeCheck.rows[0].owner_id !== req.user.id) return res.status(403).json({ success: false, message: "Not authorised." });

  const imageUrls = [];
  if (req.files && req.files.length > 0) {
    for (const file of req.files) {
      const up = await uploadToCloudinary(file.buffer, "maizu/products");
      imageUrls.push(up.url);
    }
  }

  const result = await query(
    `INSERT INTO products (store_id, name, description, price, category, stock_quantity, image_urls)
     VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *`,
    [store_id, name.trim(), description, Number(price), category, Number(stock_quantity), JSON.stringify(imageUrls)]
  );

  await query("UPDATE stores SET product_count = product_count + 1 WHERE id = $1", [store_id]);

  /* ── Notify vendor: product is live ── */
  await sendNotification(
    req.user.id,
    "product_published",
    "Product published! 🛍️",
    "\"" + name.trim() + "\" is now live in " + storeCheck.rows[0].name + ".",
    { product_id: result.rows[0].id, store_id }
  );

  res.status(201).json({ success: true, product: result.rows[0] });
};

/* ── UPDATE PRODUCT ── PUT /api/products/:id ──────────────────── */
const updateProduct = async (req, res) => {
  const { id } = req.params;
  const { name, description, price, category, stock_quantity, is_active } = req.body;

  const check = await query(
    `SELECT p.id, s.owner_id FROM products p JOIN stores s ON p.store_id = s.id WHERE p.id = $1`,
    [id]
  );
  if (check.rows.length === 0) return res.status(404).json({ success: false, message: "Product not found." });
  if (check.rows[0].owner_id !== req.user.id) return res.status(403).json({ success: false, message: "Not authorised." });

  const result = await query(
    `UPDATE products
     SET name           = COALESCE($1, name),
         description    = COALESCE($2, description),
         price          = COALESCE($3, price),
         category       = COALESCE($4, category),
         stock_quantity = COALESCE($5, stock_quantity),
         is_active      = COALESCE($6, is_active),
         updated_at     = NOW()
     WHERE id = $7 RETURNING *`,
    [name, description, price ? Number(price) : null, category,
     stock_quantity ? Number(stock_quantity) : null, is_active, id]
  );

  res.status(200).json({ success: true, product: result.rows[0] });
};

/* ── DELETE PRODUCT ── DELETE /api/products/:id ────────────────── */
const deleteProduct = async (req, res) => {
  const check = await query(
    `SELECT p.store_id, s.owner_id FROM products p JOIN stores s ON p.store_id = s.id WHERE p.id = $1`,
    [req.params.id]
  );
  if (check.rows.length === 0) return res.status(404).json({ success: false, message: "Product not found." });
  if (check.rows[0].owner_id !== req.user.id) return res.status(403).json({ success: false, message: "Not authorised." });

  await query("DELETE FROM products WHERE id = $1", [req.params.id]);
  await query("UPDATE stores SET product_count = product_count - 1 WHERE id = $1", [check.rows[0].store_id]);
  res.status(200).json({ success: true, message: "Product deleted." });
};

/* ── LIKE / UNLIKE ── POST /api/products/:id/like ─────────────────── */
const likeProduct = async (req, res) => {
  const { id } = req.params;
  const userId = req.user.id;

  const existing = await query(
    "SELECT id FROM product_likes WHERE product_id = $1 AND user_id = $2",
    [id, userId]
  );

  if (existing.rows.length > 0) {
    await query("DELETE FROM product_likes WHERE product_id = $1 AND user_id = $2", [id, userId]);
    await query("UPDATE products SET like_count = like_count - 1 WHERE id = $1", [id]);
    return res.status(200).json({ success: true, liked: false });
  }

  await query("INSERT INTO product_likes (product_id, user_id) VALUES ($1, $2)", [id, userId]);
  await query("UPDATE products SET like_count = like_count + 1 WHERE id = $1", [id]);

  /* ── Notify vendor: someone liked their product (skip if liking own product) ── */
  const productInfo = await query(
    `SELECT p.name, s.owner_id FROM products p JOIN stores s ON p.store_id = s.id WHERE p.id = $1`,
    [id]
  );
  if (productInfo.rows.length > 0) {
    const ownerId = productInfo.rows[0].owner_id;
    if (ownerId !== userId) {
      await sendNotification(
        ownerId,
        "product_liked",
        "Someone liked your product! ❤️",
        "\"" + productInfo.rows[0].name + "\" just got a new like.",
        { product_id: id }
      );
    }
  }

  res.status(200).json({ success: true, liked: true });
};

module.exports = { getAllProducts, getProduct, createProduct, updateProduct, deleteProduct, likeProduct };
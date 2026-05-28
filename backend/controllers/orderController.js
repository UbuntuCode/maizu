const { query } = require("../config/db");

/* ── PLACE ORDER ── POST /api/orders ────────────────────────── */
const placeOrder = async (req, res) => {
  const { items, delivery_address, notes } = req.body;
  const buyer_id = req.user.id;

  if (!items || items.length === 0) {
    return res.status(400).json({ success: false, message: "At least one item required." });
  }
  if (!delivery_address) {
    return res.status(400).json({ success: false, message: "Delivery address required." });
  }

  let total_amount = 0;
  const orderItems = [];

  for (const item of items) {
    const prod = await query(
      "SELECT id, name, price, stock_quantity, store_id FROM products WHERE id = $1 AND is_active = true",
      [item.product_id]
    );
    if (prod.rows.length === 0) {
      return res.status(404).json({ success: false, message: `Product ${item.product_id} not found.` });
    }
    const p = prod.rows[0];
    if (p.stock_quantity < item.quantity) {
      return res.status(400).json({ success: false, message: `Insufficient stock for "${p.name}".` });
    }
    const subtotal = p.price * item.quantity;
    total_amount += subtotal;
    orderItems.push({ ...p, quantity: item.quantity, subtotal });
  }

  const order = await query(
    `INSERT INTO orders (buyer_id, total_amount, delivery_address, notes, status)
     VALUES ($1, $2, $3, $4, 'pending') RETURNING *`,
    [buyer_id, total_amount, delivery_address, notes]
  );
  const orderId = order.rows[0].id;

  for (const item of orderItems) {
    await query(
      `INSERT INTO order_items (order_id, product_id, product_name, store_id, quantity, unit_price, subtotal)
       VALUES ($1, $2, $3, $4, $5, $6, $7)`,
      [orderId, item.id, item.name, item.store_id, item.quantity, item.price, item.subtotal]
    );
    await query(
      "UPDATE products SET stock_quantity = stock_quantity - $1 WHERE id = $2",
      [item.quantity, item.id]
    );
  }

  res.status(201).json({ success: true, order: order.rows[0] });
};

/* ── GET MY ORDERS ── GET /api/orders/my-orders ─────────────── */
const getMyOrders = async (req, res) => {
  const result = await query(
    `SELECT o.* FROM orders o WHERE o.buyer_id = $1 ORDER BY o.created_at DESC`,
    [req.user.id]
  );
  res.status(200).json({ success: true, orders: result.rows });
};

/* ── GET SINGLE ORDER ── GET /api/orders/:id ────────────────── */
const getOrder = async (req, res) => {
  const result = await query("SELECT * FROM orders WHERE id = $1", [req.params.id]);

  if (result.rows.length === 0) {
    return res.status(404).json({ success: false, message: "Order not found." });
  }

  const order = result.rows[0];
  if (order.buyer_id !== req.user.id && req.user.role !== "admin") {
    return res.status(403).json({ success: false, message: "Not authorised." });
  }

  res.status(200).json({ success: true, order });
};

/* ── UPDATE ORDER STATUS ── PUT /api/orders/:id/status ─────── */
const updateOrderStatus = async (req, res) => {
  const { status } = req.body;
  const valid = ["confirmed", "shipped", "delivered", "cancelled"];

  if (!valid.includes(status)) {
    return res.status(400).json({ success: false, message: `Status must be: ${valid.join(", ")}` });
  }

  const result = await query(
    "UPDATE orders SET status = $1, updated_at = NOW() WHERE id = $2 RETURNING *",
    [status, req.params.id]
  );

  if (result.rows.length === 0) {
    return res.status(404).json({ success: false, message: "Order not found." });
  }

  res.status(200).json({ success: true, order: result.rows[0] });
};

module.exports = { placeOrder, getMyOrders, getOrder, updateOrderStatus };

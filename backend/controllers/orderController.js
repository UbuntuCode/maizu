const { query }            = require("../config/db");
const { sendNotification } = require("./notificationController");

/* ── PLACE ORDER ── POST /api/orders ────────────────────────── */
const placeOrder = async (req, res) => {
  const { items, delivery_address, notes, promo_id, discount_amount, payment_method } = req.body;
  const buyer_id = req.user.id;

  if (!items || items.length === 0) {
    return res.status(400).json({ success: false, message: "No items provided." });
  }

  try {
    /* Calculate total */
    var total_amount = 0;
    var orderItems   = [];

    for (var i = 0; i < items.length; i++) {
      var item = items[i];
      var prod = await query(
        "SELECT id, name, price, stock_quantity, store_id FROM products WHERE id = $1 AND is_active = true",
        [item.product_id]
      );
      if (prod.rows.length === 0) {
        return res.status(404).json({ success: false, message: "Product not found: " + item.product_id });
      }
      var p       = prod.rows[0];
      var qty     = Number(item.quantity);
      var subtotal = Number(p.price) * qty;
      total_amount += subtotal;
      orderItems.push({ id: p.id, name: p.name, price: p.price, store_id: p.store_id, quantity: qty, subtotal });
    }

    /* Apply discount */
    var finalDiscount = Number(discount_amount) || 0;
    var finalTotal    = Math.max(0, total_amount - finalDiscount) * 1.05; // + 5% service fee

    /* Create order */
    var orderResult = await query(
      `INSERT INTO orders (buyer_id, total_amount, delivery_address, notes, status)
       VALUES ($1, $2, $3, $4, 'pending') RETURNING *`,
      [buyer_id, finalTotal, delivery_address, notes || ""]
    );
    var order = orderResult.rows[0];

    /* Create order items */
    var storeIds = new Set();
    for (var j = 0; j < orderItems.length; j++) {
      var oi = orderItems[j];
      await query(
        `INSERT INTO order_items (order_id, product_id, product_name, store_id, quantity, unit_price, subtotal)
         VALUES ($1, $2, $3, $4, $5, $6, $7)`,
        [order.id, oi.id, oi.name, oi.store_id, oi.quantity, oi.price, oi.subtotal]
      );
      storeIds.add(oi.store_id);
    }

    /* Record promo use */
    if (promo_id) {
      try {
        await query(
          `INSERT INTO promo_code_uses (promo_id, order_id, buyer_id, discount_amount)
           VALUES ($1, $2, $3, $4)`,
          [promo_id, order.id, buyer_id, finalDiscount]
        );
        await query(
          "UPDATE promo_codes SET uses_count = uses_count + 1 WHERE id = $1",
          [promo_id]
        );
      } catch (e) { /* silent — promo tracking not critical */ }
    }

    /* ── Notify buyer ── */
    await sendNotification(
      buyer_id,
      "order_placed",
      "Order placed! 🎉",
      "Your order #" + order.id.slice(0, 8).toUpperCase() + " has been received. The vendor will confirm shortly.",
      { order_id: order.id }
    );

    /* ── Notify vendors ── */
    for (var storeId of storeIds) {
      var storeResult = await query(
        "SELECT owner_id, name FROM stores WHERE id = $1",
        [storeId]
      );
      if (storeResult.rows.length > 0) {
        var store = storeResult.rows[0];
        await sendNotification(
          store.owner_id,
          "new_order",
          "New order received! 📦",
          "You have a new order #" + order.id.slice(0, 8).toUpperCase() + " at " + store.name + ". R" + finalTotal.toFixed(2),
          { order_id: order.id, store_id: storeId }
        );
      }
    }

    res.status(201).json({ success: true, order });

  } catch (err) {
    console.error("Place order error:", err.message);
    res.status(500).json({ success: false, message: "Failed to place order." });
  }
};

/* ── GET MY ORDERS ── GET /api/orders/my-orders ─────────────── */
const getMyOrders = async (req, res) => {
  const result = await query(
    "SELECT * FROM orders WHERE buyer_id = $1 ORDER BY created_at DESC",
    [req.user.id]
  );
  res.status(200).json({ success: true, orders: result.rows });
};

/* ── GET ONE ORDER ── GET /api/orders/:id ───────────────────── */
const getOrder = async (req, res) => {
  const result = await query(
    `SELECT o.*, u.full_name AS buyer_name, u.email AS buyer_email
     FROM orders o
     JOIN users u ON o.buyer_id = u.id
     WHERE o.id = $1`,
    [req.params.id]
  );
  if (result.rows.length === 0) {
    return res.status(404).json({ success: false, message: "Order not found." });
  }
  res.status(200).json({ success: true, order: result.rows[0] });
};

/* ── UPDATE ORDER STATUS ── PUT /api/orders/:id/status ──────── */
const updateOrderStatus = async (req, res) => {
  const { status } = req.body;
  const { id }     = req.params;

  const valid = ["pending", "confirmed", "shipped", "delivered", "cancelled"];
  if (!valid.includes(status)) {
    return res.status(400).json({ success: false, message: "Invalid status." });
  }

  const result = await query(
    "UPDATE orders SET status = $1, updated_at = NOW() WHERE id = $2 RETURNING *",
    [status, id]
  );

  if (result.rows.length === 0) {
    return res.status(404).json({ success: false, message: "Order not found." });
  }

  var order = result.rows[0];

  /* ── Notify buyer of status change ── */
  var messages = {
    confirmed: { title: "Order confirmed! ✅", body: "Your order #" + id.slice(0, 8).toUpperCase() + " has been confirmed and is being prepared." },
    shipped:   { title: "Order on the way! 🚚", body: "Your order #" + id.slice(0, 8).toUpperCase() + " has been shipped and is on its way to you." },
    delivered: { title: "Order delivered! 🎉", body: "Your order #" + id.slice(0, 8).toUpperCase() + " has been delivered. Enjoy your purchase!" },
    cancelled: { title: "Order cancelled ❌", body: "Your order #" + id.slice(0, 8).toUpperCase() + " has been cancelled." },
  };

  if (messages[status]) {
    await sendNotification(
      order.buyer_id,
      "order_" + status,
      messages[status].title,
      messages[status].body,
      { order_id: id }
    );
  }

  res.status(200).json({ success: true, order });
};

/* ── GET STORE ORDERS ── GET /api/orders/store/:storeId ─────── */
const getStoreOrders = async (req, res) => {
  const { storeId } = req.params;

  const result = await query(
    `SELECT DISTINCT o.*, u.full_name AS buyer_name, u.email AS buyer_email
     FROM orders o
     JOIN order_items oi ON o.id = oi.order_id
     JOIN users u ON o.buyer_id = u.id
     WHERE oi.store_id = $1
     ORDER BY o.created_at DESC`,
    [storeId]
  );

  res.status(200).json({ success: true, orders: result.rows });
};

module.exports = {
  placeOrder,
  getMyOrders,
  getOrder,
  updateOrderStatus,
  getStoreOrders,
};

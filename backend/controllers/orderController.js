const { query } = require("../config/db");
const { sendNotification } = require("./notificationController");

/* ══════════════════════════════════════════════════════════════
   PLACE ORDER ── POST /api/orders
   SECURITY (P17 fix):
   - ALL prices come from the products table. Client-sent amounts,
     including any `discount_amount` in the body, are IGNORED.
   - Stock is validated AND decremented atomically per item; on any
     shortfall, prior decrements are compensated and the buyer gets
     a clean 409 naming the sold-out product.
   - Promos are validated AND consumed server-side in one atomic
     UPDATE (active + not expired + under max_uses + min order met).
   - Service fee: 5% on (subtotal - discount) — must match checkout.
══════════════════════════════════════════════════════════════ */
const SERVICE_FEE_MULTIPLIER = 1.05;

const placeOrder = async (req, res) => {
  const { items, delivery_address, notes, promo_id } = req.body;
  const buyerId = req.user.id;

  /* ── Input validation ── */
  if (!Array.isArray(items) || items.length === 0) {
    return res.status(400).json({ success: false, message: "Your cart is empty." });
  }
  if (items.length > 50) {
    return res.status(400).json({ success: false, message: "Too many items in one order." });
  }
  if (!delivery_address || String(delivery_address).trim().length < 5) {
    return res.status(400).json({ success: false, message: "A delivery address is required." });
  }
  for (const it of items) {
    const qty = Number(it.quantity);
    if (!it.product_id || !Number.isInteger(qty) || qty < 1 || qty > 99) {
      return res.status(400).json({ success: false, message: "Invalid item quantity." });
    }
  }

  /* Track side effects so we can compensate on failure */
  const decremented = [];   // [{ product_id, quantity }]
  let promoConsumed = null; // promo id if we incremented uses_count

  const compensate = async () => {
    for (const d of decremented) {
      try {
        await query(
          "UPDATE products SET stock_quantity = stock_quantity + $1 WHERE id = $2",
          [d.quantity, d.product_id]
        );
      } catch (e) { console.error("Stock compensation failed:", d.product_id, e.message); }
    }
    if (promoConsumed) {
      try {
        await query(
          "UPDATE promo_codes SET uses_count = GREATEST(uses_count - 1, 0) WHERE id = $1",
          [promoConsumed]
        );
      } catch (e) { console.error("Promo compensation failed:", promoConsumed, e.message); }
    }
  };

  try {
    /* ── 1. Load products; compute prices SERVER-SIDE ── */
    const orderItems = [];
    const storeIds   = new Set();
    let subtotal     = 0;

    for (const it of items) {
      const qty = Number(it.quantity);
      const productResult = await query(
        "SELECT id, name, price, stock_quantity, store_id, is_active FROM products WHERE id = $1",
        [it.product_id]
      );
      if (productResult.rows.length === 0 || !productResult.rows[0].is_active) {
        return res.status(400).json({ success: false, message: "One of the products is no longer available." });
      }
      const p = productResult.rows[0];

      const unitPrice    = Number(p.price);
      const lineSubtotal = Math.round(unitPrice * qty * 100) / 100;

      orderItems.push({
        product_id:   p.id,
        product_name: p.name,
        store_id:     p.store_id,
        quantity:     qty,
        unit_price:   unitPrice,
        subtotal:     lineSubtotal,
      });
      if (p.store_id) storeIds.add(p.store_id);
      subtotal += lineSubtotal;
    }
    subtotal = Math.round(subtotal * 100) / 100;

    /* ── 2. Atomically decrement stock per item ── */
    for (const oi of orderItems) {
      const dec = await query(
        `UPDATE products
         SET stock_quantity = stock_quantity - $1
         WHERE id = $2 AND stock_quantity >= $1
         RETURNING id`,
        [oi.quantity, oi.product_id]
      );
      if (dec.rows.length === 0) {
        await compensate();
        return res.status(409).json({
          success: false,
          message: `"${oi.product_name}" just sold out (or has less stock than you ordered). Please update your cart.`,
        });
      }
      decremented.push({ product_id: oi.product_id, quantity: oi.quantity });
    }

    /* ── 3. Promo: validate AND consume in ONE atomic statement ── */
    let discount = 0;
    if (promo_id) {
      const promoResult = await query(
        `UPDATE promo_codes
         SET uses_count = uses_count + 1
         WHERE id = $1
           AND is_active = true
           AND (expires_at IS NULL OR expires_at > NOW())
           AND (max_uses IS NULL OR uses_count < max_uses)
           AND (min_order_amount IS NULL OR min_order_amount <= $2)
         RETURNING *`,
        [promo_id, subtotal]
      );
      if (promoResult.rows.length === 0) {
        await compensate();
        return res.status(400).json({
          success: false,
          message: "That promo code is no longer valid for this order (expired, fully used, or minimum not met).",
        });
      }
      const promo = promoResult.rows[0];
      promoConsumed = promo.id;

      /* Store-scoped promos only discount items from that store */
      const eligibleBase = promo.store_id
        ? orderItems.filter(oi => oi.store_id === promo.store_id)
                    .reduce((s, oi) => s + oi.subtotal, 0)
        : subtotal;

      if (promo.discount_type === "percentage") {
        discount = eligibleBase * (Number(promo.discount_value) / 100);
      } else {
        discount = Number(promo.discount_value);
      }
      discount = Math.min(Math.round(discount * 100) / 100, eligibleBase);
    }

    /* ── 4. Final total — server math only. 5% service fee. ── */
    const finalTotal = Math.round((subtotal - discount) * SERVICE_FEE_MULTIPLIER * 100) / 100;

    /* ── 5. Create the order ── */
    const orderResult = await query(
      `INSERT INTO orders (buyer_id, total_amount, delivery_address, notes, status)
       VALUES ($1, $2, $3, $4, 'pending')
       RETURNING *`,
      [buyerId, finalTotal, String(delivery_address).trim(), notes || null]
    );
    const order = orderResult.rows[0];

    /* ── 6. Create order items ── */
    for (const oi of orderItems) {
      await query(
        `INSERT INTO order_items (order_id, product_id, product_name, store_id, quantity, unit_price, subtotal)
         VALUES ($1, $2, $3, $4, $5, $6, $7)`,
        [order.id, oi.product_id, oi.product_name, oi.store_id, oi.quantity, oi.unit_price, oi.subtotal]
      );
    }

    /* ── 7. Notify buyer ── */
    await sendNotification(
      buyerId,
      "order_placed",
      "Order placed! 🎉",
      "Your order #" + order.id.slice(0, 8).toUpperCase() + " has been received. The vendor will confirm shortly.",
      { order_id: order.id }
    );

    /* ── 8. Notify vendors ── */
    for (const storeId of storeIds) {
      const storeResult = await query(
        "SELECT owner_id, name FROM stores WHERE id = $1",
        [storeId]
      );
      if (storeResult.rows.length > 0) {
        const store = storeResult.rows[0];
        const storeTotal = orderItems
          .filter(oi => oi.store_id === storeId)
          .reduce((s, oi) => s + oi.subtotal, 0);
        await sendNotification(
          store.owner_id,
          "new_order",
          "New order received! 📦",
          "You have a new order #" + order.id.slice(0, 8).toUpperCase() + " at " + store.name + ". R" + storeTotal.toFixed(2),
          { order_id: order.id, store_id: storeId }
        );
      }
    }

    /* ── 9. Email confirmation (fire-and-forget — never delays the response) ── */
    try {
      const { sendEmail, orderConfirmationEmail } = require("../utils/email");
      const { subject, html } = orderConfirmationEmail({
        buyerName: req.user.full_name,
        orderId:   order.id,
        items:     orderItems.map(oi => ({ name: oi.product_name, quantity: oi.quantity, subtotal: oi.subtotal })),
        total:     finalTotal,
        deliveryAddress: String(delivery_address).trim(),
      });
      sendEmail({ to: req.user.email, subject, html });
    } catch (e) { console.error("Order email error:", e.message); }

    res.status(201).json({ success: true, order });

  } catch (err) {
    console.error("Place order error:", err.message);
    await compensate();
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

  const order = result.rows[0];

  /* ── Notify buyer of status change ── */
  const messages = {
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

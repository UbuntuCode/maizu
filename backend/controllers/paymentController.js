const crypto  = require("crypto");
const https   = require("https");
const { query } = require("../config/db");

/* ── PayFast config ─────────────────────────────────────────── */
const PF = {
  merchantId:  process.env.PAYFAST_MERCHANT_ID  || "10000100",
  merchantKey: process.env.PAYFAST_MERCHANT_KEY || "46f0cd694581a",
  passphrase:  process.env.PAYFAST_PASSPHRASE   || "",
  sandbox:     process.env.NODE_ENV !== "production",
};

const PF_HOST    = PF.sandbox ? "sandbox.payfast.co.za" : "www.payfast.co.za";
const PF_URL     = `https://${PF_HOST}/eng/process`;
const CLIENT_URL = process.env.CLIENT_URL || "http://localhost:3000";
const API_URL    = process.env.API_URL    || "http://localhost:5000";

/* ── Generate MD5 signature ─────────────────────────────────── */
const generateSignature = (data, passphrase = "") => {
  // Build query string from data object (alphabetical order)
  let str = Object.keys(data)
    .sort()
    .filter(k => data[k] !== "" && data[k] !== undefined && data[k] !== null)
    .map(k => `${k}=${encodeURIComponent(String(data[k])).replace(/%20/g, "+")}`)
    .join("&");

  if (passphrase) {
    str += `&passphrase=${encodeURIComponent(passphrase).replace(/%20/g, "+")}`;
  }

  return crypto.createHash("md5").update(str).digest("hex");
};

/* ── CREATE PAYMENT ── POST /api/payment/create ─────────────── */
const createPayment = async (req, res) => {
  const { order_id, items, delivery_address, notes } = req.body;
  const buyer = req.user;

  if (!items || items.length === 0) {
    return res.status(400).json({ success: false, message: "No items provided." });
  }

  try {
    /* Calculate total */
    let total_amount = 0;
    const orderItems = [];

    for (const item of items) {
      const prod = await query(
        "SELECT id, name, price, stock_quantity, store_id FROM products WHERE id = $1 AND is_active = true",
        [item.product_id]
      );
      if (prod.rows.length === 0) {
        return res.status(404).json({ success: false, message: `Product not found: ${item.product_id}` });
      }
      const p = prod.rows[0];
      const subtotal = Number(p.price) * item.quantity;
      total_amount += subtotal;
      orderItems.push({ ...p, quantity: item.quantity, subtotal });
    }

    /* Add 5% service fee */
    const service_fee = total_amount * 0.05;
    const grand_total = total_amount + service_fee;

    /* Create pending order first */
    const orderResult = await query(
      `INSERT INTO orders (buyer_id, total_amount, delivery_address, notes, status)
       VALUES ($1, $2, $3, $4, 'pending') RETURNING *`,
      [buyer.id, grand_total, delivery_address, notes || ""]
    );
    const order = orderResult.rows[0];

    /* Create order items */
    for (const item of orderItems) {
      await query(
        `INSERT INTO order_items (order_id, product_id, product_name, store_id, quantity, unit_price, subtotal)
         VALUES ($1, $2, $3, $4, $5, $6, $7)`,
        [order.id, item.id, item.name, item.store_id, item.quantity, item.price, item.subtotal]
      );
    }

    /* Build PayFast payment data */
    const pfData = {
      merchant_id:   PF.merchantId,
      merchant_key:  PF.merchantKey,
      return_url:    `${CLIENT_URL}/payment/success?order_id=${order.id}`,
      cancel_url:    `${CLIENT_URL}/payment/cancel?order_id=${order.id}`,
      notify_url:    `${API_URL}/api/payment/notify`,
      name_first:    buyer.full_name?.split(" ")[0] || "Customer",
      name_last:     buyer.full_name?.split(" ").slice(1).join(" ") || "",
      email_address: buyer.email,
      m_payment_id:  order.id,
      amount:        grand_total.toFixed(2),
      item_name:     `Maizu Order #${order.id.slice(0, 8).toUpperCase()}`,
      item_description: `${orderItems.length} item(s) from Maizu Mall`,
    };

    /* Generate signature */
    pfData.signature = generateSignature(pfData, PF.passphrase);

    res.status(200).json({
      success:     true,
      order_id:    order.id,
      payfast_url: PF_URL,
      payfast_data: pfData,
    });

  } catch (err) {
    console.error("Payment create error:", err.message);
    res.status(500).json({ success: false, message: "Failed to create payment." });
  }
};

/* ── ITN HANDLER ── POST /api/payment/notify ────────────────── */
/* PayFast calls this URL after successful payment */
const handleNotify = async (req, res) => {
  try {
    const data = req.body;

    /* Step 1: Verify the data came from PayFast */
    const receivedSignature = data.signature;
    const dataCopy = { ...data };
    delete dataCopy.signature;

    const expectedSignature = generateSignature(dataCopy, PF.passphrase);

    if (receivedSignature !== expectedSignature) {
      console.error("PayFast ITN: Invalid signature");
      return res.status(400).send("Invalid signature");
    }

    /* Step 2: Verify with PayFast server */
    const pfValid = await verifyWithPayFast(data);
    if (!pfValid) {
      console.error("PayFast ITN: PayFast verification failed");
      return res.status(400).send("Verification failed");
    }

    /* Step 3: Check payment status */
    const orderId    = data.m_payment_id;
    const pfPaymentId = data.pf_payment_id;
    const paymentStatus = data.payment_status;

    if (paymentStatus === "COMPLETE") {
      /* Update order to confirmed + save payment ID */
      await query(
        `UPDATE orders SET status = 'confirmed', updated_at = NOW()
         WHERE id = $1`,
        [orderId]
      );

      /* Decrement stock */
      const items = await query(
        "SELECT product_id, quantity FROM order_items WHERE order_id = $1",
        [orderId]
      );
      for (const item of items.rows) {
        await query(
          "UPDATE products SET stock_quantity = stock_quantity - $1 WHERE id = $2",
          [item.quantity, item.product_id]
        );
      }

      console.log(`✅ Payment confirmed for order ${orderId}`);
    } else if (paymentStatus === "CANCELLED") {
      await query(
        "UPDATE orders SET status = 'cancelled', updated_at = NOW() WHERE id = $1",
        [orderId]
      );
      console.log(`❌ Payment cancelled for order ${orderId}`);
    }

    res.status(200).send("OK");

  } catch (err) {
    console.error("ITN handler error:", err.message);
    res.status(500).send("Server error");
  }
};

/* ── Verify payment with PayFast server ─────────────────────── */
const verifyWithPayFast = (data) => {
  return new Promise((resolve) => {
    const body = Object.keys(data)
      .map(k => `${k}=${encodeURIComponent(data[k]).replace(/%20/g, "+")}`)
      .join("&");

    const options = {
      hostname: PF_HOST,
      port:     443,
      path:     "/eng/query/validate",
      method:   "POST",
      headers:  {
        "Content-Type":   "application/x-www-form-urlencoded",
        "Content-Length": Buffer.byteLength(body),
      },
    };

    const pfReq = https.request(options, (pfRes) => {
      let responseData = "";
      pfRes.on("data", chunk => { responseData += chunk; });
      pfRes.on("end", () => {
        resolve(responseData === "VALID");
      });
    });

    pfReq.on("error", () => resolve(false));
    pfReq.write(body);
    pfReq.end();
  });
};

/* ── GET ORDER STATUS ── GET /api/payment/order/:id ─────────── */
const getOrderStatus = async (req, res) => {
  const { id } = req.params;
  const result = await query(
    "SELECT id, status, total_amount, created_at FROM orders WHERE id = $1 AND buyer_id = $2",
    [id, req.user.id]
  );

  if (result.rows.length === 0) {
    return res.status(404).json({ success: false, message: "Order not found." });
  }

  res.status(200).json({ success: true, order: result.rows[0] });
};

module.exports = { createPayment, handleNotify, getOrderStatus };

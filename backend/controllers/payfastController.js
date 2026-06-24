const { query } = require("../config/db");
const crypto  = require("crypto");
const https   = require("https");

const PF_MERCHANT_ID  = process.env.PAYFAST_MERCHANT_ID;
const PF_MERCHANT_KEY = process.env.PAYFAST_MERCHANT_KEY;
const PF_PASSPHRASE   = process.env.PAYFAST_PASSPHRASE;
const PF_SANDBOX      = process.env.NODE_ENV !== "production";

const PF_HOST     = PF_SANDBOX ? "sandbox.payfast.co.za" : "www.payfast.co.za";
const PF_BASE_URL = `https://${PF_HOST}`;

const buildSignature = (data, passphrase = "") => {
  const pfOutput = Object.keys(data)
    .filter(k => data[k] !== "" && data[k] !== undefined && data[k] !== null)
    .map(k => `${k}=${encodeURIComponent(String(data[k])).replace(/%20/g, "+")}`)
    .join("&");

  const getVar = passphrase
    ? `${pfOutput}&passphrase=${encodeURIComponent(passphrase.trim()).replace(/%20/g, "+")}`
    : pfOutput;

  return crypto.createHash("md5").update(getVar).digest("hex");
};

const verifyITN = (pfData, pfParamString, pfHost) => {
  return new Promise((resolve, reject) => {
    const signature = buildSignature(
      Object.fromEntries(Object.entries(pfData).filter(([k]) => k !== "signature")),
      PF_PASSPHRASE
    );
    if (signature !== pfData.signature) return resolve({ valid: false, reason: "Invalid signature" });

    const validHosts = ["www.payfast.co.za", "sandbox.payfast.co.za", "w1w.payfast.co.za", "w2w.payfast.co.za"];
    if (!validHosts.includes(pfHost)) return resolve({ valid: false, reason: "Invalid host" });

    const options = {
      hostname: PF_SANDBOX ? "sandbox.payfast.co.za" : "www.payfast.co.za",
      port:     443,
      path:     "/eng/query/validate",
      method:   "POST",
      headers:  { "Content-Type": "application/x-www-form-urlencoded", "Content-Length": Buffer.byteLength(pfParamString) },
    };

    const req = https.request(options, (res) => {
      let data = "";
      res.on("data", chunk => { data += chunk; });
      res.on("end", () => {
        if (data === "VALID") resolve({ valid: true });
        else resolve({ valid: false, reason: `PayFast responded: ${data}` });
      });
    });
    req.on("error", reject);
    req.write(pfParamString);
    req.end();
  });
};

/* ══════════════════════════════════════════════════════════════
   CREATE PAYMENT ── POST /api/payfast/create
══════════════════════════════════════════════════════════════ */
const createPayment = async (req, res) => {
  if (!PF_MERCHANT_ID || !PF_MERCHANT_KEY) {
    return res.status(503).json({ success: false, message: "PayFast not configured. Add PAYFAST_MERCHANT_ID, PAYFAST_MERCHANT_KEY and PAYFAST_PASSPHRASE to Railway." });
  }

  const { items, delivery_address, notes, promo_id, discount_amount } = req.body;
  const buyer_id = req.user.id;

  if (!items || items.length === 0) return res.status(400).json({ success: false, message: "No items provided." });

  try {
    var total_amount = 0;
    for (var i = 0; i < items.length; i++) {
      var prod = await query("SELECT price FROM products WHERE id = $1 AND is_active = true", [items[i].product_id]);
      if (prod.rows.length === 0) return res.status(404).json({ success: false, message: "Product not found." });
      total_amount += Number(prod.rows[0].price) * Number(items[i].quantity);
    }

    var finalDiscount = Number(discount_amount) || 0;
    var finalTotal    = Math.max(0, total_amount - finalDiscount) * 1.05;
    var amount        = finalTotal.toFixed(2);

    var buyerResult = await query("SELECT full_name, email FROM users WHERE id = $1", [buyer_id]);
    var buyer       = buyerResult.rows[0] || {};
    var nameParts   = (buyer.full_name || "Maizu Buyer").split(" ");

    var orderResult = await query(
      "INSERT INTO orders (buyer_id, total_amount, delivery_address, notes, status, payment_method) VALUES ($1,$2,$3,$4,'pending','payfast') RETURNING *",
      [buyer_id, finalTotal, delivery_address, notes || ""]
    );
    var order = orderResult.rows[0];

    for (var j = 0; j < items.length; j++) {
      var oi   = items[j];
      var prod = await query("SELECT id, name, price, store_id FROM products WHERE id = $1", [oi.product_id]);
      if (prod.rows.length > 0) {
        var p = prod.rows[0];
        await query(
          "INSERT INTO order_items (order_id, product_id, product_name, store_id, quantity, unit_price, subtotal) VALUES ($1,$2,$3,$4,$5,$6,$7)",
          [order.id, p.id, p.name, p.store_id, oi.quantity, p.price, Number(p.price) * oi.quantity]
        );
      }
    }

    if (promo_id) {
      try {
        await query("INSERT INTO promo_code_uses (promo_id, order_id, buyer_id, discount_amount) VALUES ($1,$2,$3,$4)", [promo_id, order.id, buyer_id, finalDiscount]);
        await query("UPDATE promo_codes SET uses_count = uses_count + 1 WHERE id = $1", [promo_id]);
      } catch { /* non-critical */ }
    }

    const CLIENT_URL  = process.env.CLIENT_URL || "https://maizu.co.za";
    const BACKEND_URL = process.env.BACKEND_URL || "https://maizu-production.up.railway.app";

    var pfData = {
      merchant_id:          PF_MERCHANT_ID,
      merchant_key:         PF_MERCHANT_KEY,
      return_url:           `${CLIENT_URL}/payment/payfast-success?order_id=${order.id}`,
      cancel_url:           `${CLIENT_URL}/checkout?cancelled=true`,
      notify_url:           `${BACKEND_URL}/api/payfast/notify`,
      name_first:           nameParts[0] || "Buyer",
      name_last:            nameParts.slice(1).join(" ") || "User",
      email_address:        buyer.email || "buyer@maizu.co.za",
      m_payment_id:         order.id,
      amount:               amount,
      item_name:            `Maizu Order #${order.id.slice(0, 8).toUpperCase()}`,
      item_description:     `${items.length} item${items.length !== 1 ? "s" : ""} from Maizu Business Hub`,
      email_confirmation:   "1",
      confirmation_address: buyer.email || "",
    };

    pfData.signature = buildSignature(pfData, PF_PASSPHRASE);

    var queryString = Object.keys(pfData).map(k => `${k}=${encodeURIComponent(String(pfData[k])).replace(/%20/g, "+")}`).join("&");
    var paymentUrl  = `${PF_BASE_URL}/eng/process?${queryString}`;

    res.status(200).json({ success: true, payment_url: paymentUrl, order_id: order.id, amount: finalTotal });
  } catch (err) {
    console.error("PayFast create error:", err.message);
    res.status(500).json({ success: false, message: err.message });
  }
};

/* ══════════════════════════════════════════════════════════════
   ITN NOTIFY WEBHOOK ── POST /api/payfast/notify
══════════════════════════════════════════════════════════════ */
const handleNotify = async (req, res) => {
  res.status(200).send("OK");

  try {
    var pfData        = req.body;
    var pfParamString = Object.keys(pfData).filter(k => k !== "signature").map(k => `${k}=${encodeURIComponent(String(pfData[k])).replace(/%20/g, "+")}`).join("&");
    var pfHost        = req.get("host") || PF_HOST;

    var verify = await verifyITN(pfData, pfParamString, pfHost);
    if (!verify.valid) { console.error("PayFast ITN invalid:", verify.reason); return; }

    var orderId       = pfData.m_payment_id;
    var paymentStatus = pfData.payment_status;
    var pfAmount      = parseFloat(pfData.amount_gross);
    if (!orderId) return;

    var orderResult = await query("SELECT * FROM orders WHERE id = $1", [orderId]);
    if (orderResult.rows.length === 0) return;
    var order = orderResult.rows[0];

    var expectedAmount = parseFloat(Number(order.total_amount).toFixed(2));
    if (Math.abs(pfAmount - expectedAmount) > 0.01) {
      console.error(`PayFast amount mismatch: expected ${expectedAmount}, got ${pfAmount}`);
      return;
    }

    if (paymentStatus === "COMPLETE" && order.status === "pending") {
      await query("UPDATE orders SET status = 'confirmed', updated_at = NOW() WHERE id = $1", [orderId]);
      try {
        var { sendNotification } = require("./notificationController");
        await sendNotification(order.buyer_id, "order_placed", "Payment confirmed! 🎉", `Your PayFast payment for order #${orderId.slice(0, 8).toUpperCase()} was successful.`, { order_id: orderId });
      } catch { /* non-critical */ }
    }

    if (paymentStatus === "CANCELLED") {
      await query("UPDATE orders SET status = 'cancelled', updated_at = NOW() WHERE id = $1", [orderId]);
    }
  } catch (err) {
    console.error("PayFast ITN error:", err.message);
  }
};

/* ══════════════════════════════════════════════════════════════
   VERIFY ORDER STATUS ── GET /api/payfast/verify/:orderId
══════════════════════════════════════════════════════════════ */
const verifyOrder = async (req, res) => {
  try {
    var result = await query(
      "SELECT id, status, total_amount, payment_method, created_at FROM orders WHERE id = $1 AND buyer_id = $2",
      [req.params.orderId, req.user.id]
    );
    if (result.rows.length === 0) return res.status(404).json({ success: false, message: "Order not found." });
    var order = result.rows[0];
    res.status(200).json({ success: true, payment_status: order.status === "confirmed" ? "COMPLETE" : order.status, order });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

module.exports = { createPayment, handleNotify, verifyOrder };

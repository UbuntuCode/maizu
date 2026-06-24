const { query } = require("../config/db");
const https     = require("https");

const FLW_SECRET_KEY = process.env.FLW_SECRET_KEY;
const FLW_BASE       = "https://api.flutterwave.com/v3";

const COUNTRY_CONFIG = {
  ZA: { currency: "ZAR", name: "South Africa", flag: "🇿🇦", payment_options: "card,account,banktransfer" },
  NG: { currency: "NGN", name: "Nigeria",      flag: "🇳🇬", payment_options: "card,banktransfer,ussd"     },
  KE: { currency: "KES", name: "Kenya",        flag: "🇰🇪", payment_options: "card,mpesa,banktransfer"    },
  GH: { currency: "GHS", name: "Ghana",        flag: "🇬🇭", payment_options: "card,mobilemoneyghana,banktransfer" },
  TZ: { currency: "TZS", name: "Tanzania",     flag: "🇹🇿", payment_options: "card,mobilemoneytanzania"   },
};

const flwRequest = (method, path, body = null) => {
  return new Promise((resolve, reject) => {
    if (!FLW_SECRET_KEY) return reject(new Error("FLW_SECRET_KEY not configured."));

    const payload = body ? JSON.stringify(body) : null;
    const options = {
      hostname: "api.flutterwave.com",
      port:     443,
      path:     `/v3${path}`,
      method,
      headers:  {
        "Authorization": `Bearer ${FLW_SECRET_KEY}`,
        "Content-Type":  "application/json",
        "Accept":        "application/json",
      },
    };
    if (payload) options.headers["Content-Length"] = Buffer.byteLength(payload);

    const req = https.request(options, (res) => {
      let data = "";
      res.on("data", chunk => { data += chunk; });
      res.on("end", () => {
        try { resolve(JSON.parse(data)); }
        catch { resolve({ raw: data }); }
      });
    });
    req.on("error", reject);
    if (payload) req.write(payload);
    req.end();
  });
};

/* ══════════════════════════════════════════════════════════════
   CREATE PAYMENT LINK ── POST /api/flutterwave/create
══════════════════════════════════════════════════════════════ */
const createPayment = async (req, res) => {
  const { items, delivery_address, notes, promo_id, discount_amount, country = "ZA" } = req.body;
  const buyer_id = req.user.id;

  if (!FLW_SECRET_KEY) {
    return res.status(503).json({ success: false, message: "Flutterwave not configured. Add FLW_SECRET_KEY and FLW_PUBLIC_KEY to Railway." });
  }
  if (!items || items.length === 0) {
    return res.status(400).json({ success: false, message: "No items provided." });
  }

  const countryCfg = COUNTRY_CONFIG[country.toUpperCase()] || COUNTRY_CONFIG.ZA;

  try {
    var total_amount = 0;
    for (var i = 0; i < items.length; i++) {
      var prod = await query("SELECT id, price FROM products WHERE id = $1 AND is_active = true", [items[i].product_id]);
      if (prod.rows.length === 0) return res.status(404).json({ success: false, message: "Product not found." });
      total_amount += Number(prod.rows[0].price) * Number(items[i].quantity);
    }

    var finalDiscount = Number(discount_amount) || 0;
    var finalTotal    = Math.max(0, total_amount - finalDiscount) * 1.05;

    var buyerResult = await query("SELECT full_name, email FROM users WHERE id = $1", [buyer_id]);
    var buyer = buyerResult.rows[0] || {};

    var orderResult = await query(
      `INSERT INTO orders (buyer_id, total_amount, delivery_address, notes, status)
       VALUES ($1, $2, $3, $4, 'pending') RETURNING *`,
      [buyer_id, finalTotal, delivery_address, notes || ""]
    );
    var order = orderResult.rows[0];

    for (var j = 0; j < items.length; j++) {
      var oi   = items[j];
      var prod = await query("SELECT id, name, price, store_id FROM products WHERE id = $1", [oi.product_id]);
      if (prod.rows.length > 0) {
        var p = prod.rows[0];
        await query(
          `INSERT INTO order_items (order_id, product_id, product_name, store_id, quantity, unit_price, subtotal)
           VALUES ($1, $2, $3, $4, $5, $6, $7)`,
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

    var tx_ref = `MAIZU-${order.id.slice(0, 8).toUpperCase()}-${Date.now()}`;
    await query("UPDATE orders SET notes = COALESCE(notes, '') || $1 WHERE id = $2", [` [flw:${tx_ref}]`, order.id]);

    const redirectUrl = `${process.env.CLIENT_URL || "https://maizu.co.za"}/payment/flutterwave-success`;

    var payload = {
      tx_ref,
      amount:           finalTotal.toFixed(2),
      currency:         countryCfg.currency,
      redirect_url:     redirectUrl,
      payment_options:  countryCfg.payment_options,
      customer: { email: buyer.email || "buyer@maizu.co.za", phonenumber: "", name: buyer.full_name || "Maizu Customer" },
      customizations: { title: "Maizu Business Hub", description: `Order #${order.id.slice(0, 8).toUpperCase()}`, logo: "https://maizu.co.za/icons/icon-192x192.png" },
      meta: { order_id: order.id, buyer_id, country },
    };

    var flwResponse = await flwRequest("POST", "/payments", payload);

    if (flwResponse.status === "success" && flwResponse.data?.link) {
      res.status(200).json({ success: true, payment_url: flwResponse.data.link, order_id: order.id, tx_ref, currency: countryCfg.currency, amount: finalTotal });
    } else {
      throw new Error(flwResponse.message || "Failed to create payment link.");
    }
  } catch (err) {
    console.error("Flutterwave create error:", err.message);
    res.status(500).json({ success: false, message: err.message });
  }
};

/* ══════════════════════════════════════════════════════════════
   VERIFY PAYMENT ── GET /api/flutterwave/verify
══════════════════════════════════════════════════════════════ */
const verifyPayment = async (req, res) => {
  const { transaction_id, tx_ref } = req.query;
  if (!transaction_id) return res.status(400).json({ success: false, message: "transaction_id is required." });

  try {
    var verifyResult = await flwRequest("GET", `/transactions/${transaction_id}/verify`);
    if (verifyResult.status !== "success") {
      return res.status(400).json({ success: false, message: "Verification failed.", data: verifyResult });
    }

    var txData = verifyResult.data;
    if (txData.status !== "successful") {
      return res.status(200).json({ success: false, message: `Payment ${txData.status}.`, payment_status: txData.status });
    }

    var orderResult = await query("SELECT * FROM orders WHERE notes LIKE $1", [`%[flw:${tx_ref}]%`]);
    if (orderResult.rows.length === 0) {
      var orderId = txData.meta?.order_id;
      if (orderId) orderResult = await query("SELECT * FROM orders WHERE id = $1", [orderId]);
    }

    if (orderResult.rows.length > 0) {
      var order = orderResult.rows[0];
      if (order.status === "pending") {
        await query("UPDATE orders SET status = 'confirmed', updated_at = NOW() WHERE id = $1", [order.id]);
        try {
          var { sendNotification } = require("./notificationController");
          await sendNotification(order.buyer_id, "order_placed", "Payment confirmed! 🎉", `Your order #${order.id.slice(0, 8).toUpperCase()} has been paid and confirmed.`, { order_id: order.id });
        } catch { /* non-critical */ }
      }
      return res.status(200).json({ success: true, payment_status: "successful", order_id: order.id, amount: txData.amount, currency: txData.currency, payment_type: txData.payment_type });
    }

    res.status(200).json({ success: true, payment_status: "successful", order_id: null });
  } catch (err) {
    console.error("Flutterwave verify error:", err.message);
    res.status(500).json({ success: false, message: err.message });
  }
};

/* ══════════════════════════════════════════════════════════════
   WEBHOOK ── POST /api/flutterwave/webhook
══════════════════════════════════════════════════════════════ */
const handleWebhook = async (req, res) => {
  var secretHash = process.env.FLW_WEBHOOK_SECRET;
  var signature  = req.headers["verif-hash"];
  if (secretHash && signature !== secretHash) return res.status(401).send("Unauthorized");

  var event = req.body;
  if (event.event === "charge.completed" && event.data?.status === "successful") {
    var txRef = event.data.tx_ref;
    try {
      var orderResult = await query("SELECT * FROM orders WHERE notes LIKE $1", [`%[flw:${txRef}]%`]);
      if (orderResult.rows.length > 0) {
        var order = orderResult.rows[0];
        if (order.status === "pending") {
          await query("UPDATE orders SET status = 'confirmed', updated_at = NOW() WHERE id = $1", [order.id]);
          try {
            var { sendNotification } = require("./notificationController");
            await sendNotification(order.buyer_id, "order_placed", "Payment confirmed! 🎉", `Your Flutterwave payment for order #${order.id.slice(0, 8).toUpperCase()} was successful.`, { order_id: order.id });
          } catch { /* non-critical */ }
        }
      }
    } catch (err) { console.error("Webhook processing error:", err.message); }
  }
  res.status(200).send("OK");
};

/* ── GET SUPPORTED COUNTRIES ── GET /api/flutterwave/countries */
const getSupportedCountries = async (req, res) => {
  res.status(200).json({
    success:   true,
    countries: Object.entries(COUNTRY_CONFIG).map(([code, cfg]) => ({ code, name: cfg.name, flag: cfg.flag, currency: cfg.currency })),
  });
};

module.exports = { createPayment, verifyPayment, handleWebhook, getSupportedCountries };

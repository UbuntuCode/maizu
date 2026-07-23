const { query } = require("../config/db");
const crypto = require("crypto");
const https = require("https");

/* ══════════════════════════════════════════════════════════════
   PAYFAST CONTROLLER  ── Maizu SafePay
   Mounted at /api/payfast  (see server.js)

   THIS IS THE ONLY PAYFAST IMPLEMENTATION.
   controllers/paymentController.js and routes/paymentRoutes.js
   are deleted in Batch 2B-3 — do not reintroduce them.

   SECURITY RULES (do not relax):
   - NO credential fallbacks. Missing env vars => refuse to create
     a payment. Never silently fall back to sandbox keys in prod.
   - ALL prices come from the products table. Client-sent amounts
     are ignored entirely.
   - Payment is confirmed ONLY by the server-to-server ITN webhook,
     never by the browser redirect.
   - handover_code is created by confirm_order_payment() and is
     returned to the BUYER only. It is never in a vendor response.

   MONEY MODEL:
     subtotal      = sum of order_items.subtotal   (goods only)
     service_fee   = 5% of subtotal                (Maizu revenue)
     total_amount  = subtotal + service_fee        (what buyer pays)
     commission    = % of SUBTOTAL only — never of service_fee.
                     Calculated in confirm_order_payment().
══════════════════════════════════════════════════════════════ */

const PF_MERCHANT_ID = process.env.PAYFAST_MERCHANT_ID;
const PF_MERCHANT_KEY = process.env.PAYFAST_MERCHANT_KEY;
const PF_PASSPHRASE = process.env.PAYFAST_PASSPHRASE;
const PF_SANDBOX = process.env.NODE_ENV !== "production";

const PF_HOST = PF_SANDBOX ? "sandbox.payfast.co.za" : "www.payfast.co.za";
const PF_PROCESS_URL = `https://${PF_HOST}/eng/process`;

const CLIENT_URL = process.env.CLIENT_URL || "https://maizu.co.za";
const BACKEND_URL =
  process.env.BACKEND_URL ||
  process.env.API_URL ||
  "https://maizu-production.up.railway.app";

const SERVICE_FEE_RATE = 0.05; /* 5% buyer-side service fee */

/* ── Signature helper ───────────────────────────────────────────
   PayFast requires the fields in the order they are submitted,
   NOT alphabetical. We build from Object.keys order and the form
   posts in that same order, so the signature matches.
──────────────────────────────────────────────────────────────── */
const buildSignature = (data, passphrase = "") => {
  const pfOutput = Object.keys(data)
    .filter(
      (k) =>
        k !== "signature" &&
        data[k] !== "" &&
        data[k] !== undefined &&
        data[k] !== null
    )
    .map(
      (k) =>
        `${k}=${encodeURIComponent(String(data[k]).trim()).replace(/%20/g, "+")}`
    )
    .join("&");

  const getVar = passphrase
    ? `${pfOutput}&passphrase=${encodeURIComponent(passphrase.trim()).replace(
        /%20/g,
        "+"
      )}`
    : pfOutput;

  return crypto.createHash("md5").update(getVar).digest("hex");
};

/* ── Verify an incoming ITN with PayFast's servers ───────────── */
const verifyITN = (pfData, pfParamString, pfHost) => {
  return new Promise((resolve, reject) => {
    /* 1. Signature must match */
    const expected = buildSignature(
      Object.fromEntries(
        Object.entries(pfData).filter(([k]) => k !== "signature")
      ),
      PF_PASSPHRASE
    );
    if (expected !== pfData.signature) {
      return resolve({ valid: false, reason: "Invalid signature" });
    }

    /* 2. Host must be a known PayFast host */
    const validHosts = [
      "www.payfast.co.za",
      "sandbox.payfast.co.za",
      "w1w.payfast.co.za",
      "w2w.payfast.co.za",
    ];
    if (!validHosts.includes(pfHost)) {
      return resolve({ valid: false, reason: `Invalid host: ${pfHost}` });
    }

    /* 3. PayFast itself must confirm the payload */
    const options = {
      hostname: PF_HOST,
      port: 443,
      path: "/eng/query/validate",
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        "Content-Length": Buffer.byteLength(pfParamString),
      },
    };

    const req = https.request(options, (res) => {
      let data = "";
      res.on("data", (chunk) => {
        data += chunk;
      });
      res.on("end", () => {
        if (data.trim() === "VALID") resolve({ valid: true });
        else resolve({ valid: false, reason: `PayFast responded: ${data}` });
      });
    });
    req.on("error", reject);
    req.write(pfParamString);
    req.end();
  });
};

/* ══════════════════════════════════════════════════════════════
   CREATE PAYMENT ── POST /api/payfast/create   (auth required)

   Returns { payfast_url, payfast_data } — the frontend renders a
   hidden form and auto-submits it. This response shape is what
   app/checkout/page.tsx already expects; do not change the keys
   without changing checkout at the same time.
══════════════════════════════════════════════════════════════ */
const createPayment = async (req, res) => {
  if (!PF_MERCHANT_ID || !PF_MERCHANT_KEY) {
    console.error("PayFast env vars missing — refusing to create payment.");
    return res.status(503).json({
      success: false,
      message:
        "Payments are temporarily unavailable. Please try again shortly.",
    });
  }

  const { items, delivery_address, notes } = req.body;
  const buyerId = req.user.id;

  /* ── Input validation ── */
  if (!Array.isArray(items) || items.length === 0) {
    return res
      .status(400)
      .json({ success: false, message: "Your cart is empty." });
  }
  if (items.length > 50) {
    return res
      .status(400)
      .json({ success: false, message: "Too many items in one order." });
  }
  if (!delivery_address || String(delivery_address).trim().length < 5) {
    return res
      .status(400)
      .json({ success: false, message: "A delivery address is required." });
  }
  for (const it of items) {
    const qty = Number(it.quantity);
    if (!it.product_id || !Number.isInteger(qty) || qty < 1 || qty > 99) {
      return res
        .status(400)
        .json({ success: false, message: "Invalid item quantity." });
    }
  }

  try {
    /* ── 1. Price everything SERVER-SIDE ── */
    const orderItems = [];
    let subtotal = 0;

    for (const it of items) {
      const qty = Number(it.quantity);
      const productResult = await query(
        "SELECT id, name, price, store_id, is_active FROM products WHERE id = $1",
        [it.product_id]
      );
      if (productResult.rows.length === 0 || !productResult.rows[0].is_active) {
        return res.status(400).json({
          success: false,
          message: "One of the products is no longer available.",
        });
      }
      const p = productResult.rows[0];
      const unitPrice = Number(p.price);
      const lineSubtotal = Math.round(unitPrice * qty * 100) / 100;

      orderItems.push({
        product_id: p.id,
        product_name: p.name,
        store_id: p.store_id,
        quantity: qty,
        unit_price: unitPrice,
        subtotal: lineSubtotal,
      });
      subtotal += lineSubtotal;
    }

    subtotal = Math.round(subtotal * 100) / 100;
    const serviceFee = Math.round(subtotal * SERVICE_FEE_RATE * 100) / 100;
    const grandTotal = Math.round((subtotal + serviceFee) * 100) / 100;

    /* ── 2. Buyer details for the PayFast form ── */
    const buyerResult = await query(
      "SELECT full_name, email FROM users WHERE id = $1",
      [buyerId]
    );
    const buyer = buyerResult.rows[0] || {};
    const nameParts = String(buyer.full_name || "Maizu Buyer").trim().split(" ");

    /* ── 3. Create the PENDING order.
           Money columns stored separately so commission is never
           charged on our own service fee. ── */
    const orderResult = await query(
      `INSERT INTO orders
         (buyer_id, total_amount, service_fee, delivery_fee,
          delivery_address, notes, status)
       VALUES ($1, $2, $3, 0, $4, $5, 'pending')
       RETURNING *`,
      [
        buyerId,
        grandTotal,
        serviceFee,
        String(delivery_address).trim(),
        notes || null,
      ]
    );
    const order = orderResult.rows[0];

    /* ── 4. Order items ── */
    for (const oi of orderItems) {
      await query(
        `INSERT INTO order_items
           (order_id, product_id, product_name, store_id,
            quantity, unit_price, subtotal)
         VALUES ($1, $2, $3, $4, $5, $6, $7)`,
        [
          order.id,
          oi.product_id,
          oi.product_name,
          oi.store_id,
          oi.quantity,
          oi.unit_price,
          oi.subtotal,
        ]
      );
    }

    /* ── 5. Build the PayFast form payload.
           KEY ORDER MATTERS — the signature is built from this
           order and the browser form posts fields in this order. ── */
    const pfData = {
      merchant_id: PF_MERCHANT_ID,
      merchant_key: PF_MERCHANT_KEY,
      return_url: `${CLIENT_URL}/payment/payfast-success?order_id=${order.id}`,
      cancel_url: `${CLIENT_URL}/checkout?cancelled=true`,
      notify_url: `${BACKEND_URL}/api/payfast/notify`,
      name_first: nameParts[0] || "Buyer",
      name_last: nameParts.slice(1).join(" ") || "User",
      email_address: buyer.email || "buyer@maizu.co.za",
      m_payment_id: order.id,
      amount: grandTotal.toFixed(2),
      item_name: `Maizu Order #${order.id.slice(0, 8).toUpperCase()}`,
      item_description: `${orderItems.length} item${
        orderItems.length !== 1 ? "s" : ""
      } from Maizu Business Hub`,
    };

    pfData.signature = buildSignature(pfData, PF_PASSPHRASE);

    res.status(200).json({
      success: true,
      order_id: order.id,
      payfast_url: PF_PROCESS_URL,
      payfast_data: pfData,
      subtotal,
      service_fee: serviceFee,
      amount: grandTotal,
    });
  } catch (err) {
    console.error("PayFast create error:", err.message);
    res
      .status(500)
      .json({ success: false, message: "Failed to create payment." });
  }
};

/* ══════════════════════════════════════════════════════════════
   ITN WEBHOOK ── POST /api/payfast/notify   (NO auth — PayFast)

   This is the ONLY place an order becomes 'paid'.
   confirm_order_payment() is atomic and idempotent: PayFast
   retries ITNs, and a retry must not mint a second handover code
   or a second payout row.
══════════════════════════════════════════════════════════════ */
const handleNotify = async (req, res) => {
  /* PayFast requires a fast 200 — acknowledge, then process. */
  res.status(200).send("OK");

  try {
    const pfData = req.body || {};
    const pfParamString = Object.keys(pfData)
      .filter((k) => k !== "signature")
      .map(
        (k) =>
          `${k}=${encodeURIComponent(String(pfData[k]).trim()).replace(
            /%20/g,
            "+"
          )}`
      )
      .join("&");

    const pfHost = req.get("host") || PF_HOST;

    const verify = await verifyITN(pfData, pfParamString, pfHost);
    if (!verify.valid) {
      console.error("PayFast ITN REJECTED:", verify.reason);
      return;
    }

    const orderId = pfData.m_payment_id;
    const paymentStatus = pfData.payment_status;
    const pfAmount = parseFloat(pfData.amount_gross);
    const pfRef = pfData.pf_payment_id || null;

    if (!orderId) return;

    const orderResult = await query("SELECT * FROM orders WHERE id = $1", [
      orderId,
    ]);
    if (orderResult.rows.length === 0) {
      console.error("PayFast ITN: unknown order", orderId);
      return;
    }
    const order = orderResult.rows[0];

    /* Amount must match to the cent */
    const expectedAmount = parseFloat(Number(order.total_amount).toFixed(2));
    if (Math.abs(pfAmount - expectedAmount) > 0.01) {
      console.error(
        `PayFast ITN amount mismatch on ${orderId}: expected ${expectedAmount}, got ${pfAmount}`
      );
      return;
    }

    /* ── CANCELLED ── */
    if (paymentStatus === "CANCELLED") {
      await query(
        "UPDATE orders SET status = 'cancelled', updated_at = NOW() WHERE id = $1 AND status = 'pending'",
        [orderId]
      );
      return;
    }

    /* ── COMPLETE: the money moment ── */
    if (paymentStatus === "COMPLETE") {
      const confirmResult = await query(
        "SELECT public.confirm_order_payment($1, $2) AS result",
        [orderId, pfRef]
      );
      const outcome = confirmResult.rows[0].result;

      if (!outcome || outcome.ok !== true) {
        console.error("confirm_order_payment failed:", orderId, outcome);
        return;
      }

      /* Idempotent replay — already handled, nothing more to do. */
      if (outcome.already_confirmed) return;

      const handoverCode = outcome.handover_code;

      /* ── Notify the BUYER, with the code ── */
      try {
        const { sendNotification } = require("./notificationController");
        await sendNotification(
          order.buyer_id,
          "order_paid",
          "Payment confirmed! 🎉",
          `Order #${orderId
            .slice(0, 8)
            .toUpperCase()} is paid. Your delivery code is ${handoverCode} — give it to the driver only when you receive your items.`,
          { order_id: orderId }
        );
      } catch (e) {
        console.error("Buyer notification failed:", e.message);
      }

      /* ── Notify VENDORS (never includes the code) ── */
      try {
        const { sendNotification } = require("./notificationController");
        const stores = await query(
          `SELECT DISTINCT oi.store_id, s.owner_id, s.name
           FROM order_items oi
           JOIN stores s ON s.id = oi.store_id
           WHERE oi.order_id = $1 AND oi.store_id IS NOT NULL`,
          [orderId]
        );
        for (const st of stores.rows) {
          await sendNotification(
            st.owner_id,
            "new_order",
            "New paid order! 📦",
            `Order #${orderId
              .slice(0, 8)
              .toUpperCase()} at ${st.name} is paid. Prepare it for delivery — your payout is held until the buyer confirms receipt.`,
            { order_id: orderId, store_id: st.store_id }
          );
        }
      } catch (e) {
        console.error("Vendor notification failed:", e.message);
      }

      /* ── Email the buyer their code (fire and forget) ── */
      try {
        const { sendEmail } = require("../utils/email");
        const buyerRow = await query(
          "SELECT full_name, email FROM users WHERE id = $1",
          [order.buyer_id]
        );
        const b = buyerRow.rows[0];
        if (b && b.email) {
          sendEmail({
            to: b.email,
            subject: `Your Maizu delivery code: ${handoverCode}`,
            html: `<div style="font-family:Arial,sans-serif;max-width:520px;margin:0 auto;padding:24px">
              <h2 style="color:#0F0F0F;margin:0 0 8px">Payment confirmed</h2>
              <p style="color:#444;font-size:14px;line-height:1.6">
                Hi ${b.full_name || "there"}, your payment for order
                <strong>#${orderId.slice(0, 8).toUpperCase()}</strong> went through.
              </p>
              <div style="background:#FFF3EE;border:1.5px solid #E8401C;border-radius:12px;padding:18px;text-align:center;margin:20px 0">
                <div style="font-size:12px;letter-spacing:2px;color:#E8401C;font-weight:700">YOUR DELIVERY CODE</div>
                <div style="font-size:40px;font-weight:700;color:#0F0F0F;letter-spacing:8px">${handoverCode}</div>
              </div>
              <p style="color:#444;font-size:13px;line-height:1.6">
                Give this code to the driver <strong>only once you have your items</strong>.
                Entering it releases payment to the seller, so never share it before then.
              </p>
              <p style="color:#71717A;font-size:12px">maizu.co.za</p>
            </div>`,
          });
        }
      } catch (e) {
        console.error("Buyer code email failed:", e.message);
      }
    }
  } catch (err) {
    console.error("PayFast ITN error:", err.message);
  }
};

/* ══════════════════════════════════════════════════════════════
   VERIFY ORDER ── GET /api/payfast/verify/:orderId  (auth)
   Called by app/payment/payfast-success/page.tsx after redirect.
   Returns the handover code because the caller IS the buyer
   (enforced by buyer_id = req.user.id in the query).
══════════════════════════════════════════════════════════════ */
const verifyOrder = async (req, res) => {
  try {
    const result = await query(
      `SELECT id, status, total_amount, service_fee, delivery_fee,
              handover_code, delivery_method, created_at
       FROM orders
       WHERE id = $1 AND buyer_id = $2`,
      [req.params.orderId, req.user.id]
    );
    if (result.rows.length === 0) {
      return res
        .status(404)
        .json({ success: false, message: "Order not found." });
    }
    const order = result.rows[0];
    const paid = ["paid", "shipped", "out_for_delivery", "delivered", "completed"];

    res.status(200).json({
      success: true,
      payment_status: paid.includes(order.status) ? "COMPLETE" : order.status,
      order,
    });
  } catch (err) {
    console.error("PayFast verify error:", err.message);
    res.status(500).json({ success: false, message: "Failed to verify order." });
  }
};

module.exports = { createPayment, handleNotify, verifyOrder };

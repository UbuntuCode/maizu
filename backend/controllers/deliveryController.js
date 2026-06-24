const { query } = require("../config/db");
const https     = require("https");

/* ── ShipLogic / TCG config ─────────────────────────────────── */
const SHIPLOGIC_API_KEY = process.env.SHIPLOGIC_API_KEY;   // Set in Railway when ready
const SHIPLOGIC_BASE    = "https://api.shiplogic.com";      // Live

const COURIER_NAMES = {
  tcg:   "The Courier Guy",
  fastway: "Fastway",
  dhl:   "DHL",
  aramex: "Aramex",
  paxi:  "Paxi",
  pudo:  "PUDO",
  other: "Other",
};

/* ── ShipLogic HTTP helper ──────────────────────────────────── */
const shiplogicRequest = (method, path, body = null) => {
  return new Promise((resolve, reject) => {
    if (!SHIPLOGIC_API_KEY) {
      return reject(new Error("SHIPLOGIC_API_KEY not configured."));
    }

    const url     = new URL(SHIPLOGIC_BASE + path);
    const payload = body ? JSON.stringify(body) : null;

    const options = {
      hostname: url.hostname,
      port:     443,
      path:     url.pathname + url.search,
      method:   method,
      headers:  {
        "Authorization": `Bearer ${SHIPLOGIC_API_KEY}`,
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
   MANUAL WAYBILL ENTRY (works today, no API needed)
══════════════════════════════════════════════════════════════ */

/* ── ADD WAYBILL ── PUT /api/delivery/orders/:id/waybill ────── */
const addWaybill = async (req, res) => {
  const { id } = req.params;
  const { waybill_number, courier_name = "tcg", estimated_delivery } = req.body;

  if (!waybill_number?.trim()) {
    return res.status(400).json({ success: false, message: "Waybill number is required." });
  }

  /* Check vendor owns this order's store */
  const orderCheck = await query(
    `SELECT o.id, o.buyer_id FROM orders o
     JOIN order_items oi ON oi.order_id = o.id
     JOIN stores s ON s.id = oi.store_id
     WHERE o.id = $1 AND s.owner_id = $2 LIMIT 1`,
    [id, req.user.id]
  );

  if (orderCheck.rows.length === 0) {
    return res.status(403).json({ success: false, message: "Not authorised." });
  }

  const waybill    = waybill_number.trim().toUpperCase();
  const trackingUrl = `https://www.thecourierguy.co.za/track/?waybill=${waybill}`;

  /* Update order */
  const updated = await query(
    `UPDATE orders
     SET waybill_number     = $1,
         courier_name       = $2,
         tracking_url       = $3,
         estimated_delivery = $4,
         status             = CASE WHEN status = 'confirmed' THEN 'shipped' ELSE status END,
         shipped_at         = CASE WHEN status = 'confirmed' THEN NOW() ELSE shipped_at END,
         updated_at         = NOW()
     WHERE id = $5 RETURNING *`,
    [waybill, courier_name, trackingUrl, estimated_delivery || null, id]
  );

  /* Add tracking event */
  await query(
    `INSERT INTO tracking_events (order_id, waybill, status, description, source)
     VALUES ($1, $2, 'dispatched', $3, 'manual')`,
    [id, waybill, `Parcel dispatched with ${COURIER_NAMES[courier_name] || courier_name}. Waybill: ${waybill}`]
  );

  /* Notify buyer */
  try {
    const { sendNotification } = require("./notificationController");
    const order = updated.rows[0];
    await sendNotification(
      order.buyer_id,
      "order_shipped",
      "Your order is on the way! 🚚",
      `Waybill: ${waybill} — Track at thecourierguy.co.za/track`,
      { order_id: id, waybill }
    );
  } catch { /* non-critical */ }

  res.status(200).json({
    success:      true,
    order:        updated.rows[0],
    tracking_url: trackingUrl,
    message:      `Waybill ${waybill} added. Order marked as shipped.`,
  });
};

/* ── GET TRACKING ── GET /api/delivery/track/:waybill ────────── */
/* Public — no auth needed */
const getTracking = async (req, res) => {
  const { waybill } = req.params;

  const orderResult = await query(
    `SELECT o.id, o.status, o.waybill_number, o.courier_name,
            o.tracking_url, o.estimated_delivery, o.shipped_at,
            o.delivered_at, o.delivery_address, o.created_at
     FROM orders o
     WHERE o.waybill_number = $1`,
    [waybill.toUpperCase()]
  );

  const eventsResult = await query(
    `SELECT * FROM tracking_events
     WHERE waybill = $1
     ORDER BY event_time DESC`,
    [waybill.toUpperCase()]
  );

  if (SHIPLOGIC_API_KEY) {
    try {
      const liveData = await shiplogicRequest("GET", `/shipments?waybill=${waybill}`);
      if (liveData?.results?.length > 0) {
        const shipment = liveData.results[0];
        return res.status(200).json({
          success:  true,
          source:   "shiplogic",
          order:    orderResult.rows[0] || null,
          events:   eventsResult.rows,
          live: {
            status:          shipment.status,
            waybill:         shipment.waybill_number,
            estimated:       shipment.estimated_delivery_date,
            current_location: shipment.current_location,
            milestones:      shipment.tracking_events || [],
          },
        });
      }
    } catch { /* Fall through to manual */ }
  }

  if (orderResult.rows.length === 0 && eventsResult.rows.length === 0) {
    return res.status(200).json({
      success: true,
      source:  "public_link",
      order:   null,
      events:  [],
      public_url: `https://www.thecourierguy.co.za/track/?waybill=${waybill}`,
      message: "Track this parcel directly on The Courier Guy website.",
    });
  }

  res.status(200).json({
    success: true,
    source:  "manual",
    order:   orderResult.rows[0] || null,
    events:  eventsResult.rows,
    public_url: `https://www.thecourierguy.co.za/track/?waybill=${waybill}`,
  });
};

/* ── GET ORDER TRACKING ── GET /api/delivery/orders/:id ──────── */
const getOrderTracking = async (req, res) => {
  const { id } = req.params;

  const orderResult = await query(
    `SELECT id, status, waybill_number, courier_name, tracking_url,
            estimated_delivery, shipped_at, delivered_at, created_at
     FROM orders WHERE id = $1`,
    [id]
  );

  if (orderResult.rows.length === 0) {
    return res.status(404).json({ success: false, message: "Order not found." });
  }

  const order = orderResult.rows[0];

  const eventsResult = await query(
    `SELECT * FROM tracking_events
     WHERE order_id = $1
     ORDER BY event_time ASC`,
    [id]
  );

  res.status(200).json({
    success:    true,
    order,
    events:     eventsResult.rows,
    public_url: order.waybill_number
      ? `https://www.thecourierguy.co.za/track/?waybill=${order.waybill_number}`
      : null,
  });
};

/* ══════════════════════════════════════════════════════════════
   SHIPLOGIC API — READY ONCE YOU HAVE CREDENTIALS
══════════════════════════════════════════════════════════════ */

/* ── GET SHIPPING RATE QUOTE ── POST /api/delivery/quote ─────── */
const getQuote = async (req, res) => {
  if (!SHIPLOGIC_API_KEY) {
    return res.status(503).json({
      success: false,
      message: "ShipLogic API not configured yet. Add SHIPLOGIC_API_KEY to Railway env vars.",
    });
  }

  const {
    from_suburb, from_city, from_province, from_postal_code,
    to_suburb,   to_city,   to_province,   to_postal_code,
    parcel_mass_kg = 1, parcel_length = 20, parcel_width = 20, parcel_height = 20,
  } = req.body;

  try {
    const result = await shiplogicRequest("POST", "/shipments/rates", {
      collection_address: { suburb: from_suburb, city: from_city, province: from_province, postal_code: from_postal_code, country: "ZA" },
      delivery_address:   { suburb: to_suburb,   city: to_city,   province: to_province,   postal_code: to_postal_code,   country: "ZA" },
      parcels: [{ mass_kg: parcel_mass_kg, length_cm: parcel_length, width_cm: parcel_width, height_cm: parcel_height }],
    });

    res.status(200).json({ success: true, rates: result });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

/* ── BOOK SHIPMENT ── POST /api/delivery/book ─────────────────── */
const bookShipment = async (req, res) => {
  if (!SHIPLOGIC_API_KEY) {
    return res.status(503).json({ success: false, message: "ShipLogic API not configured yet." });
  }

  const { order_id, service_level_code, collection_address, delivery_address, parcel_details, contact } = req.body;

  try {
    const orderResult = await query("SELECT * FROM orders WHERE id = $1", [order_id]);
    if (orderResult.rows.length === 0) return res.status(404).json({ success: false, message: "Order not found." });
    const order = orderResult.rows[0];

    const result = await shiplogicRequest("POST", "/shipments", {
      service_level_code: service_level_code || "ECO",
      collection_address: { ...collection_address, country: "ZA" },
      delivery_address:   { ...delivery_address, country: "ZA" },
      collection_contact: contact.collection,
      delivery_contact:   contact.delivery,
      parcels:            parcel_details || [{ mass_kg: 1, length_cm: 20, width_cm: 20, height_cm: 20 }],
      special_instructions_collection: `Order #${order_id.slice(0, 8).toUpperCase()}`,
      special_instructions_delivery:   order.notes || "",
    });

    if (result.id) {
      const waybill = result.waybill_number;

      await query(
        `UPDATE orders
         SET shiplogic_id    = $1,
             waybill_number  = $2,
             tracking_url    = $3,
             courier_name    = 'tcg',
             status          = 'shipped',
             shipped_at      = NOW(),
             updated_at      = NOW()
         WHERE id = $4`,
        [result.id, waybill, `https://www.thecourierguy.co.za/track/?waybill=${waybill}`, order_id]
      );

      await query(
        `INSERT INTO tracking_events (order_id, waybill, status, description, source)
         VALUES ($1, $2, 'booked', 'Shipment booked with The Courier Guy via ShipLogic', 'shiplogic')`,
        [order_id, waybill]
      );

      res.status(200).json({
        success:     true,
        shiplogic_id: result.id,
        waybill,
        tracking_url: `https://www.thecourierguy.co.za/track/?waybill=${waybill}`,
        message:     `Shipment booked! Waybill: ${waybill}`,
      });
    } else {
      throw new Error(JSON.stringify(result));
    }
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

/* ── SHIPLOGIC WEBHOOK ── POST /api/delivery/webhook ─────────── */
const handleWebhook = async (req, res) => {
  const { waybill_number, status, location, timestamp, description } = req.body;

  if (!waybill_number) {
    return res.status(400).json({ success: false, message: "Missing waybill_number." });
  }

  const orderResult = await query(
    "SELECT id, buyer_id FROM orders WHERE waybill_number = $1",
    [waybill_number.toUpperCase()]
  );

  if (orderResult.rows.length > 0) {
    const order = orderResult.rows[0];

    await query(
      `INSERT INTO tracking_events (order_id, waybill, status, description, location, event_time, source)
       VALUES ($1, $2, $3, $4, $5, $6, 'shiplogic')`,
      [order.id, waybill_number, status, description || status, location || null, timestamp ? new Date(timestamp) : new Date()]
    );

    if (status === "delivered") {
      await query("UPDATE orders SET status = 'delivered', delivered_at = NOW() WHERE id = $1", [order.id]);

      try {
        const { sendNotification } = require("./notificationController");
        await sendNotification(
          order.buyer_id,
          "order_delivered",
          "Order delivered! 🎉",
          `Your parcel (${waybill_number}) has been delivered. Enjoy your purchase!`,
          { order_id: order.id }
        );
      } catch { /* non-critical */ }
    }
  }

  res.status(200).json({ success: true });
};

module.exports = {
  addWaybill,
  getTracking,
  getOrderTracking,
  getQuote,
  bookShipment,
  handleWebhook,
};

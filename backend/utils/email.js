/* ══════════════════════════════════════════════════════════════
   MAIZU EMAIL INFRASTRUCTURE (Task C1)
   - sendEmail(): Resend-backed, NEVER throws — email failure must
     never break an order, approval, or payout.
   - Templates return { subject, html } and are wired by callers:
       orderConfirmationEmail  → orderController.placeOrder
       boostInvoiceEmail       → adminController.approveBoost /
                                 approveSubscription (already probing)
       payoutConfirmationEmail → payouts (Task L2, future)
   - getNextReceiptNumber(): MZU-2026-000001 style, backed by a
     Postgres sequence (see sql instructions in the PR).
   Requires env: RESEND_API_KEY. Optional: EMAIL_FROM
   (defaults to Maizu <noreply@maizu.co.za> — the domain must be
   verified in Resend before this FROM works; use
   "Maizu <onboarding@resend.dev>" for pre-DNS testing).
   NOTE: no VAT line on any invoice — VAT registration unconfirmed.
══════════════════════════════════════════════════════════════ */
const { query } = require("../config/db");

const FROM = process.env.EMAIL_FROM || "Maizu <noreply@maizu.co.za>";

let resendClient = null;
function getClient() {
  if (!process.env.RESEND_API_KEY) return null;
  if (!resendClient) {
    const { Resend } = require("resend");
    resendClient = new Resend(process.env.RESEND_API_KEY);
  }
  return resendClient;
}

/* ── SEND ─────────────────────────────────────────────────────── */
async function sendEmail({ to, subject, html }) {
  try {
    const client = getClient();
    if (!client) {
      console.warn(`[email] RESEND_API_KEY not set — skipped: "${subject}" → ${to}`);
      return { sent: false, reason: "no_api_key" };
    }
    const { data, error } = await client.emails.send({ from: FROM, to, subject, html });
    if (error) {
      console.error(`[email] send failed: "${subject}" → ${to}:`, error.message || error);
      return { sent: false, reason: String(error.message || error) };
    }
    console.log(`[email] sent: "${subject}" → ${to} (id ${data?.id})`);
    return { sent: true, id: data?.id };
  } catch (err) {
    console.error(`[email] unexpected error: "${subject}" → ${to}:`, err.message);
    return { sent: false, reason: err.message };
  }
}

/* ── RECEIPT NUMBERS ── MZU-2026-000001 ───────────────────────── */
async function getNextReceiptNumber() {
  try {
    const result = await query("SELECT nextval('receipt_seq') AS n");
    const n = String(result.rows[0].n).padStart(6, "0");
    return `MZU-${new Date().getFullYear()}-${n}`;
  } catch (err) {
    /* Sequence missing (SQL not run yet) — fall back so emails still send */
    console.warn("[email] receipt_seq missing, using timestamp fallback:", err.message);
    return `MZU-${new Date().getFullYear()}-T${Date.now().toString().slice(-8)}`;
  }
}

/* ── SHARED LAYOUT ────────────────────────────────────────────── */
const R = (v) => `R${Number(v || 0).toFixed(2)}`;

function shell(bodyHtml) {
  return `<!DOCTYPE html>
<html>
<body style="margin:0;padding:0;background-color:#F7F7F5;font-family:Arial,Helvetica,sans-serif;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#F7F7F5;padding:32px 12px;">
    <tr><td align="center">
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:520px;background-color:#FFFFFF;border-radius:14px;overflow:hidden;border:1px solid #E4E4E7;">
        <tr>
          <td style="padding:26px 32px 18px 32px;">
            <span style="font-size:22px;font-weight:900;color:#E8401C;letter-spacing:-0.5px;">maizu</span>
            <span style="font-size:10px;font-weight:700;color:#71717A;letter-spacing:1px;"> BUSINESS HUB</span>
          </td>
        </tr>
        ${bodyHtml}
        <tr>
          <td style="padding:20px 32px 26px 32px;border-top:1px solid #F0F0EE;">
            <p style="margin:0;font-size:11px;color:#A1A1AA;line-height:1.7;">
              Maizu Business Hub (Pty) Ltd &middot; South Africa<br/>
              Questions? Email <a href="mailto:support@maizu.co.za" style="color:#E8401C;text-decoration:none;">support@maizu.co.za</a><br/>
              This is an automated message from maizu.co.za
            </p>
          </td>
        </tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;
}

function row(label, value, opts = {}) {
  const bold  = opts.bold ? "font-weight:800;color:#0F0F0F;" : "color:#52525B;";
  const vbold = opts.bold ? "font-weight:800;color:#0F0F0F;font-size:15px;" : "color:#0F0F0F;font-weight:600;";
  return `<tr>
    <td style="padding:7px 0;font-size:13px;${bold}">${label}</td>
    <td align="right" style="padding:7px 0;font-size:13px;${vbold}">${value}</td>
  </tr>`;
}

/* ── TEMPLATE: ORDER CONFIRMATION (buyer) ─────────────────────── */
function orderConfirmationEmail({ buyerName, orderId, items = [], total, deliveryAddress }) {
  const shortId  = String(orderId).slice(0, 8).toUpperCase();
  const itemRows = items.map(it =>
    row(`${it.name}${it.quantity > 1 ? ` &times; ${it.quantity}` : ""}`, R(it.subtotal ?? (Number(it.price) * Number(it.quantity || 1))))
  ).join("");

  const body = `
    <tr><td style="padding:6px 32px 0 32px;">
      <h1 style="margin:0 0 6px 0;font-size:20px;color:#0F0F0F;">Order confirmed &#127881;</h1>
      <p style="margin:0 0 18px 0;font-size:13px;color:#52525B;line-height:1.6;">
        Hi ${buyerName || "there"}, thanks for shopping on Maizu! Your order
        <strong style="color:#0F0F0F;">#${shortId}</strong> has been placed and the seller has been notified.
      </p>
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border-top:1px solid #F0F0EE;">
        ${itemRows}
        <tr><td colspan="2" style="border-top:1px solid #F0F0EE;padding:0;"></td></tr>
        ${row("Total", R(total), { bold: true })}
      </table>
      ${deliveryAddress ? `<p style="margin:16px 0 0 0;font-size:12px;color:#52525B;line-height:1.6;"><strong style="color:#0F0F0F;">Delivering to:</strong><br/>${deliveryAddress}</p>` : ""}
      <p style="margin:18px 0 22px 0;font-size:12px;color:#52525B;line-height:1.6;">
        Track your order anytime under <strong>My Orders</strong> on maizu.co.za.
      </p>
    </td></tr>`;

  return { subject: `Order #${shortId} confirmed — Maizu`, html: shell(body) };
}

/* ── TEMPLATE: INVOICE / RECEIPT (boost or plan payment) ──────── */
function boostInvoiceEmail({ vendorName, storeName, planName, amount, receiptNumber, paymentMethod, date }) {
  const body = `
    <tr><td style="padding:6px 32px 0 32px;">
      <h1 style="margin:0 0 6px 0;font-size:20px;color:#0F0F0F;">Payment received</h1>
      <p style="margin:0 0 4px 0;font-size:26px;font-weight:900;color:#0F0F0F;">${R(amount)}</p>
      <p style="margin:0 0 18px 0;font-size:12px;color:#10B981;font-weight:700;">Paid &middot; ${date || new Date().toLocaleDateString("en-ZA")}</p>
      <p style="margin:0 0 18px 0;font-size:13px;color:#52525B;line-height:1.6;">
        Hi ${vendorName || "there"}, we've verified your payment. Here's your receipt.
      </p>
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border-top:1px solid #F0F0EE;">
        ${row("Receipt number", receiptNumber || "—")}
        ${row("Item", planName || "—")}
        ${storeName ? row("For", storeName) : ""}
        ${row("Payment method", (paymentMethod || "EFT").toUpperCase())}
        <tr><td colspan="2" style="border-top:1px solid #F0F0EE;padding:0;"></td></tr>
        ${row("Amount paid", R(amount), { bold: true })}
      </table>
      <p style="margin:18px 0 22px 0;font-size:12px;color:#52525B;line-height:1.6;">
        Keep this email for your records. Your benefits are active now.
      </p>
    </td></tr>`;

  return { subject: `Receipt ${receiptNumber || ""} — Maizu`.replace("  ", " "), html: shell(body) };
}

/* ── TEMPLATE: PAYOUT CONFIRMATION (vendor) ───────────────────── */
function payoutConfirmationEmail({ vendorName, amount, reference, periodDescription }) {
  const body = `
    <tr><td style="padding:6px 32px 0 32px;">
      <h1 style="margin:0 0 6px 0;font-size:20px;color:#0F0F0F;">You've been paid &#128176;</h1>
      <p style="margin:0 0 4px 0;font-size:26px;font-weight:900;color:#10B981;">${R(amount)}</p>
      <p style="margin:0 0 18px 0;font-size:13px;color:#52525B;line-height:1.6;">
        Hi ${vendorName || "there"}, your Maizu payout has been sent to your bank account.
        Depending on your bank it may take 1&ndash;2 business days to reflect.
      </p>
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border-top:1px solid #F0F0EE;">
        ${row("Payout reference", reference || "—")}
        ${periodDescription ? row("Sales period", periodDescription) : ""}
        <tr><td colspan="2" style="border-top:1px solid #F0F0EE;padding:0;"></td></tr>
        ${row("Amount paid out", R(amount), { bold: true })}
      </table>
      <p style="margin:18px 0 22px 0;font-size:12px;color:#52525B;line-height:1.6;">
        Full payout history is under <strong>Dashboard &rarr; Payouts</strong>. Keep selling! &#128640;
      </p>
    </td></tr>`;

  return { subject: `Payout sent: ${R(amount)} — Maizu`, html: shell(body) };
}

module.exports = {
  sendEmail,
  getNextReceiptNumber,
  orderConfirmationEmail,
  boostInvoiceEmail,
  payoutConfirmationEmail,
};

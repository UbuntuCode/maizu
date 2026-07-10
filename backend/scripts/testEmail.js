/* Sends one sample of each email template.
   Usage:  node scripts/testEmail.js you@example.com
   Requires RESEND_API_KEY in backend/.env (otherwise it logs skips). */
require("dotenv").config();
const {
  sendEmail,
  getNextReceiptNumber,
  orderConfirmationEmail,
  boostInvoiceEmail,
  payoutConfirmationEmail,
} = require("../utils/email");

(async () => {
  const to = process.argv[2];
  if (!to) {
    console.error("Usage: node scripts/testEmail.js you@example.com");
    process.exit(1);
  }

  const receipt = await getNextReceiptNumber();
  console.log("Receipt number:", receipt);

  const samples = [
    orderConfirmationEmail({
      buyerName: "Sinethemba",
      orderId: "a1b2c3d4-0000-0000-0000-000000000000",
      items: [
        { name: "Ankara Wrap Dress", quantity: 1, subtotal: 450 },
        { name: "Beaded Bracelet",   quantity: 2, subtotal: 160 },
      ],
      total: 610,
      deliveryAddress: "12 Test Street, Durban, 4001",
    }),
    boostInvoiceEmail({
      vendorName:    "Sinethemba",
      storeName:     "Thandi's Threads",
      planName:      "Growth Boost (14 days)",
      amount:        99,
      receiptNumber: receipt,
      paymentMethod: "EFT",
      date:          new Date().toLocaleDateString("en-ZA"),
    }),
    payoutConfirmationEmail({
      vendorName:        "Sinethemba",
      amount:            1284.5,
      reference:         "MZU-PAYOUT-TEST01",
      periodDescription: "1–7 Jul 2026",
    }),
  ];

  for (const s of samples) {
    const result = await sendEmail({ to, subject: s.subject, html: s.html });
    console.log(`"${s.subject}" →`, result);
  }
  process.exit(0);
})();

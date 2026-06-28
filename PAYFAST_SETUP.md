# PAYFAST INTEGRATION SETUP GUIDE

## Step 1 — Register on PayFast

1. Go to payfast.co.za
2. Click "Sign Up" → choose "Merchant"
3. Fill in your business details
4. Verify your email and bank account
5. Once approved, go to Settings → Integration
6. Copy your:
   - Merchant ID
   - Merchant Key
   - Passphrase (set one under Settings → Integration)

## Step 2 — Add variables to Railway

Go to railway.app → your project → Variables and add:

  PAYFAST_MERCHANT_ID  = your-merchant-id
  PAYFAST_MERCHANT_KEY = your-merchant-key
  PAYFAST_PASSPHRASE   = your-passphrase
  API_URL              = https://your-railway-url.up.railway.app

## Step 3 — Update server.js

In your backend/server.js, find the routeFiles array and add:

  { path: "/api/payment", file: "./routes/paymentRoutes" },

## Step 4 — Copy the new files

Backend:
  backend/controllers/paymentController.js  ← new file
  backend/routes/paymentRoutes.js           ← new file

Frontend:
  frontend/app/checkout/page.tsx            ← replace existing
  frontend/app/payment/success/page.tsx     ← new file
  frontend/app/payment/cancel/page.tsx      ← new file

## Step 5 — Push to GitHub

  cd C:\Users\Sinethamba\maizu
  git add .
  git commit -m "Add PayFast payment integration"
  git push origin main

## Step 6 — Test with sandbox

PayFast gives you a sandbox (test) account automatically.
Use these test card details on the PayFast sandbox page:
  Card number: 4000000000000002
  Expiry: Any future date
  CVV: Any 3 digits

## How it works

1. Buyer fills delivery address → reviews order → clicks "Pay with PayFast"
2. Backend creates the order in database (status: pending)
3. Backend generates PayFast payment form with MD5 signature
4. Frontend auto-submits form → buyer lands on PayFast payment page
5. Buyer pays using card, EFT, or Masterpass
6. PayFast sends ITN (webhook) to /api/payment/notify
7. Backend verifies payment → updates order to "confirmed"
8. PayFast redirects buyer to /payment/success page
9. Buyer sees success screen → vendor sees confirmed order

## Sandbox vs Production

Development (NODE_ENV != production):
  Uses: sandbox.payfast.co.za
  Merchant ID: 10000100 (default sandbox)
  Merchant Key: 46f0cd694581a (default sandbox)

Production (NODE_ENV = production):
  Uses: www.payfast.co.za
  Merchant ID: your real ID from PayFast dashboard
  Merchant Key: your real key from PayFast dashboard

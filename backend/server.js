require("dotenv").config();

const express = require("express");
const cors    = require("cors");
const path    = require("path");

const app  = express();
const PORT = process.env.PORT || 5000;

/* ── CORS: allow custom domain + www + Vercel + local dev ─────
   Previously this only allowed ONE origin (CLIENT_URL).
   That's why www.maizu.co.za was silently blocked — it doesn't
   matter what CLIENT_URL is set to in Railway, only ONE domain
   could ever work at a time. This fixes it to allow all of them.
─────────────────────────────────────────────────────────────── */
const allowedOrigins = [
  "https://www.maizu.co.za",
  "https://maizu.co.za",
  "https://maizu.vercel.app",
  "http://localhost:3000",
  process.env.CLIENT_URL, /* keep this too in case it's set to something else */
].filter(Boolean);

app.use(cors({
  origin: (origin, callback) => {
    /* No origin = mobile apps, curl, server-to-server (e.g. PayFast ITN) — always allow */
    if (!origin) return callback(null, true);

    if (allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      console.warn(`CORS blocked request from origin: ${origin}`);
      callback(new Error("Not allowed by CORS"));
    }
  },
  credentials:    true,
  methods:        ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"],
}));

app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

/* ── Health check ───────────────────────────────────────────── */
app.get("/api/health", (req, res) => {
  res.status(200).json({
    success:   true,
    message:   "Maizu API is running",
    timestamp: new Date().toISOString(),
    auth:      "Supabase",
  });
});

/* ── Routes ─────────────────────────────────────────────────── */
// NOTE: /api/auth is REMOVED — Supabase handles auth directly.
// The frontend calls supabase.auth.signUp / signInWithPassword.

const routeFiles = [
  { path: "/api/vendors",       file: "./routes/vendorRoutes"       },
  { path: "/api/products",      file: "./routes/productRoutes"      },
  { path: "/api/orders",        file: "./routes/orderRoutes"        },
  { path: "/api/reviews",       file: "./routes/reviewRoutes"       },
  { path: "/api/promos",        file: "./routes/promoRoutes"        },
  { path: "/api/featured",      file: "./routes/featuredRoutes"     },
  { path: "/api/wishlist",      file: "./routes/wishlistRoutes"     },
  { path: "/api/admin",         file: "./routes/adminRoutes"        },
  { path: "/api/notifications", file: "./routes/notificationRoutes" },
  { path: "/api/analytics",     file: "./routes/analyticsRoutes"    },
  { path: "/api/subscriptions", file: "./routes/subscriptionRoutes" },
  { path: "/api/delivery",      file: "./routes/deliveryRoutes"     },
  { path: "/api/flutterwave",   file: "./routes/flutterwaveRoutes"  },
  { path: "/api/payfast",       file: "./routes/payfastRoutes"      },
  { path: "/api/verification", file: "./routes/verificationRoutes" },
];{ path: "/api/referrals", file: "./routes/referralRoutes" },

routeFiles.forEach(({ path: routePath, file }) => {
  try {
    const router = require(file);
    app.use(routePath, router);
    console.log(`✅ Loaded: ${routePath}`);
  } catch (err) {
    console.error(`❌ Failed to load ${file}:`, err.message);
    /* Changed from process.exit(1) — one missing/broken route file
       should not take down the entire API. It just won't be available. */
  }
});

/* ── 404 ────────────────────────────────────────────────────── */
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: `Route ${req.method} ${req.originalUrl} not found.`,
  });
});

/* ── Error handler ──────────────────────────────────────────── */
app.use((err, req, res, _next) => {
  console.error("Unhandled error:", err.message);

  if (err.message === "Not allowed by CORS") {
    return res.status(403).json({ success: false, message: "CORS: origin not allowed." });
  }
  if (err.code === "LIMIT_FILE_SIZE") {
    return res.status(400).json({ success: false, message: "File too large. Max 5MB." });
  }

  res.status(err.status || 500).json({
    success: false,
    message: err.message || "Internal server error.",
  });
});

/* ── Start ──────────────────────────────────────────────────── */
app.listen(PORT, () => {
  console.log(`\n🚀 Maizu API → http://localhost:${PORT}`);
  console.log(`🔐 Auth      → Supabase`);
  console.log(`🌍 CORS      → ${allowedOrigins.join(", ")}\n`);
});

module.exports = app;

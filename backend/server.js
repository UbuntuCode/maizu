require("dotenv").config();

const express = require("express");
const cors    = require("cors");
const path    = require("path");

const app  = express();
const PORT = process.env.PORT || 5000;

/* ── Middleware ─────────────────────────────────────────────── */
app.use(cors({
  origin:      process.env.CLIENT_URL || "http://localhost:3000",
  credentials: true,
  methods:     ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"],
}));

app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

/* ── Health check ───────────────────────────────────────────── */
app.get("/api/health", (req, res) => {
  res.status(200).json({
    success:     true,
    message:     "Maizu API is running",
    timestamp:   new Date().toISOString(),
    auth:        "Supabase",
  });
});

/* ── Routes ─────────────────────────────────────────────────── */
// NOTE: /api/auth is REMOVED — Supabase handles auth directly.
// The frontend calls supabase.auth.signUp / signInWithPassword.

const routeFiles = [
  { path: "/api/vendors",  file: "./routes/vendorRoutes" },
  { path: "/api/products", file: "./routes/productRoutes" },
  { path: "/api/reviews", file: "./routes/reviewRoutes" },
  { path: "/api/promos", file: "./routes/promoRoutes" },
  { path: "/api/wishlist", file: "./routes/wishlistRoutes" },
  { path: "/api/analytics", file: "./routes/analyticsRoutes" },
  { path: "/api/orders",   file: "./routes/orderRoutes" },
];

routeFiles.forEach(({ path: routePath, file }) => {
  try {
    const router = require(file);
    app.use(routePath, router);
    console.log(`✅ Loaded: ${routePath}`);
  } catch (err) {
    console.error(`❌ Failed to load ${file}:`, err.message);
    process.exit(1);
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
  console.log(`🌍 CORS      → ${process.env.CLIENT_URL || "http://localhost:3000"}\n`);
});

module.exports = app;

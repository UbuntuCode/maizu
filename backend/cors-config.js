/* ════════════════════════════════════════════════════════════
   CORS CONFIGURATION
   Replace your existing app.use(cors(...)) block in server.js
   with this. This allows requests from both your custom domain
   (www.maizu.co.za and maizu.co.za) and your Vercel domain.
════════════════════════════════════════════════════════════ */

const cors = require("cors");

const allowedOrigins = [
  "https://www.maizu.co.za",
  "https://maizu.co.za",
  "https://maizu.vercel.app",
  "http://localhost:3000", /* local dev */
];

app.use(cors({
  origin: (origin, callback) => {
    /* Allow requests with no origin (mobile apps, curl, Postman) */
    if (!origin) return callback(null, true);

    if (allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      console.warn(`CORS blocked request from origin: ${origin}`);
      callback(new Error("Not allowed by CORS"));
    }
  },
  credentials: true,
  methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"],
}));

/* ════════════════════════════════════════════════════════════
   NOTE: This must come BEFORE your route definitions
   (app.use("/api/products", ...) etc.) in server.js
════════════════════════════════════════════════════════════ */

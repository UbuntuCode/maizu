// ADD THIS LINE to your backend/server.js
// Find the routeFiles array and add the payment route:

// { path: "/api/payment", file: "./routes/paymentRoutes" },

// Your routeFiles array should look like this:
const routeFiles = [
  { path: "/api/vendors",  file: "./routes/vendorRoutes"  },
  { path: "/api/products", file: "./routes/productRoutes" },
  { path: "/api/orders",   file: "./routes/orderRoutes"   },
  { path: "/api/payment",  file: "./routes/paymentRoutes" }, // ← ADD THIS
];

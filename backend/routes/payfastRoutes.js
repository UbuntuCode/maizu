const express = require("express");
const router  = express.Router();
const { protect } = require("../middleware/supabaseAuth");
const { createPayment, handleNotify, verifyOrder } = require("../controllers/payfastController");

/* Public — PayFast calls notify server-to-server, no auth */
router.post("/notify", handleNotify);

/* Protected */
router.post("/create",        protect, createPayment);
router.get("/verify/:orderId",protect, verifyOrder);

module.exports = router;

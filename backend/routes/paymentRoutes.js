const express = require("express");
const router  = express.Router();

const { protect } = require("../middleware/supabaseAuth");
const { createPayment, handleNotify, getOrderStatus } = require("../controllers/paymentController");

/* Public — PayFast calls this directly */
router.post("/notify", handleNotify);

/* Protected */
router.post("/create",      protect, createPayment);
router.get("/order/:id",   protect, getOrderStatus);

module.exports = router;

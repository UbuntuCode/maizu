const express = require("express");
const router  = express.Router();

const { protect } = require("../middleware/supabaseAuth");
const {
  validatePromo, createPromo,
  getMyPromos, togglePromo, deletePromo,
} = require("../controllers/promoController");

router.post("/validate",     protect, validatePromo);
router.post("/",             protect, createPromo);
router.get("/my",            protect, getMyPromos);
router.put("/:id/toggle",    protect, togglePromo);
router.delete("/:id",        protect, deletePromo);

module.exports = router;

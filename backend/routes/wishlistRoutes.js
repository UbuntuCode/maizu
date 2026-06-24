const express = require("express");
const router  = express.Router();

const { protect } = require("../middleware/supabaseAuth");
const {
  getWishlist,
  toggleWishlist,
  checkWishlist,
  removeFromWishlist,
  getProductWishlistCount,
} = require("../controllers/wishlistController");

router.get("/",                 protect, getWishlist);
router.post("/toggle",          protect, toggleWishlist);
router.get("/check",            protect, checkWishlist);
router.delete("/:productId",    protect, removeFromWishlist);
router.get("/count/:productId", protect, getProductWishlistCount);

module.exports = router;

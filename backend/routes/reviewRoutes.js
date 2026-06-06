const express = require("express");
const router  = express.Router();

const { protect } = require("../middleware/supabaseAuth");
const {
  getStoreReviews,
  getProductReviews,
  createReview,
  updateReview,
  deleteReview,
  canReview,
} = require("../controllers/reviewController");

/* Public */
router.get("/store/:storeId",     getStoreReviews);
router.get("/product/:productId", getProductReviews);

/* Protected */
router.get("/can-review",  protect, canReview);
router.post("/",           protect, createReview);
router.put("/:id",         protect, updateReview);
router.delete("/:id",      protect, deleteReview);

module.exports = router;

// src/routes/user.routes.js
const express = require("express");
const {
  getUserProfile, updateProfile, toggleWishlist, getWishlist, leaveReview,
} = require("../controllers/user.controller");
const { authenticate } = require("../middleware/auth.middleware");
const upload = require("../middleware/upload.middleware");

const router = express.Router();

router.get("/wishlist",          authenticate, getWishlist);
router.patch("/profile",         authenticate, upload.single("avatar"), updateProfile);
router.post("/wishlist/:listingId", authenticate, toggleWishlist);
router.get("/:id",               getUserProfile);
router.post("/:id/review",       authenticate, leaveReview);

module.exports = router;

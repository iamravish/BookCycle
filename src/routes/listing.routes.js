// src/routes/listing.routes.js
const express = require("express");
const {
  getListings, getListing, createListing,
  updateListing, deleteListing, getMyListings,
  reportListing, getListingReports,
} = require("../controllers/listing.controller");
const { authenticate, optionalAuth, authorizeAdmin } = require("../middleware/auth.middleware");
const upload = require("../middleware/upload.middleware");

const router = express.Router();

router.get("/",        optionalAuth, getListings);
router.get("/my",      authenticate, getMyListings);
router.get("/reports", authenticate, authorizeAdmin, getListingReports);
router.post("/:id/report", authenticate, reportListing);
router.get("/:id",     optionalAuth, getListing);
router.post("/",       authenticate, upload.array("images", 5), createListing);
router.patch("/:id",   authenticate, upload.array("images", 5), updateListing);
router.delete("/:id",  authenticate, deleteListing);

module.exports = router;

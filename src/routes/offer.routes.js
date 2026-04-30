// src/routes/offer.routes.js
const express = require("express");
const {
  createOffer, getReceivedOffers, getSentOffers, respondToOffer, withdrawOffer,
} = require("../controllers/offer.controller");
const { authenticate } = require("../middleware/auth.middleware");

const router = express.Router();

router.post("/",               authenticate, createOffer);
router.get("/received",        authenticate, getReceivedOffers);
router.get("/sent",            authenticate, getSentOffers);
router.patch("/:id/respond",   authenticate, respondToOffer);
router.patch("/:id/withdraw",  authenticate, withdrawOffer);

module.exports = router;

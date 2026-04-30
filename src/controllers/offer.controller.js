// src/controllers/offer.controller.js
const prisma = require("../utils/prisma");

const OFFER_TYPES_BY_LISTING_TYPE = {
  SELL: ["BUY"],
  RENT: ["RENT"],
  SWAP: ["SWAP"],
  SELL_OR_SWAP: ["BUY", "SWAP"],
  RENT_OR_SELL: ["BUY", "RENT"],
};

// POST /api/offers — make an offer on a listing
const createOffer = async (req, res, next) => {
  try {
    const { listingId, type, message, price, rentDays, swapBookTitle } = req.body;
    const parsedPrice =
      price !== undefined && price !== null && price !== ""
        ? Number.parseFloat(price)
        : null;
    const parsedRentDays =
      rentDays !== undefined && rentDays !== null && rentDays !== ""
        ? Number.parseInt(rentDays, 10)
        : null;

    const listing = await prisma.listing.findUnique({
      where: { id: listingId },
      select: { id: true, sellerId: true, isAvailable: true, listingType: true, title: true },
    });

    if (!listing) return res.status(404).json({ error: "Listing not found." });
    if (!listing.isAvailable) return res.status(400).json({ error: "This listing is no longer available." });
    if (listing.sellerId === req.user.id) return res.status(400).json({ error: "You cannot make an offer on your own listing." });
    if (!OFFER_TYPES_BY_LISTING_TYPE[listing.listingType]?.includes(type)) {
      return res.status(400).json({ error: "This offer type is not allowed for the selected listing." });
    }
    if (type === "BUY" && parsedPrice === null) {
      return res.status(400).json({ error: "A price is required for buy offers." });
    }
    if (parsedPrice !== null && (!Number.isFinite(parsedPrice) || parsedPrice < 0)) {
      return res.status(400).json({ error: "Price must be a valid non-negative number." });
    }
    if (type === "RENT" && (parsedRentDays === null || !Number.isInteger(parsedRentDays) || parsedRentDays <= 0)) {
      return res.status(400).json({ error: "A valid rent duration is required for rent offers." });
    }
    if (type === "SWAP" && !swapBookTitle?.trim()) {
      return res.status(400).json({ error: "Swap offers must include a book title." });
    }

    // Check for duplicate pending offer
    const existing = await prisma.offer.findFirst({
      where: { listingId, buyerId: req.user.id, type, status: "PENDING" },
    });
    if (existing) return res.status(409).json({ error: "You already have a pending offer of this type on this listing." });

    const offer = await prisma.offer.create({
      data: {
        listingId,
        buyerId: req.user.id,
        sellerId: listing.sellerId,
        type,
        message,
        price: parsedPrice,
        rentDays: parsedRentDays,
        swapBookTitle: swapBookTitle || null,
      },
      include: {
        listing: { select: { id: true, title: true, images: true } },
        buyer: { select: { id: true, name: true, avatar: true } },
      },
    });

    res.status(201).json({ message: "Offer sent!", offer });
  } catch (err) {
    next(err);
  }
};

// GET /api/offers/received — offers on my listings
const getReceivedOffers = async (req, res, next) => {
  try {
    const { status } = req.query;

    const offers = await prisma.offer.findMany({
      where: {
        sellerId: req.user.id,
        ...(status && { status }),
      },
      orderBy: { createdAt: "desc" },
      include: {
        listing: { select: { id: true, title: true, images: true } },
        buyer: { select: { id: true, name: true, avatar: true, city: true } },
      },
    });

    res.json({ offers });
  } catch (err) {
    next(err);
  }
};

// GET /api/offers/sent — offers I've made
const getSentOffers = async (req, res, next) => {
  try {
    const { status } = req.query;

    const offers = await prisma.offer.findMany({
      where: {
        buyerId: req.user.id,
        ...(status && { status }),
      },
      orderBy: { createdAt: "desc" },
      include: {
        listing: { select: { id: true, title: true, images: true } },
        seller: { select: { id: true, name: true, avatar: true, city: true } },
      },
    });

    res.json({ offers });
  } catch (err) {
    next(err);
  }
};

// PATCH /api/offers/:id/respond — seller accepts/rejects
const respondToOffer = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { status } = req.body; // ACCEPTED or REJECTED

    if (!["ACCEPTED", "REJECTED"].includes(status)) {
      return res.status(400).json({ error: "Status must be ACCEPTED or REJECTED." });
    }

    const updated = await prisma.$transaction(async (tx) => {
      const offer = await tx.offer.findUnique({ where: { id } });
      if (!offer) return { error: { status: 404, message: "Offer not found." } };
      if (offer.sellerId !== req.user.id) return { error: { status: 403, message: "Not authorized." } };
      if (offer.status !== "PENDING") {
        return { error: { status: 400, message: "This offer is no longer pending." } };
      }

      if (status === "ACCEPTED") {
        const listingUpdate = await tx.listing.updateMany({
          where: { id: offer.listingId, isAvailable: true },
          data: { isAvailable: false },
        });

        if (listingUpdate.count === 0) {
          return {
            error: {
              status: 409,
              message: "This listing is no longer available, so the offer cannot be accepted.",
            },
          };
        }
      }

      const nextOffer = await tx.offer.update({
        where: { id },
        data: { status },
        include: {
          buyer: { select: { id: true, name: true, email: true } },
          listing: { select: { id: true, title: true } },
        },
      });

      if (status === "ACCEPTED") {
        await tx.offer.updateMany({
          where: { listingId: nextOffer.listing.id, id: { not: id }, status: "PENDING" },
          data: { status: "REJECTED" },
        });
      }

      return { offer: nextOffer };
    });

    if (updated.error) {
      return res.status(updated.error.status).json({ error: updated.error.message });
    }

    res.json({ message: `Offer ${status.toLowerCase()}.`, offer: updated.offer });
  } catch (err) {
    next(err);
  }
};

// PATCH /api/offers/:id/withdraw — buyer withdraws offer
const withdrawOffer = async (req, res, next) => {
  try {
    const { id } = req.params;

    const offer = await prisma.offer.findUnique({ where: { id } });
    if (!offer) return res.status(404).json({ error: "Offer not found." });
    if (offer.buyerId !== req.user.id) return res.status(403).json({ error: "Not authorized." });
    if (offer.status !== "PENDING") return res.status(400).json({ error: "Only pending offers can be withdrawn." });

    const updated = await prisma.offer.update({ where: { id }, data: { status: "WITHDRAWN" } });
    res.json({ message: "Offer withdrawn.", offer: updated });
  } catch (err) {
    next(err);
  }
};

module.exports = { createOffer, getReceivedOffers, getSentOffers, respondToOffer, withdrawOffer };

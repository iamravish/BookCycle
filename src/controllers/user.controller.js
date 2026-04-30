// src/controllers/user.controller.js
const prisma = require("../utils/prisma");

// GET /api/users/:id — public profile
const getUserProfile = async (req, res, next) => {
  try {
    const { id } = req.params;

    const user = await prisma.user.findUnique({
      where: { id },
      select: {
        id: true, name: true, avatar: true, bio: true,
        city: true, state: true, createdAt: true,
        _count: { select: { listings: true, reviewsAbout: true } },
        listings: {
          where: { isAvailable: true },
          take: 6,
          orderBy: { createdAt: "desc" },
          select: { id: true, title: true, author: true, price: true, images: true, listingType: true, condition: true },
        },
        reviewsAbout: {
          take: 5,
          orderBy: { createdAt: "desc" },
          include: { reviewer: { select: { id: true, name: true, avatar: true } } },
        },
      },
    });

    if (!user) return res.status(404).json({ error: "User not found." });

    // Average rating
    const ratingResult = await prisma.review.aggregate({
      where: { revieweeId: id },
      _avg: { rating: true },
      _count: true,
    });

    const totalReviews =
      typeof ratingResult._count === "number"
        ? ratingResult._count
        : ratingResult._count?._all || 0;

    res.json({ user: { ...user, avgRating: ratingResult._avg.rating, totalReviews } });
  } catch (err) {
    next(err);
  }
};

// PATCH /api/users/profile — update own profile
const updateProfile = async (req, res, next) => {
  try {
    const { name, phone, city, state, bio } = req.body;
    const avatar = req.file ? `/uploads/${req.file.filename}` : undefined;

    const updated = await prisma.user.update({
      where: { id: req.user.id },
      data: {
        ...(name && { name }),
        ...(phone !== undefined && { phone }),
        ...(city !== undefined && { city }),
        ...(state !== undefined && { state }),
        ...(bio !== undefined && { bio }),
        ...(avatar && { avatar }),
      },
      select: {
        id: true, name: true, email: true, phone: true,
        avatar: true, city: true, state: true, bio: true,
      },
    });

    res.json({ message: "Profile updated!", user: updated });
  } catch (err) {
    next(err);
  }
};

// POST /api/users/wishlist/:listingId — toggle wishlist
const toggleWishlist = async (req, res, next) => {
  try {
    const { listingId } = req.params;
    const listing = await prisma.listing.findUnique({
      where: { id: listingId },
      select: { id: true, sellerId: true, isAvailable: true },
    });

    if (!listing) {
      return res.status(404).json({ error: "Listing not found." });
    }
    if (listing.sellerId === req.user.id) {
      return res.status(400).json({ error: "You cannot wishlist your own listing." });
    }
    if (!listing.isAvailable) {
      return res.status(400).json({ error: "This listing is no longer available." });
    }

    const existing = await prisma.wishlist.findUnique({
      where: { userId_listingId: { userId: req.user.id, listingId } },
    });

    if (existing) {
      await prisma.wishlist.delete({
        where: { userId_listingId: { userId: req.user.id, listingId } },
      });
      return res.json({ message: "Removed from wishlist.", wishlisted: false });
    }

    await prisma.wishlist.create({ data: { userId: req.user.id, listingId } });
    res.status(201).json({ message: "Added to wishlist.", wishlisted: true });
  } catch (err) {
    next(err);
  }
};

// GET /api/users/wishlist — get my wishlist
const getWishlist = async (req, res, next) => {
  try {
    const wishlist = await prisma.wishlist.findMany({
      where: { userId: req.user.id },
      orderBy: { createdAt: "desc" },
      include: {
        listing: {
          include: {
            seller: { select: { id: true, name: true, avatar: true, city: true } },
          },
        },
      },
    });

    res.json({ wishlist: wishlist.map((w) => w.listing) });
  } catch (err) {
    next(err);
  }
};

// POST /api/users/:id/review — leave a review
const leaveReview = async (req, res, next) => {
  try {
    const { id: revieweeId } = req.params;
    const { rating, comment } = req.body;
    const parsedRating = Number.parseInt(rating, 10);

    if (revieweeId === req.user.id) {
      return res.status(400).json({ error: "You cannot review yourself." });
    }

    if (!Number.isInteger(parsedRating) || parsedRating < 1 || parsedRating > 5) {
      return res.status(400).json({ error: "Rating must be between 1 and 5." });
    }

    const reviewee = await prisma.user.findUnique({
      where: { id: revieweeId },
      select: { id: true },
    });
    if (!reviewee) {
      return res.status(404).json({ error: "User not found." });
    }

    // Check if reviewer has completed a transaction with reviewee
    // (optional strict check – disabled for flexibility)

    const existing = await prisma.review.findFirst({
      where: { reviewerId: req.user.id, revieweeId },
    });
    if (existing) return res.status(409).json({ error: "You have already reviewed this user." });

    const review = await prisma.review.create({
      data: { reviewerId: req.user.id, revieweeId, rating: parsedRating, comment },
      include: { reviewer: { select: { id: true, name: true, avatar: true } } },
    });

    res.status(201).json({ message: "Review submitted!", review });
  } catch (err) {
    next(err);
  }
};

module.exports = { getUserProfile, updateProfile, toggleWishlist, getWishlist, leaveReview };

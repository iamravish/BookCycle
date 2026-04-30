// src/controllers/listing.controller.js
const prisma = require("../utils/prisma");

const ALLOWED_SORT_FIELDS = new Set(["createdAt", "price", "views", "updatedAt", "title"]);

const parsePositiveInt = (value, fallback) => {
  const parsed = Number.parseInt(value, 10);
  return Number.isInteger(parsed) && parsed > 0 ? parsed : fallback;
};

const parseOptionalFloat = (value) => {
  if (value === undefined || value === null || value === "") {
    return undefined;
  }

  const parsed = Number.parseFloat(value);
  return Number.isFinite(parsed) ? parsed : undefined;
};

const parseNullableFloat = (value) => {
  if (value === undefined) {
    return undefined;
  }

  if (value === null || value === "") {
    return null;
  }

  const parsed = Number.parseFloat(value);
  return Number.isFinite(parsed) ? parsed : undefined;
};

const parseBooleanInput = (value) => {
  if (value === undefined) {
    return undefined;
  }

  if (typeof value === "boolean") {
    return value;
  }

  if (typeof value === "string") {
    const normalized = value.trim().toLowerCase();
    if (normalized === "true") return true;
    if (normalized === "false") return false;
  }

  return undefined;
};

// GET /api/listings  — with search, filter, pagination
const getListings = async (req, res, next) => {
  try {
    const {
      page = 1,
      limit = 12,
      search,
      genre,
      condition,
      listingType,
      city,
      state,
      minPrice,
      maxPrice,
      sortBy = "createdAt",
      order = "desc",
    } = req.query;

    const parsedPage = parsePositiveInt(page, 1);
    const parsedLimit = Math.min(parsePositiveInt(limit, 12), 50);
    const safeSortBy = ALLOWED_SORT_FIELDS.has(sortBy) ? sortBy : "createdAt";
    const safeOrder = order === "asc" ? "asc" : "desc";
    const skip = (parsedPage - 1) * parsedLimit;
    const parsedMinPrice = parseOptionalFloat(minPrice);
    const parsedMaxPrice = parseOptionalFloat(maxPrice);

    const where = {
      isAvailable: true,
      ...(search && {
        OR: [
          { title: { contains: search, mode: "insensitive" } },
          { author: { contains: search, mode: "insensitive" } },
          { isbn: { contains: search, mode: "insensitive" } },
        ],
      }),
      ...(genre && { genre }),
      ...(condition && { condition }),
      ...(listingType && { listingType }),
      ...(city && { city: { contains: city, mode: "insensitive" } }),
      ...(state && { state: { contains: state, mode: "insensitive" } }),
      ...(parsedMinPrice !== undefined || parsedMaxPrice !== undefined
        ? { price: { gte: parsedMinPrice, lte: parsedMaxPrice } }
        : {}),
    };

    const [listings, total] = await Promise.all([
      prisma.listing.findMany({
        where,
        skip,
        take: parsedLimit,
        orderBy: { [safeSortBy]: safeOrder },
        include: {
          seller: { select: { id: true, name: true, avatar: true, city: true, state: true } },
          _count: { select: { offers: true, wishlisted: true } },
        },
      }),
      prisma.listing.count({ where }),
    ]);

    res.json({
      listings,
      pagination: {
        total,
        page: parsedPage,
        limit: parsedLimit,
        totalPages: Math.ceil(total / parsedLimit),
      },
    });
  } catch (err) {
    next(err);
  }
};

// GET /api/listings/:id
const getListing = async (req, res, next) => {
  try {
    const { id } = req.params;

    const listing = await prisma.listing.findUnique({
      where: { id },
      include: {
        seller: {
          select: {
            id: true, name: true, avatar: true, city: true, state: true,
            createdAt: true,
            _count: { select: { listings: true, reviewsAbout: true } },
          },
        },
        _count: { select: { offers: true, wishlisted: true } },
      },
    });

    if (!listing) {
      return res.status(404).json({ error: "Listing not found." });
    }

    // Increment view count (fire and forget)
    prisma.listing.update({ where: { id }, data: { views: { increment: 1 } } }).catch(() => {});

    res.json({ listing });
  } catch (err) {
    next(err);
  }
};

// POST /api/listings
const createListing = async (req, res, next) => {
  try {
    const {
      title, author, description, isbn, genre, condition,
      price, listingType, rentPerDay, city, state,
    } = req.body;
    const resolvedCity = city || req.user.city;
    const resolvedState = state || req.user.state;

    if (!resolvedCity || !resolvedState) {
      return res.status(400).json({
        error: "City and state are required either in the listing or in your profile.",
      });
    }

    const images = req.files ? req.files.map((f) => `/uploads/${f.filename}`) : [];
    const parsedPrice = price !== undefined && price !== null && price !== ""
      ? Number.parseFloat(price)
      : null;
    const parsedRentPerDay = rentPerDay !== undefined && rentPerDay !== null && rentPerDay !== ""
      ? Number.parseFloat(rentPerDay)
      : null;

    const listing = await prisma.listing.create({
      data: {
        title,
        author,
        description,
        isbn,
        genre,
        condition,
        price: Number.isFinite(parsedPrice) ? parsedPrice : null,
        listingType,
        rentPerDay: Number.isFinite(parsedRentPerDay) ? parsedRentPerDay : null,
        images,
        city: resolvedCity,
        state: resolvedState,
        sellerId: req.user.id,
      },
      include: {
        seller: { select: { id: true, name: true, avatar: true } },
      },
    });

    res.status(201).json({ message: "Listing created!", listing });
  } catch (err) {
    next(err);
  }
};

// PATCH /api/listings/:id
const updateListing = async (req, res, next) => {
  try {
    const { id } = req.params;

    const listing = await prisma.listing.findUnique({ where: { id } });
    if (!listing) return res.status(404).json({ error: "Listing not found." });
    if (listing.sellerId !== req.user.id) {
      return res.status(403).json({ error: "You can only edit your own listings." });
    }

    const {
      title, author, description, isbn, genre, condition,
      price, listingType, rentPerDay, city, state, isAvailable,
    } = req.body;

    const newImages = req.files?.map((f) => `/uploads/${f.filename}`) || [];
    const images = newImages.length > 0 ? newImages : undefined;
    const parsedIsAvailable = parseBooleanInput(isAvailable);
    const parsedPrice = parseNullableFloat(price);
    const parsedRentPerDay = parseNullableFloat(rentPerDay);

    const updated = await prisma.listing.update({
      where: { id },
      data: {
        ...(title && { title }),
        ...(author && { author }),
        ...(description !== undefined && { description }),
        ...(isbn !== undefined && { isbn }),
        ...(genre && { genre }),
        ...(condition && { condition }),
        ...(parsedPrice !== undefined && { price: parsedPrice }),
        ...(listingType && { listingType }),
        ...(parsedRentPerDay !== undefined && { rentPerDay: parsedRentPerDay }),
        ...(images && { images }),
        ...(city && { city }),
        ...(state && { state }),
        ...(parsedIsAvailable !== undefined && { isAvailable: parsedIsAvailable }),
      },
    });

    res.json({ message: "Listing updated!", listing: updated });
  } catch (err) {
    next(err);
  }
};

// DELETE /api/listings/:id
const deleteListing = async (req, res, next) => {
  try {
    const { id } = req.params;

    const listing = await prisma.listing.findUnique({ where: { id } });
    if (!listing) return res.status(404).json({ error: "Listing not found." });
    if (listing.sellerId !== req.user.id && !req.user.isAdmin) {
      return res.status(403).json({ error: "You can only delete your own listings." });
    }

    await prisma.listing.delete({ where: { id } });

    res.json({ message: "Listing deleted successfully." });
  } catch (err) {
    next(err);
  }
};

const reportListing = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { reason } = req.body;

    const listing = await prisma.listing.findUnique({ where: { id } });
    if (!listing) {
      return res.status(404).json({ error: "Listing not found." });
    }
    if (listing.sellerId === req.user.id) {
      return res.status(403).json({ error: "You cannot report your own listing." });
    }

    const existingReport = await prisma.listingReport.findUnique({
      where: {
        reporterId_listingId: {
          reporterId: req.user.id,
          listingId: id,
        },
      },
    });

    if (existingReport) {
      return res.status(200).json({ message: "You have already reported this listing." });
    }

    await prisma.listingReport.create({
      data: {
        listingId: id,
        reporterId: req.user.id,
        reason: reason?.trim() || "Flagged by user",
      },
    });

    res.status(201).json({ message: "Listing reported successfully." });
  } catch (err) {
    next(err);
  }
};

const getListingReports = async (req, res, next) => {
  try {
    const reports = await prisma.listingReport.findMany({
      orderBy: { createdAt: "desc" },
      include: {
        listing: {
          select: {
            id: true,
            title: true,
            author: true,
            city: true,
            state: true,
            sellerId: true,
            isAvailable: true,
          },
        },
        reporter: {
          select: { id: true, name: true, email: true },
        },
      },
    });

    res.json({ reports });
  } catch (err) {
    next(err);
  }
};

// GET /api/listings/my/listings — current user's listings
const getMyListings = async (req, res, next) => {
  try {
    const { page = 1, limit = 12 } = req.query;
    const parsedPage = parsePositiveInt(page, 1);
    const parsedLimit = Math.min(parsePositiveInt(limit, 12), 50);
    const skip = (parsedPage - 1) * parsedLimit;

    const [listings, total] = await Promise.all([
      prisma.listing.findMany({
        where: { sellerId: req.user.id },
        skip,
        take: parsedLimit,
        orderBy: { createdAt: "desc" },
        include: { _count: { select: { offers: true, wishlisted: true } } },
      }),
      prisma.listing.count({ where: { sellerId: req.user.id } }),
    ]);

    res.json({
      listings,
      pagination: {
        total,
        page: parsedPage,
        limit: parsedLimit,
        totalPages: Math.ceil(total / parsedLimit),
      },
    });
  } catch (err) {
    next(err);
  }
};

module.exports = {
  getListings,
  getListing,
  createListing,
  updateListing,
  deleteListing,
  getMyListings,
  reportListing,
  getListingReports,
};

// src/middleware/error.middleware.js

const errorHandler = (err, req, res, next) => {
  console.error(`[ERROR] ${err.message}`);

  // Prisma errors
  if (err.code === "P2002") {
    const field = err.meta?.target?.[0] || "field";
    return res.status(409).json({ error: `A record with this ${field} already exists.` });
  }
  if (err.code === "P2025") {
    return res.status(404).json({ error: "Record not found." });
  }

  // Validation errors (express-validator)
  if (err.type === "validation") {
    return res.status(422).json({ error: "Validation failed", details: err.errors });
  }

  // Default
  const statusCode = err.statusCode || 500;
  res.status(statusCode).json({
    error: err.message || "Internal server error",
    ...(process.env.NODE_ENV === "development" && { stack: err.stack }),
  });
};

// Helper to create structured errors
const createError = (message, statusCode = 500) => {
  const err = new Error(message);
  err.statusCode = statusCode;
  return err;
};

module.exports = { errorHandler, createError };

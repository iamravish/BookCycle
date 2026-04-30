// src/utils/jwt.utils.js
const jwt = require("jsonwebtoken");

const generateToken = (userId) => {
  return jwt.sign(
    { userId },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN || "7d" }
  );
};

const formatUserResponse = (user) => {
  const { password, ...safeUser } = user;
  return safeUser;
};

module.exports = { generateToken, formatUserResponse };

// src/routes/auth.routes.js
const express = require("express");
const { register, login, getMe, changePassword } = require("../controllers/auth.controller");
const { authenticate } = require("../middleware/auth.middleware");

const router = express.Router();

router.post("/register", register);
router.post("/login", login);
router.get("/me", authenticate, getMe);
router.patch("/change-password", authenticate, changePassword);

module.exports = router;

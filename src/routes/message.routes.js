// src/routes/message.routes.js
const express = require("express");
const { sendMessage, getInbox, getConversation, getUnreadCount } = require("../controllers/message.controller");
const { authenticate } = require("../middleware/auth.middleware");

const router = express.Router();

router.post("/",                authenticate, sendMessage);
router.get("/inbox",            authenticate, getInbox);
router.get("/unread/count",     authenticate, getUnreadCount);
router.get("/:userId",          authenticate, getConversation);

module.exports = router;

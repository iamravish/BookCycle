// src/controllers/message.controller.js
const prisma = require("../utils/prisma");

const parseCountValue = (countValue) => {
  if (typeof countValue === "number") {
    return countValue;
  }

  return countValue?._all || 0;
};

// POST /api/messages — send a message
const sendMessage = async (req, res, next) => {
  try {
    const { receiverId, content, listingId } = req.body;

    if (receiverId === req.user.id) {
      return res.status(400).json({ error: "You cannot message yourself." });
    }
    if (!content?.trim()) {
      return res.status(400).json({ error: "Message content cannot be empty." });
    }

    const receiver = await prisma.user.findUnique({ where: { id: receiverId }, select: { id: true } });
    if (!receiver) return res.status(404).json({ error: "Recipient not found." });

    const message = await prisma.message.create({
      data: {
        content,
        senderId: req.user.id,
        receiverId,
        listingId: listingId || null,
      },
      include: {
        sender: { select: { id: true, name: true, avatar: true } },
        receiver: { select: { id: true, name: true, avatar: true } },
      },
    });

    res.status(201).json({ message: "Message sent!", data: message });
  } catch (err) {
    next(err);
  }
};

// GET /api/messages/inbox — all conversations for current user
const getInbox = async (req, res, next) => {
  try {
    // Get all unique conversation partners
    const messages = await prisma.message.findMany({
      where: {
        OR: [{ senderId: req.user.id }, { receiverId: req.user.id }],
      },
      orderBy: { createdAt: "desc" },
      include: {
        sender: { select: { id: true, name: true, avatar: true } },
        receiver: { select: { id: true, name: true, avatar: true } },
      },
    });

    // Deduplicate by conversation partner, keeping latest message
    const seen = new Set();
    const conversations = [];
    for (const msg of messages) {
      const partnerId = msg.senderId === req.user.id ? msg.receiverId : msg.senderId;
      if (!seen.has(partnerId)) {
        seen.add(partnerId);
        conversations.push({
          partner: msg.senderId === req.user.id ? msg.receiver : msg.sender,
          lastMessage: msg,
          unreadCount: 0, // populated below
        });
      }
    }

    // Get unread counts per partner
    const unreadCounts = await prisma.message.groupBy({
      by: ["senderId"],
      where: { receiverId: req.user.id, isRead: false },
      _count: true,
    });

    const unreadMap = {};
    for (const uc of unreadCounts) {
      unreadMap[uc.senderId] = parseCountValue(uc._count);
    }

    conversations.forEach((c) => {
      c.unreadCount = unreadMap[c.partner.id] || 0;
    });

    res.json({ conversations });
  } catch (err) {
    next(err);
  }
};

// GET /api/messages/:userId — conversation with a specific user
const getConversation = async (req, res, next) => {
  try {
    const { userId } = req.params;
    const { page = 1, limit = 30 } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);

    const messages = await prisma.message.findMany({
      where: {
        OR: [
          { senderId: req.user.id, receiverId: userId },
          { senderId: userId, receiverId: req.user.id },
        ],
      },
      orderBy: { createdAt: "desc" },
      skip,
      take: parseInt(limit),
      include: {
        sender: { select: { id: true, name: true, avatar: true } },
      },
    });

    // Mark received messages as read
    await prisma.message.updateMany({
      where: { senderId: userId, receiverId: req.user.id, isRead: false },
      data: { isRead: true },
    });

    res.json({ messages: messages.reverse() }); // oldest first
  } catch (err) {
    next(err);
  }
};

// GET /api/messages/unread/count
const getUnreadCount = async (req, res, next) => {
  try {
    const count = await prisma.message.count({
      where: { receiverId: req.user.id, isRead: false },
    });
    res.json({ unreadCount: count });
  } catch (err) {
    next(err);
  }
};

module.exports = { sendMessage, getInbox, getConversation, getUnreadCount };

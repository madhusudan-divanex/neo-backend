import express from "express";
import authMiddleware from "../../middleware/adminAuth.js";
import Contact from "../../models/Contact.js";

const router = express.Router();

// Patient submits contact form (public)
router.post("/", async (req, res) => {
  try {
    const { name, email, phone, subject, message } = req.body;
    if (!name || !email || !message) return res.status(400).json({ success: false, message: "Name, email and message required" });
    const contact = await Contact.create({ name, email, phone, subject, message });
    res.json({ success: true, message: "Message sent successfully", data: contact });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});

// Admin gets all contacts
router.get("/", authMiddleware, async (req, res) => {
  try {
    const { status, page = 1, limit = 20 } = req.query;
    const filter = status ? { status } : {};
    const total = await Contact.countDocuments(filter);
    const data = await Contact.find(filter).sort({ createdAt: -1 }).skip((page-1)*limit).limit(Number(limit));
    res.json({ success: true, data, total });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});

// Admin marks read / replies
router.put("/:id", authMiddleware, async (req, res) => {
  try {
    const update = { ...req.body };
    if (req.body.reply) { update.repliedAt = new Date(); update.status = "replied"; }
    const contact = await Contact.findByIdAndUpdate(req.params.id, update, { new: true });
    res.json({ success: true, data: contact });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});

export default router;

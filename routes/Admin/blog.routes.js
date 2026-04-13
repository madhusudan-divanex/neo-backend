import express from "express";
import authMiddleware from "../../middleware/adminAuth.js";
import getUploader from "../../config/multerConfig.js";
import Blog from "../../models/Blog.js";

const router = express.Router();
const uploader = getUploader("blogs");

// Get all blogs (public)
router.get("/", async (req, res) => {
  try {
    const { status = "all", page = 1, limit = 10, category } = req.query;
    const filter = {};
    if (status && status !== "all") filter.status = status;
    if (category) filter.category = category;
    const total = await Blog.countDocuments(filter);
    const baseUrl = `${process.env.BACKEND_URL}/uploads/blogs/`;
    const data = await Blog.find(filter).sort({ createdAt: -1 })
      .skip((page - 1) * limit).limit(Number(limit));
    res.json({ success: true, data,baseUrl, total, totalPages: Math.ceil(total / limit) });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});

// Get single blog
router.get("/:id", async (req, res) => {
  try {
    const blog = await Blog.findById(req.params.id);
    if (!blog) return res.status(404).json({ success: false, message: "Not found" });
    const baseUrl = `${process.env.BACKEND_URL}/uploads/blogs/`;
    blog.views = (blog.views || 0) + 1;
    await blog.save();
    res.json({ success: true, data: blog ,baseUrl});
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});

// Create blog (admin only)
router.post("/", authMiddleware, uploader.single("image"), async (req, res) => {
  try {
    const blog = await Blog.create({ ...req.body, image: req.file?.filename, authorId: req.admin?._id });
    res.json({ success: true, data: blog });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});

// Update blog
router.put("/:id", authMiddleware, uploader.single("image"), async (req, res) => {
  try {
    const update = { ...req.body };
    if (req.file) update.image = req.file.filename;
    const blog = await Blog.findByIdAndUpdate(req.params.id, update, { new: true });
    res.json({ success: true, data: blog });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});

// Delete blog
router.delete("/:id", authMiddleware, async (req, res) => {
  try {
    await Blog.findByIdAndDelete(req.params.id);
    res.json({ success: true, message: "Deleted" });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});

export default router;

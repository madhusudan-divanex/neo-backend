import express from "express";
import {
  createFaq,
  getFaqs,
  getFaqById,
  updateFaq,
  deleteFaq
} from "../../controller/Admin/faq.controller.js";
import adminAuth from "../../middleware/adminAuth.js";

const router = express.Router();

router.post("/", adminAuth, createFaq);          // Add FAQ
router.get("/",  getFaqs);              // List FAQ
router.get("/:id", adminAuth, getFaqById);        // Single FAQ
router.put("/:id", adminAuth, updateFaq);         // Update FAQ
router.delete("/:id", adminAuth, deleteFaq);      // Delete FAQ

export default router;

import express from "express";
import adminAuth from "../../middleware/adminAuth.js";
import {
  getNotifications,
  deleteNotification,
  deleteAllNotifications
} from "../../controller/Admin/notification.controller.js";

const router = express.Router();

router.get("/", adminAuth, getNotifications);
router.delete("/:id", adminAuth, deleteNotification);
router.delete("/", adminAuth, deleteAllNotifications);

export default router;

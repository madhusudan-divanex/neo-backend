import express from "express";
import adminAuth from "../../middleware/adminAuth.js";
import upload from "../../middleware/upload.js";
import {
  getAdminProfile,
  updateAdminProfile,
  saveFcmToken,
} from "../../controller/Admin/profile.controller.js";
import { changeAdminPassword } from "../../controller/Admin/password.controller.js";
import { testPush } from "../../controller/Admin/pushTest.controller.js";
import { actionMedicineRequests, getMedicineRequests } from "../../controller/Admin/editRequest.controller.js";

const router = express.Router();

router.get("/profile", adminAuth, getAdminProfile);

// 🔥 YAHI MISSING THA
router.put(
  "/profile",
  adminAuth,
  upload.single("image"), // 👈 VERY IMPORTANT
  updateAdminProfile
);

router.put("/change-password", adminAuth, changeAdminPassword);
router.post("/save-fcm-token", adminAuth, saveFcmToken);
router.post("/test-push", adminAuth, testPush);
router.get("/medicine-requests",adminAuth, getMedicineRequests);
router.post("/medicine-request", adminAuth,actionMedicineRequests);
export default router;

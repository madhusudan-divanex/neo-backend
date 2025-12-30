import express from "express";

import auth from "../../middleware/auth.js";
import {
  register,
  login,
  forgotPassword,
  verifyOtp,
  resetPassword
} from "../../controller/Hospital/authController.js";

const router = express.Router();

router.post("/register", register);
router.post("/login", login);
router.post("/forgot-password", forgotPassword);
router.post("/verify-otp", verifyOtp);
router.post("/reset-password", resetPassword);

export default router;

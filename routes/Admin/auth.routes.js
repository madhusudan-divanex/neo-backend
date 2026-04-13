import express from "express";
import {
  adminRegister,
  adminLogin,
  adminForgotPassword,
  adminVerifyOtp,
  adminResetPassword
} from "../../controller/Admin/auth.controller.js";

const router = express.Router();

router.post("/register", adminRegister);
router.post("/login", adminLogin);
router.post("/forgot-password", adminForgotPassword);
router.post("/verify-otp", adminVerifyOtp);
router.post("/reset-password", adminResetPassword);

export default router;

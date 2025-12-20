import express from 'express'
import { register, login,forgotPassword,verifyOtp,resetPassword } from "../../controller/Hospital/authController.js";

const authRoutes=express.Router()
authRoutes.post("/register", register);
authRoutes.post("/login", login);
authRoutes.post("/forgot-password", forgotPassword);
authRoutes.post("/verify-otp", verifyOtp);
authRoutes.post("/reset-password", resetPassword);

export default authRoutes

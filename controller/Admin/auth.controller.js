/**
 * Admin Auth Controller — uses User model (role: "admin")
 * Replaces Admin model completely.
 */
import bcrypt from "bcryptjs";
import jwt    from "jsonwebtoken";
import nodemailer from "nodemailer";
import User from "../../models/Hospital/User.js";

/* ── REGISTER ─────────────────────────────────────────────────────── */
export const adminRegister = async (req, res) => {
  try {
    const { name, email, password, contactNumber } = req.body;

    if (!password || password.length < 8)
      return res.status(400).json({ message: "Password min 8 characters" });

    const exists = await User.findOne({ email, role: "admin" });
    if (exists) return res.status(400).json({ message: "Admin already exists" });

    const passwordHash = await bcrypt.hash(password, 10);
    const admin = await User.create({
      name, email, passwordHash,
      contactNumber: contactNumber || "",
      role: "admin",
      created_by: "self",
      created_by_id: null
    });

    res.json({ message: "Admin registered", success: true, admin: { id: admin._id, name: admin.name, email: admin.email } });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

/* ── LOGIN ────────────────────────────────────────────────────────── */
export const adminLogin = async (req, res) => {
  try {
    const { email, password } = req.body;

    const admin = await User.findOne({ email, role: "admin" });
    if (!admin) return res.status(404).json({ message: "Invalid email or not an admin" });

    const match = await admin.comparePassword(password);
    if (!match) return res.status(400).json({ message: "Invalid password" });

    const token = jwt.sign(
      { id: admin._id, role: "admin" },
      process.env.JWT_SECRET,
      { expiresIn: "1y" }
    );

    res.json({
      message: "Admin login successful",
      token,
      admin: { id: admin._id, name: admin.name, email: admin.email }
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

/* ── FORGOT PASSWORD ──────────────────────────────────────────────── */
export const adminForgotPassword = async (req, res) => {
  try {
    const { email } = req.body;
    const admin = await User.findOne({ email, role: "admin" });
    if (!admin) return res.json({ message: "If email exists, OTP sent" });

    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    admin.resetOtp = await bcrypt.hash(otp, 10);
    admin.resetOtpExpire = new Date(Date.now() + 10 * 60 * 1000);
    await admin.save();

    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: { user: process.env.MAIL_USER, pass: process.env.MAIL_PASS }
    });

    await transporter.sendMail({
      to: email,
      subject: "NeoHealth Admin OTP",
      text: `Your OTP is: ${otp}  (valid 10 minutes)`
    });

    res.json({ message: "OTP sent successfully", success: true });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

/* ── VERIFY OTP ───────────────────────────────────────────────────── */
export const adminVerifyOtp = async (req, res) => {
  try {
    const { email, otp } = req.body;
    const admin = await User.findOne({ email, role: "admin" });
    if (!admin) return res.status(404).json({ message: "Admin not found" });

    if (!admin.resetOtpExpire || Date.now() > admin.resetOtpExpire)
      return res.status(400).json({ message: "OTP expired" });

    const valid = await bcrypt.compare(otp, admin.resetOtp);
    if (!valid) return res.status(400).json({ message: "Invalid OTP" });

    // store verification flag temporarily in DB (reuse resetOtpExpire trick)
    admin.resetOtp = "VERIFIED";
    await admin.save();

    res.json({ message: "OTP verified", success: true });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

/* ── RESET PASSWORD ───────────────────────────────────────────────── */
export const adminResetPassword = async (req, res) => {
  try {
    const { email, newPassword } = req.body;
    const admin = await User.findOne({ email, role: "admin" });
    if (!admin) return res.status(404).json({ message: "Admin not found" });

    if (admin.resetOtp !== "VERIFIED")
      return res.status(400).json({ message: "OTP not verified" });

    admin.passwordHash = await bcrypt.hash(newPassword, 10);
    admin.resetOtp = null;
    admin.resetOtpExpire = null;
    await admin.save();

    res.json({ message: "Password reset successful", success: true });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

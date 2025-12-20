import User from "../../models/Hospital/User.js";
import HospitalBasic from "../../models/Hospital/HospitalBasic.js";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import nodemailer from "nodemailer";


const resetPassword = async (req, res) => {
  try {
    const { email, otp, newPassword } = req.body;

    const user = await User.findOne({ email });
    if (!user)
      return res.status(404).json({ message: "User not found" });

    if (user.resetOtp !== otp)
      return res.status(400).json({ message: "Invalid OTP" });

    if (Date.now() > user.resetOtpExpire)
      return res.status(400).json({ message: "OTP expired" });

    const hashed = await bcrypt.hash(newPassword, 10);

    user.passwordHash = hashed;
    user.resetOtp = null;           // clear OTP
    user.resetOtpExpire = null;

    await user.save();

    res.json({ message: "Password reset successfully" });

  } catch (err) {
    res.status(500).json({ message: "Server Error", error: err.message });
  }
};
const verifyOtp = async (req, res) => {
  try {
    const { email, otp } = req.body;

    const user = await User.findOne({ email });
    if (!user)
      return res.status(404).json({ message: "User not found" });

    if (user.resetOtp !== otp)
      return res.status(400).json({ message: "Invalid OTP" });

    if (Date.now() > user.resetOtpExpire)
      return res.status(400).json({ message: "OTP expired" });

    res.json({ message: "OTP verified successfully" });

  } catch (err) {
    res.status(500).json({ message: "Server Error", error: err.message });
  }
};
const forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;

    const user = await User.findOne({ email });
    if (!user)
      return res.status(404).json({ message: "Email not found" });

    const otp = Math.floor(100000 + Math.random() * 900000).toString();

    // ---------- Correct Fields ----------
    user.resetOtp = otp;
    user.resetOtpExpire = Date.now() + 10 * 60 * 1000;

    await user.save();

    // --------------- Send OTP Email ----------------
    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: process.env.MAIL_USER,
        pass: process.env.MAIL_PASS,
      }
    });

    await transporter.sendMail({
      from: process.env.MAIL_USER,
      to: email,
      subject: "Your Password Reset OTP",
      text: `Your OTP is ${otp}`,
    });

    res.json({ message: "OTP sent successfully" });

  } catch (err) {
    res.status(500).json({ message: "Server Error", error: err.message });
  }
};
const register = async (req, res) => {
    try {
        const { name, email, password, hospitalName } = req.body;

        const exists = await User.findOne({ email });
        if (exists) return res.status(400).json({ message: "User already exists" });

        const passwordHash = await bcrypt.hash(password, 10);

        const hospital = await HospitalBasic.create({ hospitalName });

        const user = await User.create({
            name,
            email,
            passwordHash,
            role: "hospital",
            hospitalId: hospital._id
        });

        const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET);

        res.json({ token, user });
    } catch (err) {
        res.status(500).json({ message: "Server error", error: err.message });
    }
};
const login = async (req, res) => {
    try {
        const { email, password } = req.body;

        const user = await User.findOne({ email });
        if (!user) return res.status(404).json({ message: "Invalid email" });

        const match = await user.comparePassword(password);
        if (!match) return res.status(400).json({ message: "Invalid password" });

        const token = jwt.sign(
            { id: user._id, role: user.role, hospitalId: user.hospitalId },
            process.env.JWT_SECRET,
            { expiresIn: "7d" }
        );

        res.json({
            message: "Login successful",
            token,
            user: {
                id: user._id,
                name: user.name,
                email: user.email,
                role: user.role,
                hospitalId: user.hospitalId
            }
        });

    } catch (err) {
        res.status(500).json({ message: "Server error" });
    }
}

export {resetPassword,verifyOtp,forgotPassword,register,login}

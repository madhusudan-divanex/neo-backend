/**
 * Admin Profile Controller — uses User model (role: "admin")
 */
import User from "../../models/Hospital/User.js";

export const getAdminProfile = async (req, res) => {
  try {
    const admin = await User.findById(req.admin._id)
      .select("-passwordHash -resetOtp -resetOtpExpire");

    if (!admin) return res.status(404).json({ message: "Admin not found" });
    res.json({ success: true, data: admin });
  } catch (err) {
    res.status(500).json({ message: "Internal server error" });
  }
};

export const updateAdminProfile = async (req, res) => {
  try {
    const { name, email } = req.body || {};

    const updateData = {};
    if (name) updateData.name = name;
    if (email) updateData.email = email;

    const admin = await User.findByIdAndUpdate(
      req.admin._id, updateData, { new: true }
    ).select("-passwordHash");

    res.json({ success: true, message: "Profile updated", data: admin });
  } catch (err) {
    res.status(500).json({ message: "Internal server error" });
  }
};

export const saveFcmToken = async (req, res) => {
  try {
    const { fcmToken } = req.body;
    if (!fcmToken) return res.status(400).json({ message: "FCM token required" });
    await User.findByIdAndUpdate(req.admin._id, { fcmToken });
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ message: "Failed to save token" });
  }
};

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
    res.status(500).json({ message: err.message });
  }
};

export const updateAdminProfile = async (req, res) => {
  try {
    const { name, mobile, about, contactNumber } = req.body || {};

    const updateData = {};
    if (name)          updateData.name = name;
    if (mobile)        updateData.contactNumber = mobile;    // User model uses contactNumber
    if (contactNumber) updateData.contactNumber = contactNumber;
    if (about)         updateData.about = about;             // stored in extra field
    if (req.file)      updateData.profileImage = req.file.filename;

    const admin = await User.findByIdAndUpdate(
      req.admin._id, updateData, { new: true }
    ).select("-passwordHash");

    res.json({ success: true, message: "Profile updated", data: admin });
  } catch (err) {
    res.status(500).json({ message: err.message });
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

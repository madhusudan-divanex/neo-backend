import bcrypt from "bcryptjs";
import User   from "../../models/Hospital/User.js";

export const changeAdminPassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    if (!currentPassword || !newPassword)
      return res.status(400).json({ message: "All fields required" });

    const admin = await User.findById(req.admin._id);
    const isMatch = await bcrypt.compare(currentPassword, admin.passwordHash);
    if (!isMatch) return res.status(400).json({ message: "Current password incorrect" });

    if (newPassword.length < 8)
      return res.status(400).json({ message: "Password must be at least 8 characters" });

    admin.passwordHash = await bcrypt.hash(newPassword, 10);
    await admin.save();
    res.json({ success: true, message: "Password changed successfully" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

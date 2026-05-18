import Notification from "../../models/Notifications.js";

/* GET ALL NOTIFICATIONS */
export const getNotifications = async (req, res) => {
  const page = req.query.page || 1;
  const limit = req.query.limit || 10;
  const skip = (page - 1) * limit;
  try {

    const notifications = await Notification
      .find({})
      .sort({ createdAt: -1 })   // DESC order (latest first)
      .skip(skip)
      .limit(limit);
    const total = await Notification.countDocuments();
    const totalPages = Math.ceil(total / limit);
    res.json({
      success: true,
      totalPages,
      currentPage: page,
      data: notifications
    });

  } catch (err) {
    res.status(500).json({
      message: "Failed to load notifications",
      error: err.message
    });
  }
};

/* DELETE ONE */
export const deleteNotification = async (req, res) => {
  try {
    await Notification.findByIdAndDelete(req.params.id);
    res.json({ success: true });
  } catch {
    res.status(500).json({ message: "Delete failed" });
  }
};

/* DELETE ALL */
export const deleteAllNotifications = async (req, res) => {
  try {
    await Notification.deleteMany({ userId: req.admin._id });
    res.json({ success: true });
  } catch {
    res.status(500).json({ message: "Delete all failed" });
  }
};

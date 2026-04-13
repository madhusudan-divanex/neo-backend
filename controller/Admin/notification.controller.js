import Notification from "../../models/Notifications.js";

/* GET ALL NOTIFICATIONS */
export const getNotifications = async (req, res) => {
  try {

    const notifications = await Notification
      .find({})
      .sort({ _id: -1 });   // DESC order (latest first)

    res.json({
      success: true,
      count: notifications.length,
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

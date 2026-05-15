import { sendPush } from "../../utils/sendPush.js";

export const testPush = async (req, res) => {
  try {
    const { token } = req.body;

    if (!token) {
      return res.status(400).json({ message: "FCM token required" });
    }

    const response = await sendPush({
      token,
      title: "🔥 Test Notification",
      body: "Backend se test push aa gaya 🚀",
        type: "test"
    });

    res.json({
      success: true,
      message: "Push sent successfully",
      response,
    });

  } catch (err) {
    res.status(500).json({
      success: false,
      message: err.message,
    });
  }
};

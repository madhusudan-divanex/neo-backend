import mongoose from "mongoose";

const notificationSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true
  },
  title: String,
  message: String,
  type: String,
}, { timestamps: true });

const Notification = mongoose.model("Notification", notificationSchema);
export default Notification;

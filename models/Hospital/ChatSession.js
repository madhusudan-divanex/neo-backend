// models/ChatSession.js
import mongoose from "mongoose";

const chatSessionSchema = new mongoose.Schema({
  doctor: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  patient: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  startTime: Date,
  endTime: Date,
  perMinuteCharge: Number,
  totalAmount: Number,
  status: {
    type: String,
    enum: ["active", "ended"]
  }
});

export default mongoose.model("chat_session", chatSessionSchema);

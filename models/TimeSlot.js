// models/TimeSlot.js
import mongoose from "mongoose";

const slotSchema = new mongoose.Schema({
  startTime: { type: String, required: true }, // "08:30"
  endTime: { type: String, required: true }    // "09:00"
}, { _id: true });

const timeSlotSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true
  },
  day: {
    type: String,
    enum: ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"],
    required: true
  },
  slots: [slotSchema]
}, { timestamps: true });

export default mongoose.model("TimeSlot", timeSlotSchema);

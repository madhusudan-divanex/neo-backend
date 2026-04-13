// models/CallLog.js
import mongoose from "mongoose";

const callLogSchema = new mongoose.Schema(
  {
    caller: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User"
    },
    receiver: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User"
    },
    callType: {
      type: String,
      enum: ["voice", "video"]
    },
    startTime: Date,
    endTime: Date,
    duration: Number,
    status: {
      type: String,
      enum: ["missed", "completed", "rejected"],
      default: "completed"
    }
  },
  { timestamps: true }
);

export default mongoose.model("CallLog", callLogSchema);

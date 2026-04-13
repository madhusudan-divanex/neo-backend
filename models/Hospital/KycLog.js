// models/KycLog.js
import mongoose from "mongoose";

const Schema = new mongoose.Schema(
  {
    hospitalId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "HospitalBasic",
      required: true
    },
    changedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User"
    },
    fromStatus: String,
    toStatus: String,
    comment: String
  },
  { timestamps: true }
);

export default mongoose.model("KycLog", Schema);

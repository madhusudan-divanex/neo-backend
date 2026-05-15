import mongoose from "mongoose";

const HospitalFloorSchema = new mongoose.Schema(
  {
    hospitalId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User", // hospital user
      required: true,
      index: true
    },

    floorName: {
      type: String,
      required: true,
      trim: true
    },

    status: {
      type: String,
      enum: ["Active", "Inactive"],
      default: "Active"
    }
  },
  { timestamps: true }
);

export default mongoose.model("HospitalFloor", HospitalFloorSchema);

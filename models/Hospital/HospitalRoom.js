import mongoose from "mongoose";

const HospitalRoomSchema = new mongoose.Schema(
  {
    hospitalId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true
    },

    floorId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "HospitalFloor",
      required: true
    },

    departmentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "HospitalDepartment",
      required: true
    },

    roomName: {
      type: String,
      required: true
    },

    status: {
      type: String,
      enum: ["Active", "Inactive"],
      default: "Active"
    }
  },
  { timestamps: true }
);

export default mongoose.model("HospitalRoom", HospitalRoomSchema);

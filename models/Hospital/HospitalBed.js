import mongoose from "mongoose";

const HospitalBedSchema = new mongoose.Schema(
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
      ref: "Department",
      required: true
    },

    roomId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "HospitalRoom",
      required: true
    },

    bedName: {
      type: String,
      required: true
    },

    pricePerDay: {
      type: Number,
      default: 0
    },
    doctorId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true
    },
    underMaintenance:{type:Boolean,default:false},

    status: {
      type: String,
      enum: ["Available", "Booked", "Inactive"],
      default: "Available"
    }
  },
  { timestamps: true }
);

export default mongoose.model("HospitalBed", HospitalBedSchema);

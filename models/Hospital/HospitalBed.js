import mongoose from 'mongoose';

const HospitalBedSchema = new mongoose.Schema({
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

  status: {
    type: String,
    enum: ["Available", "Booked", "Inactive"],
    default: "Available"
  }

}, { timestamps: true });

const HospitalBed = mongoose.model("HospitalBed", HospitalBedSchema);
export default HospitalBed
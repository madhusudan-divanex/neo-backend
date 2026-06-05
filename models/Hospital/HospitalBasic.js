// models/HospitalBasic.js
import mongoose from "mongoose";

const Schema = new mongoose.Schema(
  {
    hospitalName: String,
    licenseId: String,
    establishedYear: Number,
    mobileNo: String,
    email: String,
    gstNumber: String,
    about: String,
    services: [String],
    category: [{ type: mongoose.Schema.Types.ObjectId, ref: 'hospital-category', }],
    logoFileId: String, // GridFS file id (string)
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', index: true },
    kycStatus: {
      type: String,
      enum: ["draft", "pending", "in_review", "approved", "rejected", "block"],
      default: "pending"
    },
    rating: { type: Number, default: 0, decimal: true },
  },
  { timestamps: true }
);

export default mongoose.model("HospitalBasic", Schema);

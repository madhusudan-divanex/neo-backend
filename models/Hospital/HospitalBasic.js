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
    logoFileId: String, // GridFS file id (string)
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User',index:true }, 
    kycStatus: {
      type: String,
      enum: ["draft", "pending", "in_review", "approved", "rejected"],
      default: "draft"
    }
  },
  { timestamps: true }
);

export default mongoose.model("HospitalBasic", Schema);

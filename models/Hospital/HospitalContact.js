// models/HospitalContact.js
import mongoose from "mongoose";

const Schema = new mongoose.Schema(
  {
    hospitalId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "HospitalBasic",
      required: true
    },
    name: String,
    mobileNumber: String,
    email: String,
    gender: String,
    profilePhotoId: String // GridFS id
  },
  { timestamps: true }
);

export default mongoose.model("HospitalContact", Schema);

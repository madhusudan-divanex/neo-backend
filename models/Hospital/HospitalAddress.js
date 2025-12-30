// models/HospitalAddress.js
import mongoose from "mongoose";

const Schema = new mongoose.Schema(
  {
    hospitalId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "HospitalBasic",
      required: true
    },
    fullAddress: String,
    country: String,
    state: String,
    city: String,
    pinCode: String
  },
  { timestamps: true }
);

export default mongoose.model("HospitalAddress", Schema);

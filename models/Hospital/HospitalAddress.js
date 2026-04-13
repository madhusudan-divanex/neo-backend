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
    country: { type: mongoose.Schema.Types.ObjectId, ref: "Country", required: true },
    state: { type: mongoose.Schema.Types.ObjectId, ref: 'State', required: true },
    city: { type: mongoose.Schema.Types.ObjectId, ref: 'City', required: true },
    pinCode: String
  },
  { timestamps: true }
);

export default mongoose.model("HospitalAddress", Schema);

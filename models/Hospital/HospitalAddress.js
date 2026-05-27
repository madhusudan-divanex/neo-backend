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
    pinCode: String,
    lat: Number,
    long: Number,
    location: {
      type: {
        type: String,
        enum: ['Point'],
        default: 'Point'
      },
      coordinates: {
        type: [Number],
        default: [0, 0]
      }
    },
  },
  { timestamps: true }
);
Schema.index({
  location: "2dsphere"
});
export default mongoose.model("HospitalAddress", Schema);

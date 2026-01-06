import mongoose, { Schema } from "mongoose";

const prescriptionItemSchema = new Schema({
  name: { type: String, required: true },
  fileUrl: { type: String, required: true },
}, { timestamps: true });

const addressSchema = new Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true
  },
  hospitalName: { type: String, required: true },
  fullAddress: { type: String, required: true },
  countryId: { type: mongoose.Schema.Types.ObjectId, ref: "Country", required: true },
  stateId: { type: mongoose.Schema.Types.ObjectId, ref: 'State', required: true },
  cityId: { type: mongoose.Schema.Types.ObjectId, ref: 'City', required: true },
  pinCode: { type: String, required: true },
  specialty: { type: String, required: true },
  treatmentAreas: [{ type: String, required: true }],
  fees: { type: String, required: true },
  language: [{ type: String, required: true }],
  aboutYou: { type: String, required: true },

}, { timestamps: true });

const DoctorAbout = mongoose.model("doctor-about", addressSchema);
export default DoctorAbout

import mongoose, { Schema } from "mongoose";

const prescriptionItemSchema = new Schema({
  name: { type: String, required: true },
  fileUrl: { type: String, required: true },
}, { timestamps: true });
const contactSchema = new Schema({
    emergencyContactName: { type: String, },
    emergencyContactNumber: { type: String, },
})
const addressSchema = new Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true
  },
  contact: contactSchema,
  hospitalName: { type: String},
  fullAddress: { type: String, required: true },
  countryId: { type: mongoose.Schema.Types.ObjectId, ref: "Country", required: true },
  stateId: { type: mongoose.Schema.Types.ObjectId, ref: 'State', required: true },
  cityId: { type: mongoose.Schema.Types.ObjectId, ref: 'City', required: true },
  pinCode: { type: String, required: true },
  specialty: { type: String },
  treatmentAreas: [{ type: String }],
  fees: { type: String ,default:'20'},
  language: [{ type: String }],
  aboutYou: { type: String },

}, { timestamps: true });

const DoctorAbout = mongoose.model("doctor-about", addressSchema);
export default DoctorAbout

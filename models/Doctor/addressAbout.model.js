import mongoose,{ Schema }  from "mongoose";

const prescriptionItemSchema = new Schema({
  name: { type: String, required: true },
  fileUrl: { type: String, required: true },
}, { timestamps: true });

const addressSchema = new Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Doctor",
    required: true
  },
  hospitalName: { type: String, required: true },
  fullAddress: { type: String, required: true },
  country: { type: String, required: true },
  state: { type: String, required: true },
  city: { type: String, required: true },
  pinCode: { type: String, required: true },
  specialty: [{ type: String, required: true }],
  treatmentAreas: [{ type: String, required: true }],
  fees: { type: String, required: true },
  language: [{ type: String, required: true }],
  aboutYou: { type: String, required: true },

}, { timestamps: true });

const DoctorAbout = mongoose.model("doctor-about", addressSchema);
export default DoctorAbout

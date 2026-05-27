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
  hospitalName: { type: String },
  fullAddress: { type: String, required: true },
  countryId: { type: mongoose.Schema.Types.ObjectId, ref: "Country", required: true },
  stateId: { type: mongoose.Schema.Types.ObjectId, ref: 'State', required: true },
  cityId: { type: mongoose.Schema.Types.ObjectId, ref: 'City', required: true },
  pinCode: { type: String, required: true },
  specialty: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "speciality"
  },
  treatmentAreas: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: "speciality"
  }],
  fees: { type: Number, default: 0 },
  language: [{ type: String }],
  aboutYou: { type: String },
  lat: Number,
  long: Number,
  location: {
    type: {
      type: String,
      enum: ['Point'],
      default: 'Point'
    },

    coordinates: {
      type: [Number], // [longitude, latitude]
    }
  },
  clinic: {
    type: Boolean,
    default: false
  }

}, { timestamps: true });
addressSchema.index({
  location: "2dsphere"
});
const DoctorAbout = mongoose.model("doctor-about", addressSchema);
export default DoctorAbout

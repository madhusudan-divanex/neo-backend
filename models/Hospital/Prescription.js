import mongoose from 'mongoose';

const MedicationSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  frequency: { type: String, required: true },
  duration: { type: String, required: true },
  refills: String,
  instructions: String
}, { _id: false });

const PrescriptionSchema = new mongoose.Schema({
  hospitalId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true
  },
  patientId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true
  },
  doctorId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true
  },
  bedId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "HospitalBed",
    default: null
  },
  diagnosis: {
    type: String,
    required: true
  },
  medications: {
    type: [MedicationSchema],
    validate: v => v.length > 0
  },
  notes: String,
  status: {
    type: String,
    enum: ["Active", "Completed"],
    default: "Active"
  }
}, { timestamps: true });

const HospitalPrescription= mongoose.model("Hospital-Prescription", PrescriptionSchema);
export default HospitalPrescription
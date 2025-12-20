import mongoose, { Schema } from "mongoose";

const medicanSchema = new Schema({
    name: { type: String, required: true },
    frequency: { type: String, required: true },
    duration: { type: String, required: true },
    refills: { type: String, required: true },
    instructions: { type: String, required: true }
})
const requestSchema = new Schema({
    doctorId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Doctor',
        required: true
    },
    patientId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Patient',
        required: true
    },
    appointmentId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'doctor-appointment',
        required: true
    },
    medications: [medicanSchema],
    notes: { type: String, required: true },
    diagnosis: { type: String, required: true },
    status: { type: String },
    customId: { type: String, required: true },

}, { timestamps: true })
const Prescriptions = mongoose.model('Prescriptions', requestSchema);
export default Prescriptions
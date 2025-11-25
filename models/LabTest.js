import mongoose, { Schema } from "mongoose";


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
    labId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Laboratory',
        required: true
    },
    testId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Test', required: true
    },
    report: { type: String },
    status: { type: String }

}, { timestamps: true })
const LabTest = mongoose.model('Lab-test', requestSchema);
export default LabTest
import mongoose, { Schema } from "mongoose";

const requestSchema = new Schema({
    labId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User', required: true
    },
    patientId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User', required: true
    },
    doctorId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    },
    testId: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Test', required: true
    }],
    doctorAp: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'doctor-appointment',
    },
    customId: { type: String, required: true },
    date: { type: Date, required: true },
    fees: { type: String, required: true },
    hospitalStaff:{ type: mongoose.Schema.Types.ObjectId,
        ref: 'HospitalStaff'},
    labStaff:{
         type: mongoose.Schema.Types.ObjectId,
        ref: 'lab-staff'
    },
    paymentStatus: { type: String, enum: ['due', 'paid'], default: 'due' },
    status: { type: String, enum: ['pending', 'approved', 'deliver-report', 'pending-report', 'rejected', 'cancel'], default: 'pending' },
    cancelMessage: String

}, { timestamps: true })
const LabAppointment = mongoose.model('lab-appointment', requestSchema);
export default LabAppointment
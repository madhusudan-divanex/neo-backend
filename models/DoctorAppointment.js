import mongoose, { Schema } from "mongoose";

const requestSchema = new Schema({
    doctorId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User', required: true
    },
    patientId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User', required: true
    },
    date: { type: Date, required: true },
    customId: { type: String, required: true },
    fees: { type: String, required: true },
    note: { type: Date },
    labTest: {
        lab: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
        },
        labTests: [{
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Test'
        }]
    },
    prescriptionId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Prescriptions'
    },
    paymentStatus:{type:String,enum:['due','paid'],default:'due'},
    status: { type: String, enum: ['pending', 'approved', 'completed', 'rejected', 'cancel'], default: 'pending', index: true },
    cancelMessage: String

}, { timestamps: true })
const DoctorAppointment = mongoose.model('doctor-appointment', requestSchema);
export default DoctorAppointment
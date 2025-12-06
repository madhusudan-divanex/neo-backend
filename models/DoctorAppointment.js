import mongoose, { Schema } from "mongoose";

const requestSchema = new Schema({
    doctorId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Doctor', required: true
    },
    patientId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Patient', required: true
    },
    date: { type: Date, required: true },
    customId:{type:String,required:true},
    fees: { type: String, required: true },
    note: { type: Date },
    prescriptionId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'prescriptions'
    },
    status: { type: String, enum: ['pending', 'approved', 'completed', 'rejected', 'cancel'], default: 'pending', index: true },
    cancelMessage: String

}, { timestamps: true })
const DoctorAppointment = mongoose.model('doctor-appointment', requestSchema);
export default DoctorAppointment
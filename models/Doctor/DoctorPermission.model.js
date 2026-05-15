import mongoose, { Schema } from "mongoose";

const permissionSchema = new Schema({
    name: { type: String, required: true },
    appointmentlist: { type: Boolean, default: false },
    appointmentAdd: { type: Boolean, default: false },
    appointmentView: { type: Boolean, default: false },
    addPrescription: { type: Boolean, default: false },
    editPrescription: { type: Boolean, default: false },
    deletePrescription: { type: Boolean, default: false },
    addLabTest: { type: Boolean, default: false },
    appointmentStatus: { type: Boolean, default: false },
    chat: { type: Boolean, default: false },
    doctorId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },


}, { timestamps: true })

const DoctorPermission = mongoose.model('doctor-permission', permissionSchema)

export default DoctorPermission
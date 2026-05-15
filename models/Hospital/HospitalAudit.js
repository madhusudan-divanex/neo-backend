import mongoose, { Schema } from "mongoose";

const auditSchema = new Schema({
    hospitalId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true
    },
    actionUser: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User"
    },
    patientId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User"
    },
    note: {
        type:String,
        required:true
    }
}, { timestamps: true })
const HospitalAudit = mongoose.model('HospitalAudit', auditSchema)
export default HospitalAudit
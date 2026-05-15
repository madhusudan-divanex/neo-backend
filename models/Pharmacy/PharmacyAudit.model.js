import mongoose, { Schema } from "mongoose";

const auditSchema = new Schema({
    pharId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true
    },
    actionUser: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "phar-staff",
    },
    note: {
        type:String,
        required:true
    }
}, { timestamps: true })
const PharmacyAudit = mongoose.model('PharmacyAudit', auditSchema)
export default PharmacyAudit
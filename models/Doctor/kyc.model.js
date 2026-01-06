import mongoose, { Schema } from "mongoose"


const kycSchema = new Schema({
    type: { type: String, required: true },
    frontImage: { type: String, required: true }, 
    backImage: { type: String, required: true }    ,
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
}, { timestamps: true })

const PatientKyc = mongoose.model('Doctor-Kyc', kycSchema)

export default PatientKyc
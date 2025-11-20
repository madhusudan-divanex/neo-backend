import mongoose, { Schema } from "mongoose"


const historySchema = new Schema({
    chronicCondition: { type: String, required: true },
    onMedication: { type: Boolean, default: true }, 
    smoking: { type: Boolean, default: true },
    alcohol: { type: Boolean, default: true }, 
    medicationDetail: { type: String}, 
    allergies: { type: String }    ,
    familyHistory:{
        chronicHistory:String,
        diseasesInFamiy:String
    },
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'Patient', required: true },
}, { timestamps: true })

const MedicalHistory = mongoose.model('medical-history', historySchema)

export default MedicalHistory
import mongoose, { Schema } from "mongoose"


const demographicSchema = new Schema({
    height: { type: String, required: true },
    weight: { type: String, required: true }, 
    bloodGroup: { type: String, required: true }, 
    dob: { type: Date, required: true }    ,
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true,index:true },
}, { timestamps: true })

const PatientDemographic = mongoose.model('Patient-Demographic', demographicSchema)

export default PatientDemographic
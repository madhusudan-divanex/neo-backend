import mongoose, { Schema } from "mongoose"

const contactSchema=new Schema({   
    emergencyContactName: { type: String,  },
    emergencyContactNumber: { type: String, },    
})
const demographicSchema = new Schema({
    height: { type: String, required: true },
    weight: { type: String, required: true }, 
    bloodGroup: { type: String, required: true }, 
    dob: { type: Date, required: true }    ,
    contact:contactSchema,
    address: { type: String }    ,
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true,index:true },
}, { timestamps: true })

const PatientDemographic = mongoose.model('Patient-Demographic', demographicSchema)

export default PatientDemographic
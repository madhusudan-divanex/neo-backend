import mongoose, { Schema } from "mongoose";

const spSchema=new Schema({    
    image:{
        type:String,
        required:true
    },
})
const PatientBanner=mongoose.model('patient-banner',spSchema)

export default PatientBanner
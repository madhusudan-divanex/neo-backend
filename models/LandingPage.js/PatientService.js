import mongoose, { Schema } from "mongoose";

const firstPharSchema=new Schema({
    title:String,
    image:String,
    description:String,
    btnLink:String,
},{timestamps:true})
const PatientService=mongoose.model('service-patient-page',firstPharSchema)
export default PatientService;
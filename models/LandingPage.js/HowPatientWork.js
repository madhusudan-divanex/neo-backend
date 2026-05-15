import mongoose, { Schema } from "mongoose";

const firstPharSchema=new Schema({
    title:String,
    image:String,
    description:String,
},{timestamps:true})
const HowItWorkPT=mongoose.model('howworks-patient-page',firstPharSchema)
export default HowItWorkPT;
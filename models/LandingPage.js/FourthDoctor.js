import mongoose, { Schema } from "mongoose";

const fourthDoctorSchema=new Schema({
    title:String,
    description:String, 
    model:[{title:String,description:String}]
},{timestamps:true})
const FourthDoctor=mongoose.model('fourth-doctor-page',fourthDoctorSchema)
export default FourthDoctor;
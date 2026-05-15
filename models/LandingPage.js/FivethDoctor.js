import mongoose, { Schema } from "mongoose";

const fivethDoctorSchema=new Schema({
    tag:String,
    title:String,
    description:String, 
    btnLink:String
},{timestamps:true})
const FivethDoctor=mongoose.model('fiveth-doctor-page',fivethDoctorSchema)
export default FivethDoctor;
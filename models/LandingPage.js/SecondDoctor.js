import mongoose, { Schema } from "mongoose";

const secondDoctorSchema=new Schema({
    title:String,
    description:String, 
    model:[{name:String,title:String,description:String}]
},{timestamps:true})
const SecondDoctor=mongoose.model('second-doctor-page',secondDoctorSchema)
export default SecondDoctor;
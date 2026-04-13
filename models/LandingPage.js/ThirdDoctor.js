import mongoose, { Schema } from "mongoose";

const thirdDoctorSchema=new Schema({
    title:String,
    description:String, 
    model:[{title:String,description:String}]
},{timestamps:true})
const ThirdDoctor=mongoose.model('third-doctor-page',thirdDoctorSchema)
export default ThirdDoctor;
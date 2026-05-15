import mongoose, { Schema } from "mongoose";

const firstDoctorSchema=new Schema({
    firstTitle:String,
    secondTitle:String,
    description:String, 
    btnLink:String,   
    appUiShot:[String],
    topShot:[String],
    bottomShot:[{label:String,value:String}],
    bottomDesc:String,
    appUiDesc:String,
},{timestamps:true})
const FirstDoctor=mongoose.model('first-doctor-page',firstDoctorSchema)
export default FirstDoctor;
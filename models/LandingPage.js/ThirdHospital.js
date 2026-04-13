import mongoose, { Schema } from "mongoose";

const firstLabSchema=new Schema({
    title:String,
    description:String,   
    bottomShot:[{category:String,title:String,subTitle:String,detail:String}],
    phasedRollout:{desc:String,firstLink:String,secondLink:String},
},{timestamps:true})
const ThirdHospital=mongoose.model('third-hospital-page',firstLabSchema)
export default ThirdHospital;
import mongoose, { Schema } from "mongoose";

const firstLabSchema=new Schema({
    title:String,
    subTitle:String,
    description:String,  
    btnLink:{first:String,second:String},  
    topShot:[String],
    bottomShot:[{category:String,title:String,detail:String}]
},{timestamps:true})
const FirstHospital=mongoose.model('first-hospital-page',firstLabSchema)
export default FirstHospital;
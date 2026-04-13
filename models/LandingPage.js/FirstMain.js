import mongoose, { Schema } from "mongoose";

const firstDoctorSchema=new Schema({
    title:String,
    description:String, 
    btnLink:{first:String,second:String},   
    appUiShot:[String],
    topShot:[String],
    bottomShot:[{label:String,value:String}],
    bottomDesc:String,
    appUiDesc:String,
    neoHealthCard:{
        title:String,
        subTitle:String,
        topShot:[String],
        feature:[{image:String,title:String,desc:String}],
        neoAiDesc:String
    }
},{timestamps:true})
const FirstMain=mongoose.model('first-main-page',firstDoctorSchema)
export default FirstMain;
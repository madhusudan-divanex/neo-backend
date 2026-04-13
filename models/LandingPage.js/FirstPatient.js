import mongoose, { Schema } from "mongoose";

const firstPharSchema=new Schema({
    heroTitle:String,
    heroImage:String,
    heroDesc:String,
    servicesDesc:String,
    doctorDesc:String,
    testCategoryDesc:String,
    hospitalDesc:String,
    howItWorks:String,
    howItWorkImage:String,
    blogDesc:String,
    downloadTitle:String,
    downloadDesc:String,
    downloadImage:String,
    playStore:String,
    appStore:String,
    testimonialDesc:String,
    category:[{value:String,label:String,panel:String}]
},{timestamps:true})
const FirstPatient=mongoose.model('first-patient-page',firstPharSchema)
export default FirstPatient;
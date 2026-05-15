import mongoose, { Schema } from "mongoose";

const firstLabSchema=new Schema({
    firstTitle:String,
    secondTitle:String,
    description:String,    
    snapShot:[String],
    topShot:[String],
    bottomShot:[{label:String,value:String}]
},{timestamps:true})
const FirstLab=mongoose.model('first-lab-page',firstLabSchema)
export default FirstLab;
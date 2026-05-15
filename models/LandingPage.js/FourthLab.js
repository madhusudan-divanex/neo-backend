import mongoose, { Schema } from "mongoose";

const fourthLabSchema=new Schema({
    topTitle:String,
    title:String,
    description:String,
    model:[{
    image:String,
    name:String,
    description:String
    }]
},{timestamps:true})
const FourthLab=mongoose.model('fourth-lab-page',fourthLabSchema)
export default FourthLab;
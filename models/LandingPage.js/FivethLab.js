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
const FivethLab=mongoose.model('fiveth-lab-page',fourthLabSchema)
export default FivethLab;
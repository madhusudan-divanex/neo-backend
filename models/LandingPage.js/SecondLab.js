import mongoose, { Schema } from "mongoose";

const secondLabSchema=new Schema({
    topTitle:String,
    title:String,
    description:String,
    model:[{
    image:String,
    name:String,
    description:String
    }]
},{timestamps:true})
const SecondLab=mongoose.model('second-lab-page',secondLabSchema)
export default SecondLab;
import mongoose, { Schema } from "mongoose";

const thirdLabSchema=new Schema({
    topTitle:String,
    title:String,
    description:String,
    model:[{
    image:String,
    name:String,
    description:String
    }]
},{timestamps:true})
const ThirdLab=mongoose.model('third-lab-page',thirdLabSchema)
export default ThirdLab;
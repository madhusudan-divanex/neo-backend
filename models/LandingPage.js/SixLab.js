import mongoose, { Schema } from "mongoose";

const sixLabSchema=new Schema({
    topTitle:String,
    title:String,
    description:String,
    model:[{
    image:String,
    name:String,
    description:String
    }]
},{timestamps:true})
const SixLab=mongoose.model('six-lab-page',sixLabSchema)
export default SixLab;
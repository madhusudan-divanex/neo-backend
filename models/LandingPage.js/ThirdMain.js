import mongoose, { Schema } from "mongoose";

const secondLabSchema=new Schema({
    // topTitle:String,
    title:String,
    description:String,
    model:[{
    image:String,
    name:String,
    description:String
    }]
},{timestamps:true})
const ThirdMain=mongoose.model('third-main-page',secondLabSchema)
export default ThirdMain;
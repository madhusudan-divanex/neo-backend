import mongoose, { Schema } from "mongoose";

const thirdPharSchema=new Schema({
    title:String,
  
    model:[{
    name:String,
    number:String,
    description:String
    }]
},{timestamps:true})
const ThirdPhar=mongoose.model('third-phar-page',thirdPharSchema)
export default ThirdPhar;
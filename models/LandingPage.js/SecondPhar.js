import mongoose, { Schema } from "mongoose";

const secondPharSchema=new Schema({
    title:String,
    description:String,
  
    model:[{
    image:String,
    name:String,
    description:String
    }]
},{timestamps:true})
const SecondPhar=mongoose.model('second-phar-page',secondPharSchema)
export default SecondPhar;
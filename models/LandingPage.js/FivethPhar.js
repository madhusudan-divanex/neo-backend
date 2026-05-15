import mongoose, { Schema } from "mongoose";

const fivethPharSchema=new Schema({
    title:String,
    usageRule:String,
    model:[{
    image:String,
    name:String,
    description:String
    }]
},{timestamps:true})
const FivethPhar=mongoose.model('fiveth-phar-page',fivethPharSchema)
export default FivethPhar;
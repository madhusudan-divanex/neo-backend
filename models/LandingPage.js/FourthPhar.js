import mongoose, { Schema } from "mongoose";

const fourthPharSchema=new Schema({
    title:String,
    description:String,
    model:[{
    name:String,
    description:String
    }]
},{timestamps:true})
const FourthPhar=mongoose.model('fourth-phar-page',fourthPharSchema)
export default FourthPhar;
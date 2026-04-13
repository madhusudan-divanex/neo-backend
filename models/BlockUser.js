import mongoose, { Schema } from "mongoose";

const blockSchema=new Schema({
    contactNumber:String,
    type:String
},{timestamps:true})

const BlockUser=mongoose.model('block-user',blockSchema)

export default BlockUser
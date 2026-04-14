import mongoose, { Schema } from "mongoose";

const queriesSchema=new Schema({
    name:String,
    email:String,
    contactNumber:String,
    accountType:String,
    hospitalType:String,
    bedRange:String,
    companyName:String,
    panel:{
        type:String,enum:['website','hospital','doctor','pharmacy','lab']
    }
},{timestamps:true})
const Queries=mongoose.model("Queries",queriesSchema)

export default Queries


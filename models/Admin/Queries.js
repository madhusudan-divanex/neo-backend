import mongoose, { Schema } from "mongoose";

const queriesSchema=new Schema({
    
},{timestamps:true})
const Queries=mongoose.model("Queries",queriesSchema)

export default Queries


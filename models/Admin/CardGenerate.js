import mongoose, { Schema } from "mongoose";

const generateSchema=new Schema({
    userId:{
        type: mongoose.Schema.Types.ObjectId, ref: 'User',index:true
    }
},{timestamps:true})

const CardGenerate=mongoose.model('CardGenerate',generateSchema)
export default CardGenerate
import mongoose, { Schema } from "mongoose";

const spSchema=new Schema({
    name:{
        type:String,
        unique:true,
        required:true
    },
    icon:{
        type:String,
    },
})
const HospitalCategory=mongoose.model('hospital-category',spSchema)

export default HospitalCategory
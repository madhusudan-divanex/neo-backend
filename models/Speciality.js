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
const Speciality=mongoose.model('speciality',spSchema)

export default Speciality
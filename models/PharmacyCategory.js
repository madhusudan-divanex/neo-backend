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
const PharmacyCategory=mongoose.model('pharmacy-category',spSchema)

export default PharmacyCategory
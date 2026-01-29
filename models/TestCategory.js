import mongoose, { Schema } from "mongoose";

const spSchema=new Schema({
    name:{
        type:String,
        unique:true,
        required:true
    },
    icon:{
        type:String,
        unique:true,
        required:true
    },
})
const TestCategory=mongoose.model('test-category',spSchema)

export default TestCategory
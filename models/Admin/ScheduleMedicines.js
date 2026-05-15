import mongoose, { Schema } from "mongoose";

const spSchema=new Schema({
    name:{
        type:String,
        unique:true,
        required:true
    },
})
const ScheduleMedicines=mongoose.model('schedule-medicines',spSchema)

export default ScheduleMedicines
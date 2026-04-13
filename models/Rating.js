import mongoose, { Schema} from "mongoose";

const requestSchema=new Schema({
    doctorId:{
        type:mongoose.Schema.Types.ObjectId,
        ref:'User'
    },
    patientId:{
        type:mongoose.Schema.Types.ObjectId,
        ref:'User',required:true
    },
    labId:{
        type:mongoose.Schema.Types.ObjectId,
        ref:'User'
    },
    pharId:{
        type:mongoose.Schema.Types.ObjectId,
        ref:'User'
    },
    message:{type:String,required:true},
    star:{type:Number,min:1,max:5,required:true},

},{timestamps:true})
const Rating= mongoose.model('Rating', requestSchema);
export default Rating
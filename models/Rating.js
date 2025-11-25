import mongoose, { Schema} from "mongoose";

const requestSchema=new Schema({
    doctorId:{
        type:mongoose.Schema.Types.ObjectId,
        ref:'Doctor'
    },
    patientId:{
        type:mongoose.Schema.Types.ObjectId,
        ref:'Patient',required:true
    },
    labId:{
        type:mongoose.Schema.Types.ObjectId,
        ref:'Laboratory'
    },
    message:{type:String,required:true},
    star:{type:Number,min:1,max:5,required:true},

},{timestamps:true})
const Rating= mongoose.model('Rating', requestSchema);
export default Rating
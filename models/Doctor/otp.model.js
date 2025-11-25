import mongoose, { Schema} from "mongoose";

const otpSchema=new Schema({
    userId:{
        type:mongoose.Schema.Types.ObjectId,
        ref:'Doctor',
        required:true
    },
    code:Number
},{timestamps:true})
const Otp= mongoose.model('Doctor-Otp', otpSchema);
export default Otp
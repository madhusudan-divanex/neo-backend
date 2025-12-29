import mongoose, { Schema} from "mongoose";

const otpSchema=new Schema({
    phone:{
        type:String,
        required:true
    },
    code:Number
},{timestamps:true})
const Otp= mongoose.model('Patient-Otp', otpSchema);
export default Otp
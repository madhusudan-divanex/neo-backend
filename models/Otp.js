import mongoose, { Schema} from "mongoose";

const otpSchema=new Schema({
    phone:{
        type:String
    },
    email:String,
    code:Number
},{timestamps:true})
const Otp= mongoose.model('Otp', otpSchema);
export default Otp
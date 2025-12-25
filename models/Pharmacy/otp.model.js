import mongoose, { Schema} from "mongoose";

const otpSchema=new Schema({
    userId:{
        type:mongoose.Schema.Types.ObjectId,
        ref:'User',
        required:true
    },
    code:Number
},{timestamps:true})
const Otp= mongoose.model('Phar-Otp', otpSchema);
export default Otp
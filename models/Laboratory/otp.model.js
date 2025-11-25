import mongoose, { Schema} from "mongoose";

const otpSchema=new Schema({
    userId:{
        type:mongoose.Schema.Types.ObjectId,
        ref:'Laboratory',
        required:true
    },
    code:Number
},{timestamps:true})
const Otp= mongoose.model('Lab-Otp', otpSchema);
export default Otp
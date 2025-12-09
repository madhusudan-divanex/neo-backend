import mongoose, { Schema } from "mongoose"


const loginSchema=new Schema({
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'Pharmacy', required: true },
},{timestamps:true})

const Login=mongoose.model('Phar-Login',loginSchema)

export default Login
import mongoose, { Schema } from "mongoose"


const loginSchema=new Schema({
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'Doctor', required: true },
},{timestamps:true})

const Login=mongoose.model('Doctor-Login',loginSchema)

export default Login
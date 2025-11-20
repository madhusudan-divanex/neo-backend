import mongoose, { Schema } from "mongoose"


const loginSchema=new Schema({
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'Patient', required: true },
},{timestamps:true})

const Login=mongoose.model('Patient-Login',loginSchema)

export default Login
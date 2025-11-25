import mongoose, { Schema } from "mongoose"


const loginSchema=new Schema({
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'Laboratory', required: true },
},{timestamps:true})

const Login=mongoose.model('Lab-Login',loginSchema)

export default Login
import mongoose  from 'mongoose';

const userSchema = new mongoose.Schema({
    name: { type: String, required: true },
    email: { type: String, required: true,unique:true },
    gender: { type: String, required: true },
    contactNumber: { type: String, required: true },
    password: { type: String, required: true } ,  
    status: { type: String,enum:['pending','verify'], default: 'pending' }    

}, { timestamps: true });

const Patient = mongoose.model('Patient', userSchema);

export default Patient

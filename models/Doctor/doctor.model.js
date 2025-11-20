import mongoose  from 'mongoose';

const userSchema = new mongoose.Schema({
    name: { type: String, required: true },
    email: { type: String, required: true },
    gender: { type: String, required: true },
    contactNumber: { type: String, required: true },
    password: { type: String, required: true }    
}, { timestamps: true });

const Doctor = mongoose.model('Doctor', userSchema);

export default Doctor

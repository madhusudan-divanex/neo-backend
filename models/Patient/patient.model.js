import mongoose from 'mongoose';

const userSchema = new mongoose.Schema({
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    gender: { type: String, required: true },
    profileImage: { type: String },
    contactNumber: { type: String, required: true },
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User',index:true },   

    status: { type: String, enum: ['pending', 'verify'], default: 'pending' }

}, { timestamps: true });

const Patient = mongoose.model('Patient', userSchema);

export default Patient

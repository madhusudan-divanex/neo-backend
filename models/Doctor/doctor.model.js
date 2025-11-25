import mongoose  from 'mongoose';

const userSchema = new mongoose.Schema({
    name: { type: String, required: true },
    email: { type: String, required: true },
    gender: { type: String, required: true },
    dob: { type: Date, required: true }    ,
    contactNumber: { type: String, required: true },
    password: { type: String, required: true }  , 
    profileImage: { type: String}  ,
    status: { type: String,enum:['pending','verify'], default: 'pending' }      

}, { timestamps: true });

const Doctor = mongoose.model('Doctor', userSchema);

export default Doctor

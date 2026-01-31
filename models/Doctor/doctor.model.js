import mongoose  from 'mongoose';

const userSchema = new mongoose.Schema({
    name: { type: String, required: true },
    email: { type: String,  },
    gender: { type: String, required: true },
    dob: { type: Date, required: true }    ,
    contactNumber: { type: String, required: true },
    profileImage: { type: String}  ,
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User',index:true },   
    
    status: { type: String,enum:['pending','approved','rejected'], default: 'pending' }      

}, { timestamps: true });

const Doctor = mongoose.model('Doctor', userSchema);

export default Doctor

import mongoose, { Schema }  from 'mongoose';



const userSchema = new mongoose.Schema({
    userName: { type: String, required: true },
    email: { type: String, required: true },
    password: { type: String, required: true }    ,
    permissionId: { type: mongoose.Schema.Types.ObjectId, ref: 'hospital-permission', required: true },
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
          

}, { timestamps: true });

const DoctorAccess = mongoose.model('doctor-access', userSchema);

export default DoctorAccess

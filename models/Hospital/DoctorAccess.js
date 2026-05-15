import mongoose, { Schema }  from 'mongoose';



const userSchema = new mongoose.Schema({
    contactNumber: { type: String, required: true },
    email: { type: String, required: true },
    password: { type: String, required: true }    ,
    permissionId: { type: mongoose.Schema.Types.ObjectId, ref: 'permission', required: true },
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    hospitalId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },         

}, { timestamps: true });

const DoctorAccess = mongoose.model('doctor-access', userSchema);

export default DoctorAccess

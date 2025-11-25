import mongoose, { Schema }  from 'mongoose';



const userSchema = new mongoose.Schema({
    userName: { type: String, required: true },
    email: { type: String, required: true },
    password: { type: Date, required: true }    ,
    permissionId: { type: mongoose.Schema.Types.ObjectId, ref: 'lab-permission', required: true },

    empId: { type: mongoose.Schema.Types.ObjectId, ref: 'lab-staff', required: true },
          

}, { timestamps: true });

const EmpAccess = mongoose.model('lab-emp-access', userSchema);

export default EmpAccess

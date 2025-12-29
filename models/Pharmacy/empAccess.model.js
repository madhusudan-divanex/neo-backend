import mongoose, { Schema }  from 'mongoose';



const userSchema = new mongoose.Schema({
    userName: { type: String, required: true },
    email: { type: String, required: true },
    password: { type: String, required: true }    ,
    permissionId: { type: mongoose.Schema.Types.ObjectId, ref: 'phar-permission', required: true },
    empId: { type: mongoose.Schema.Types.ObjectId, ref: 'phar-staff', required: true,index:true },
          

}, { timestamps: true });

const EmpAccess = mongoose.model('phar-emp-access', userSchema);

export default EmpAccess

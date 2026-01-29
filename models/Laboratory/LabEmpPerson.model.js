import mongoose, { Schema }  from 'mongoose';

const contactSchema=new Schema({
    contactNumber: { type: String, required: true },
    email: { type: String, required: true },
    emergencyContactName: { type: String, required: true },
    emergencyContactNumber: { type: String, required: true },    
})

const userSchema = new mongoose.Schema({
    name: { type: String, required: true },
    address: { type: String, required: true },
    gender: { type: String, required: true },
    dob: { type: Date, required: true }    ,
    state: { type: String, required: true },
    city: { type: String, required: true }  , 
    pinCode: { type: String, required: true }  , 
    contactInformation:contactSchema,
    profileImage: { type: String}  ,
    permissionId: { type: mongoose.Schema.Types.ObjectId, ref: 'permission' },
    status: { type: String,enum:['active','inactive'], default: 'active' },
    labId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true,index:true },
    
}, { timestamps: true });

const LabStaff = mongoose.model('lab-staff', userSchema);

export default LabStaff

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
    dob: { type: Date, required: true }    ,
    contactNumber: { type: String, required: true },
    state: { type: String, required: true },
    city: { type: String, required: true }  , 
    phoneCode: { type: String, required: true }  , 
    contactInformaion:contactSchema,
    profileImage: { type: String}  ,
    status: { type: String,enum:['active','inactive'], default: 'active' },
    labId: { type: mongoose.Schema.Types.ObjectId, ref: 'laboratory', required: true },
    
}, { timestamps: true });

const LabStaff = mongoose.model('lab-staff', userSchema);

export default LabStaff

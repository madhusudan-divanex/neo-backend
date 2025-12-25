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
    permissionId: { type: mongoose.Schema.Types.ObjectId, ref: 'phar-permission' },
    proffesionId: { type: mongoose.Schema.Types.ObjectId, ref: 'phar-emp-prof' },
    employmentId: { type: mongoose.Schema.Types.ObjectId, ref: 'phar-employment' },
    status: { type: String,enum:['active','inactive','onleave'], default: 'active' },
    pharId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    
}, { timestamps: true });

const PharStaff = mongoose.model('phar-staff', userSchema);

export default PharStaff

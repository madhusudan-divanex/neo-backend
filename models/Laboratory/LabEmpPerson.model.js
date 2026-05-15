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
    customId:String,
    profileImage: { type: String}  ,
    permissionId: { type: mongoose.Schema.Types.ObjectId, ref: 'permission' },
    status: { type: String,enum:['active','inactive'], default: 'active' },
    labId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true,index:true },
    
}, { timestamps: true });
userSchema.pre("save", async function (next) {
  if (this.customId) return next();

  try {
    while (true) {
      const id = Math.floor(100000 + Math.random() * 900000).toString();
      const exists = await this.constructor.findOne({ customId: id });
      if (!exists) {
        this.customId = id;
        break;
      }
    }
    next();
  } catch (err) {
    next(err);
  }
});
const LabStaff = mongoose.model('lab-staff', userSchema);

export default LabStaff

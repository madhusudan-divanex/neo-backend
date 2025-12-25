import mongoose, { Schema } from "mongoose"


const certSchema = new Schema({
  certName: { type: String, required: true },
  certFile: { type: String, required: true },
});
const licSchema = new Schema({
    labCert: [certSchema],
    labLicenseNumber:{type:String,required:true},
    licenseFile:{type:String,required:true},
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
}, { timestamps: true })

const LabLicense = mongoose.model('lab-license', licSchema)

export default LabLicense
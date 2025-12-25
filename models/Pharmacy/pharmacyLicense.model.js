import mongoose, { Schema } from "mongoose"


const certSchema = new Schema({
  certName: { type: String, required: true },
  certFile: { type: String, required: true },
});
const licSchema = new Schema({
    pharCert: [certSchema],
    pharLicenseNumber:{type:String,required:true},
    licenseFile:{type:String,required:true},
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
}, { timestamps: true })

const PharLicense = mongoose.model('Phar-license', licSchema)

export default PharLicense
import mongoose, { Schema } from "mongoose"


const licenseSchema = new Schema({
  certName: { type: String, required: true },
  certFile: { type: String, required: true },
});

const licSchema = new Schema({
    medicalLicense: [licenseSchema],
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
}, { timestamps: true })

const MedicalLicense = mongoose.model('medical-license', licSchema)

export default MedicalLicense
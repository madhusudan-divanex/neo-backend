import mongoose from 'mongoose';

const Schema = new mongoose.Schema({
  hospitalId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'HospitalBasic', 
    required: true 
  },

  certificateType: { 
    type: String, 
    
    required: false
  },

  licenseNumber: { 
    type: String, 
    required: true,
    trim: true 
  },

  fileId: { 
    type: String, 
    required: true 
  }

}, { timestamps: true });

const HospitalCertificate = mongoose.model('HospitalCertificate', Schema);
export default HospitalCertificate

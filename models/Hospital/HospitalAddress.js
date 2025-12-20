// models/HospitalAddress.js
import mongoose from 'mongoose';

const Schema = new mongoose.Schema({
  hospitalId: { type: mongoose.Schema.Types.ObjectId, ref: 'HospitalBasic', required: true },
  fullAddress: String,
  country: String,
  state: String,
  city: String,
  pinCode: String
}, { timestamps: true });

const HospitalAddress= mongoose.model('HospitalAddress', Schema);
export default HospitalAddress

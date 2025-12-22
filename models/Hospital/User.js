// models/User.js
import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

const UserSchema = new mongoose.Schema({
  name: { type: String },
  email: { type: String, required: true, unique: true },
  passwordHash: { type: String, required: true },
  role: { type: String, default: 'hospital' },
  hospitalId: { type: mongoose.Schema.Types.ObjectId, ref: 'HospitalBasic' },
  labId: { type: mongoose.Schema.Types.ObjectId, ref: 'Laboratory' },
  pharId: { type: mongoose.Schema.Types.ObjectId, ref: 'Pharmacy' },
  customId: { type: String, required: true },
  resetOtp: { type: String },
  resetOtpExpire: { type: Date },
}, { timestamps: true });

UserSchema.methods.comparePassword = function (plain) {
  return bcrypt.compare(plain, this.passwordHash);
};

const User = mongoose.model('User', UserSchema);
export default User

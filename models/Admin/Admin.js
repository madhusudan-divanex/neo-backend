import mongoose from "mongoose";
import bcrypt from "bcryptjs";

const adminSchema = new mongoose.Schema({
  name: String,
  email: { type: String, unique: true },
  passwordHash: String,
  mobile: { type: String, required: false },
  gst_number: { type: String, required: false },
  about: { type: String, required: false },
  image: { type: String, required: false },
  fcmToken: {
    type: String,
    default: null
  },
  resetOtp: String,
  resetOtpExpire: Date,
  resetOtpVerified: { type: Boolean, default: false },
  role: { type: String, default: "admin" }
}, { timestamps: true });

adminSchema.methods.comparePassword = function (password) {
  return bcrypt.compare(password, this.passwordHash);
};

export default mongoose.model("Admin", adminSchema);

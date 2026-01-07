// models/User.js
import mongoose from "mongoose";
import bcrypt from "bcryptjs";

const UserSchema = new mongoose.Schema(
  {
    note:String,
    status:String,
    labId: { type: mongoose.Schema.Types.ObjectId, ref: 'Laboratory' },
    pharId: { type: mongoose.Schema.Types.ObjectId, ref: 'Pharmacy' },
    patientId: { type: mongoose.Schema.Types.ObjectId, ref: 'Patient' },
    doctorId: { type: mongoose.Schema.Types.ObjectId, ref: 'Doctor' },
    hospitalId: { type: mongoose.Schema.Types.ObjectId, ref: 'HospitalBasic' },
  },
  { timestamps: true }
);


export default mongoose.model("ProfileStatus", UserSchema);

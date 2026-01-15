// models/KycLog.js
import mongoose from "mongoose";

const Schema = new mongoose.Schema(
  {
    hospitalId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true
    },
    patientId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required:true
    },
    departmentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "HospitalDepartment",
      required:true
    },
    status:{type:String,default:'Active',enum:['Active','Inactive']}
  },
  { timestamps: true }
);

export default mongoose.model("PatientDepartment", Schema);

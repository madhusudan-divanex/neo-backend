// models/HospitalStaff.js
import mongoose from "mongoose";

const EducationSchema = new mongoose.Schema(
  {
    university: String,
    degree: String,
    yearFrom: String,
    yearTo: String
  },
  { _id: false }
);

const CertificateSchema = new mongoose.Schema(
  {
    certificateName: String,
    certificateFile: String
  },
  { _id: false }
);

const HospitalStaffSchema = new mongoose.Schema(
  {
    hospitalId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true
    },

    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      index: true
    },

    status: {
      type: String,
      enum: ["active", "inactive", "leave"],
      default: "active",
      index: true
    },

    // ---------------- PERSONAL ----------------
    personalInfo: {
      profileImage: String,
      name: { type: String, required: true },
      dob: Date,
      gender: { type: String, enum: ["male", "female", "other"] },
      address: String,
      countryId: { type: mongoose.Schema.Types.ObjectId, ref: "Country", required: true },
      stateId: { type: mongoose.Schema.Types.ObjectId, ref: 'State', required: true },
      cityId: { type: mongoose.Schema.Types.ObjectId, ref: 'City', required: true },
      pincode: String,
      mobile: String,
      email: String,
      emergencyContactName: String,
      emergencyContactPhone: String
    },

    // ---------------- PROFESSIONAL ----------------
    professionalInfo: {
      profession: String,
      specialization: String,
      experience: String,
      bio: String,
      education: [EducationSchema],
      certificates: [CertificateSchema]
    },

    // ---------------- EMPLOYMENT ----------------
    employmentInfo: {
      department: { type: mongoose.Schema.Types.ObjectId, ref: 'HospitalDepartment' },
      role: String,
      position: String,
      employmentType: String,
      reportingTo: String,
      joinDate: Date,
      onLeaveDate: Date,
      salary: Number,
      contractStart: Date,
      contractEnd: Date,
      note: String,
      fees:Number
    },

    // ---------------- ACCESS ----------------
    accessInfo: {
      contactNumber: String,
      accessEmail: String,
      passwordHash: String,
      permissionId: { type: mongoose.Schema.Types.ObjectId, ref: 'permission' },
    }
  },
  { timestamps: true }
);

export default mongoose.model("HospitalStaff", HospitalStaffSchema);

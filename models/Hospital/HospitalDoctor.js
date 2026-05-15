// models/HospitalDoctor.js
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

const HospitalDoctorSchema = new mongoose.Schema(
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
      countryCode: String,
      stateCode: String,
      state: String,
      city: String,
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
      employeeId: String,
      department: String,
      role: String,
      position: String,
      employmentType: String,
      reportingTo: String,
      joinDate: Date,
      onLeaveDate: Date,
      salary: Number,
      contractStart: Date,
      contractEnd: Date,
      note: String
    },

    // ---------------- ACCESS ----------------
    accessInfo: {
      username: String,
      accessEmail: String,
      passwordHash: String,
      permissionType: String
    }
  },
  { timestamps: true }
);

export default mongoose.model("HospitalDoctor", HospitalDoctorSchema);

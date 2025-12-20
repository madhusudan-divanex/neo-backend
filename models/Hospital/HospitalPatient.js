import mongoose from 'mongoose';

const HospitalPatientSchema = new mongoose.Schema(
  {
    hospitalId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User", // hospital/admin user
      required: true,
      index: true
    },

    patientId: {
      type: String,
      required: true,
      trim: true
    },
    user_id: {
  type: mongoose.Schema.Types.ObjectId,
  ref: "User",
  default: null
},

    name: {
      type: String,
      required: true,
      trim: true
    },

    dob: {
      type: Date,
      required: true
    },

    gender: {
      type: String,
      enum: ["Male", "Female", "Other"],
      required: true
    },

    mobile: {
      type: String,
      required: true
    },

    email: {
      type: String,
      lowercase: true,
      trim: true
    },

    emergencyContactName: {
      type: String
    },

    emergencyContactPhone: {
      type: String
    },

    department: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "HospitalDepartment"
    },

    address: {
      type: String
    },

    state: {
      type: String
    },

    city: {
      type: String
    },

    pinCode: {
      type: String
    },

    status: {
      type: String,
      enum: ["Active", "Inactive"],
      default: "Active"
    }
  },
  { timestamps: true }
);

const HospitalPatient = mongoose.model(
  "HospitalPatient",
  HospitalPatientSchema,
  "hospitalpatient" // 👈 collection name fixed
);
export default HospitalPatient

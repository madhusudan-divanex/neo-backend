// models/User.js
import mongoose from "mongoose";
import bcrypt from "bcryptjs";

const UserSchema = new mongoose.Schema(
  {
    unique_id: {
      type: String,
      unique: true
    },
    name: { type: String },
    email: { type: String, index: true },
    passwordHash: { type: String, required: true },
    role: { type: String, default: "hospital" },
    // REAL-TIME STATUS
    isOnline: {
      type: Boolean,
      default: false
    },
    isAvailable: {
      type: Boolean,
      default: false
    },
    lastSeen: {
      type: Date
    },

    // WALLET (PAID CHAT / CALL)
    walletBalance: {
      type: Number,
      default: 0
    },
    contactNumber: { type: String, index: true },

    // hospitalId: { type: mongoose.Schema.Types.ObjectId, ref: 'HospitalBasic' },
    created_by: { type: String, required: true },
    created_by_id: { type: mongoose.Schema.Types.ObjectId },
    resetOtp: { type: String },
    resetOtpExpire: { type: Date },

    fcmToken: {
      type: String,
      default: null
    },
    nh12: {
      type: String,
      index: true
    },
    labId: { type: mongoose.Schema.Types.ObjectId, ref: 'Laboratory', index: true },
    pharId: { type: mongoose.Schema.Types.ObjectId, ref: 'Pharmacy', index: true },
    patientId: { type: mongoose.Schema.Types.ObjectId, ref: 'Patient', index: true },
    doctorId: { type: mongoose.Schema.Types.ObjectId, ref: 'Doctor', index: true },
    hospitalId: { type: mongoose.Schema.Types.ObjectId, ref: 'HospitalBasic', index: true },
    staffId: { type: mongoose.Schema.Types.ObjectId, ref: 'Staff', index: true },
  },
  { timestamps: true }
);

/**
 * Generate unique 8-digit ID before save
 */
UserSchema.pre("save", async function () {
  if (this.unique_id) return;

  while (true) {
    const id = Math.floor(10000000 + Math.random() * 90000000).toString();
    const exists = await mongoose.models.User.findOne({ unique_id: id });
    if (!exists) {
      this.unique_id = id;
      break;
    }
  }
});

UserSchema.methods.comparePassword = function (plain) {
  return bcrypt.compare(plain, this.passwordHash);
};

export default mongoose.model("User", UserSchema);

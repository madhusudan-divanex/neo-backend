import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

const UserSchema = new mongoose.Schema(
  {
    unique_id: {
      type: String,
      unique: true,
    },
    name: {
      type: String,
    },
    email: {
      type: String,
      required: true,
      unique: true,
    },
    passwordHash: {
      type: String,
      required: true,
    },
    role: {
      type: String,
      default: 'hospital',
    },
    created_by: {
      type: String,
      required: true,
    },
    created_by_id: {
      type: mongoose.Schema.Types.ObjectId,
    },
    resetOtp: {
      type: String,
    },
    resetOtpExpire: {
      type: Date,
    },
    labId: { type: mongoose.Schema.Types.ObjectId, ref: 'Laboratory' },
    pharId: { type: mongoose.Schema.Types.ObjectId, ref: 'Pharmacy' },
    patientId: { type: mongoose.Schema.Types.ObjectId, ref: 'Patient' },
  },
  { timestamps: true }
);

/**
 * Generate unique 8-digit ID before save
 */
UserSchema.pre('save', async function () {
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

/**
 * Compare password
 */
UserSchema.methods.comparePassword = function (plain) {
  return bcrypt.compare(plain, this.passwordHash);
};

const User = mongoose.model('User', UserSchema);

export default User;

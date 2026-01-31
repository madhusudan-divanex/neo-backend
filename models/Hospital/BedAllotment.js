import mongoose from "mongoose";

const StaffAttendanceSchema = new mongoose.Schema(
  {
    staffType: {
      type: String,
      enum: ["Doctor", "Nurse"],
      required: true
    },
    staffId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User"
    },
    date: {
      type: Date,
      required: true
    }
  },
  { _id: false }
);

const BedAllotmentSchema = new mongoose.Schema(
  {
    hospitalId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true
    },

    patientId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true
    },

    bedId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "HospitalBed",
      required: true
    },

    primaryDoctorId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User"
    },
    paymentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "HospitalPayment"
    },

    allotmentDate: {
      type: Date,
      required: true
    },

    expectedDischargeDate: {
      type: Date
    },

    dischargeDate: {
      type: Date
    },

    admissionReason: String,
    note: String,

    attendingStaff: [StaffAttendanceSchema],

    status: {
      type: String,
      enum: ["Active", "Discharged"],
      default: "Active"
    }
  },
  { timestamps: true }
);

export default mongoose.model("BedAllotment", BedAllotmentSchema);

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
    departmentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Department",
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
    dischargeId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "DischargePatient"
    },
    prescriptionId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Prescriptions"
    },

    allotmentDate: {
      type: Date,
      required: true
    },

    expectedDischargeDate: {
      type: Date
    },
    patientDepartment:{
      type: mongoose.Schema.Types.ObjectId,
      ref: 'PatientDepartment'
    },

    admissionReason: String,
    note: String,

    attendingStaff: [StaffAttendanceSchema],
    labAppointment: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'lab-appointment'
    },
    reportIds: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: 'test-report'
    }],
    status: {
      type: String,
      enum: ["Active", "Discharged"],
      default: "Active"
    },customId:String
  },
  { timestamps: true }
);
BedAllotmentSchema.pre("save", async function (next) {
  if (this.customId) return next();

  try {
    while (true) {
      const id = Math.floor(100000 + Math.random() * 900000).toString();
      const exists = await this.constructor.findOne({ customId: id });
      if (!exists) {
        this.customId = id;
        break;
      }
    }
    next();
  } catch (err) {
    next(err);
  }
});

export default mongoose.model("BedAllotment", BedAllotmentSchema);

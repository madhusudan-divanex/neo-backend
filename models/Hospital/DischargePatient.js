import mongoose, { Schema } from "mongoose";


// const dischargeSchema = new Schema({
//     customId: String,
//     allotmentId: {
//         type: mongoose.Schema.Types.ObjectId,
//         ref: "BedAllotment"
//     },
//     hospitalId: {
//         type: mongoose.Schema.Types.ObjectId,
//         ref: "User"
//     },
//     patientId: {
//         type: mongoose.Schema.Types.ObjectId,
//         ref: "User"
//     },
//     paymentId: {
//         type: mongoose.Schema.Types.ObjectId,
//         ref: "HospitalPayment"
//     },
//     dischargeDate:Date,
//     note:String,
//     dischargeType:String,
// },{timestamps:true})
const dischargeSchema = new Schema({
  customId: String,
  allotmentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "BedAllotment"
  },
  hospitalId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User"
  },
  patientId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User"
  },
  paymentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "HospitalPayment"
  },
  prescriptionId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Prescriptions"
  },
  confirmation: {
    finalDiagnosis: {
      type: Boolean,
      required: true
    },
    treatmentSummary: {
      type: Boolean,
      required: true
    },
    medicines: {
      type: Boolean,
      required: true
    },
    followUp: {
      type: Boolean,
      required: true
    },
  },
  dischargeType: {
    type: String,
    enum: ['NORMAL', 'LAMA/DAMA', 'ICU', 'PO', 'TRANSFER', 'DEATH']
  },
  dischargeNote: {
    type: String,
    required: true
  },
  finalDiagnosis: {
    type: String,
    required: true
  },
  hospitalCourse: {
    type: String,
    required: true
  },
  conditionOfDischarge: {
    type: String,
    required: true
  },
  followUpPlan: {
    type: String,
    required: true
  },
  redFlag: {
    type: String,
    required: true
  },
  doctorSignature: {
    type: String,
    required: true
  },

}, { timestamps: true })
dischargeSchema.pre("save", async function (next) {
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
const DischargePatient = mongoose.model('DischargePatient', dischargeSchema)

export default DischargePatient
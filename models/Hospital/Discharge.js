import mongoose from "mongoose";

const medicationSchema = new mongoose.Schema({
  name: String,
  dose: String,
  route: String,
  frequency: String,
  duration: String,
  instructions: String
});

const dischargeSchema = new mongoose.Schema({
  hospitalId: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  patientId: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  admissionId: { type: mongoose.Schema.Types.ObjectId, ref: "BedAllotment" },
  doctorId: { type: mongoose.Schema.Types.ObjectId, ref: "User" },

  dischargeType: {
    type: String,
    enum: ["NORMAL", "LAMA", "TRANSFER", "POST_OPERATIVE", "ICU", "DEATH"],
    required: true
  },

  patientInfo: {
    name:String,
    age:String,
    gender:String,
    phone:String,
    address:String,
    emergencyContact:{name:String,phone:String}
  },
  admissionInfo: {
    admissionDate:String,
    dischargeDate:String,
    department:String,
    ward:String,
    bed:String,
    consultant:String
  },
  diagnosis: {

  },
  clinicalSummary: {
    complaints:String,
    history:String,
    examination:String,
    hospitalCourse:String,
    conditionAtDischarge:String
  },
  investigations: {
    labs: [],
    imaging: [],
    microbiology: [],
    pending: []
  },

  medications: [medicationSchema],

  instructions: {
    diet:String,
    activity:String,
    redFlags:String,
    homeCare:String,
    followUpAdvice:String
  },
  followUp: {
    date:Date,
    department:{ type: mongoose.Schema.Types.ObjectId, ref: "HospitalDepartment" },
    doctor:{ type: mongoose.Schema.Types.ObjectId, ref: "User" },
    mode:String
  },

  verification: {
    doctorSign: String,
    digitalSignature: String,
    hash: String,
    qrUrl: String
  },

  typeDetails: Object,

  status: {
    type: String,
    enum: ["DRAFT", "FINAL"],
    default: "DRAFT"
  }

}, { timestamps: true });

export default mongoose.model("Discharge", dischargeSchema);
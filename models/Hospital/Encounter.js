/**
 * Encounter — core visit entity linking patient to every clinical action
 * 
 * Every order, note, charge, and prescription MUST reference an encounterId.
 * Status lifecycle: OPEN → IN_PROGRESS → READY_FOR_DISCHARGE → DISCHARGED / CANCELLED
 * 
 * Implements NeoHealthCard Audit Identity Rule:
 * actor_nhc_id, actor_name, actor_role, organization_id, patient_nhc_id, encounter_id, timestamp
 */
import mongoose, { Schema } from "mongoose";

const auditSchema = new Schema({
  actorId:    { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  actorNhcId: { type: String },
  actorName:  { type: String },
  actorRole:  { type: String },
  action:     { type: String },
  timestamp:  { type: Date, default: Date.now },
  note:       { type: String }
}, { _id: false });

const encounterSchema = new Schema({
  // ── Identity ──────────────────────────────────────────────────────
  encounterNumber: { type: String, unique: true, sparse: true }, // auto: ENC-YYYYMMDD-XXXX
  hospitalId:   { type: mongoose.Schema.Types.ObjectId, ref: "HospitalBasic", required: true, index: true },
  patientId:    { type: mongoose.Schema.Types.ObjectId, ref: "HospitalPatient", required: true, index: true },
  patientNhcId: { type: String },         // NeoHealth universal ID (UHID)
  
  // ── Type & Route ──────────────────────────────────────────────────
  encounterType: {
    type: String,
    enum: ["OPD", "IPD", "ER", "TELE"],
    required: true,
    index: true
  },
  visitMode: {
    type: String,
    enum: ["WALKIN", "APPOINTMENT", "REFERRAL", "TRANSFER_IN", "EMERGENCY"],
    default: "WALKIN"
  },

  // ── Department & Care Team ────────────────────────────────────────
  departmentId:       { type: mongoose.Schema.Types.ObjectId, ref: "Department" },
  attendingDoctorId:  { type: mongoose.Schema.Types.ObjectId, ref: "User", index: true }, // primary owner
  consultingDoctors:  [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
  nurseId:            { type: mongoose.Schema.Types.ObjectId, ref: "HospitalStaff" },
  caseCoordinatorId:  { type: mongoose.Schema.Types.ObjectId, ref: "HospitalStaff" },

  // ── IPD specifics ────────────────────────────────────────────────
  allotmentId:        { type: mongoose.Schema.Types.ObjectId, ref: "BedAllotment" },
  unitName:           { type: String },   // ICU / Ward A / NICU
  bedNumber:          { type: String },

  // ── OPD/ER specifics ────────────────────────────────────────────
  appointmentId:      { type: mongoose.Schema.Types.ObjectId, ref: "doctor-appointment" },
  queueToken:         { type: String },
  triageLevel:        { type: String, enum: ["RED", "YELLOW", "GREEN"] }, // ER

  // ── Clinical Info ────────────────────────────────────────────────
  chiefComplaint:     { type: String },
  provisionalDiagnosis: { type: String },
  finalDiagnosis:     { type: String },
  icdCode:            { type: String },

  // ── Status Lifecycle ────────────────────────────────────────────
  status: {
    type: String,
    enum: ["OPEN", "IN_PROGRESS", "READY_FOR_DISCHARGE", "DISCHARGED", "CANCELLED"],
    default: "OPEN",
    index: true
  },
  startTime:          { type: Date, default: Date.now },
  endTime:            { type: Date },

  // ── Discharge ────────────────────────────────────────────────────
  dischargeType: {
    type: String,
    enum: ["NORMAL", "TRANSFER", "REFERRAL", "DAMA", "LAMA", "DABA", "DOA", "DEATH", "ABSCONDED"],
  },
  dischargeChecklist: {
    ordersClosed:       { type: Boolean, default: false },
    chargesPosted:      { type: Boolean, default: false },
    paymentSettled:     { type: Boolean, default: false },
    summaryGenerated:   { type: Boolean, default: false },
    summarySignedOff:   { type: Boolean, default: false }
  },
  followUpDoctor:     { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  followUpDate:       { type: Date },
  followUpNote:       { type: String },

  // ── Audit Trail (immutable log array) ───────────────────────────
  auditLog: [auditSchema],

  // ── Source reference ────────────────────────────────────────────
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  createdByRole: { type: String }

}, { timestamps: true });

// Auto-generate encounter number
encounterSchema.pre("save", async function (next) {
  if (this.encounterNumber) return next();
  const d = new Date();
  const yyyymmdd = `${d.getFullYear()}${String(d.getMonth()+1).padStart(2,"0")}${String(d.getDate()).padStart(2,"0")}`;
  const count = await mongoose.models.Encounter.countDocuments({
    createdAt: { $gte: new Date(d.setHours(0,0,0,0)) }
  });
  this.encounterNumber = `ENC-${yyyymmdd}-${String(count + 1).padStart(4, "0")}`;
  next();
});

encounterSchema.index({ hospitalId: 1, status: 1 });
encounterSchema.index({ patientId: 1, createdAt: -1 });
encounterSchema.index({ attendingDoctorId: 1, status: 1 });

export default mongoose.model("Encounter", encounterSchema);

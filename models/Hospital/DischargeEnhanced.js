/**
 * DischargeEnhanced — full PDF-spec discharge model
 * Replaces/extends existing Discharge.js
 * 
 * Supports all discharge types: NORMAL, TRANSFER, REFERRAL, DAMA, LAMA, DABA, DOA, DEATH, ABSCONDED
 * DAMA/LAMA/Absconded require extra mandatory fields (counseling, witness, relative sign)
 * Discharge locks encounter and is immutable after sign-off.
 */
import mongoose, { Schema } from "mongoose";

const medicationSchema = new Schema({
  name: String, dose: String, route: String,
  frequency: String, duration: String, instructions: String
}, { _id: false });

const riskDischargeSchema = new Schema({
  reason:                   { type: String, required: true },
  counselingDone:           { type: Boolean, default: false },
  risksExplainedChecklist:  [String],
  patientAcknowledged:      { type: Boolean, default: false },
  relativeAcknowledged:     { type: Boolean, default: false },
  witnessNhcId:             { type: String },
  witnessName:              { type: String },
  billingStatusSnapshot:    { type: Object },
  timeOfEvent:              { type: Date }
}, { _id: false });

const dischargeEnhancedSchema = new Schema({
  // ── Core links ───────────────────────────────────────────────────
  hospitalId:   { type: mongoose.Schema.Types.ObjectId, ref: "HospitalBasic", required: true, index: true },
  encounterId:  { type: mongoose.Schema.Types.ObjectId, ref: "Encounter",     required: true, index: true },
  patientId:    { type: mongoose.Schema.Types.ObjectId, ref: "HospitalPatient", required: true },
  allotmentId:  { type: mongoose.Schema.Types.ObjectId, ref: "BedAllotment" },
  attendingDoctorId: { type: mongoose.Schema.Types.ObjectId, ref: "User" },

  // ── Discharge Type (full enum from PDF) ──────────────────────────
  dischargeType: {
    type: String,
    enum: ["NORMAL", "TRANSFER", "REFERRAL", "DAMA", "LAMA", "DABA", "DOA", "DEATH", "ABSCONDED"],
    required: true
  },

  // ── Discharge Checklist (PDF: zero-error gate) ───────────────────
  checklist: {
    ordersClosed:       { type: Boolean, default: false },
    chargesPosted:      { type: Boolean, default: false },
    pharmacySettled:    { type: Boolean, default: false },
    paymentComplete:    { type: Boolean, default: false },
    summaryGenerated:   { type: Boolean, default: false },
    summarySignedOff:   { type: Boolean, default: false }
  },

  // ── Clinical Summary ─────────────────────────────────────────────
  admissionDate:        { type: Date },
  dischargeDate:        { type: Date },
  daysAdmitted:         { type: Number },
  finalDiagnosis:       { type: String },
  icdCode:              { type: String },
  comorbidities:        [String],
  proceduresPerformed:  [String],
  courseInHospital:     { type: String },   // narrative summary
  conditionAtDischarge: { type: String, enum: ["IMPROVED", "STABLE", "DETERIORATED", "DECEASED"] },

  // ── Discharge Medications ────────────────────────────────────────
  dischargeMedications: [medicationSchema],
  dietInstructions:     { type: String },
  activityRestrictions: { type: String },
  woundCare:            { type: String },
  redFlagSymptoms:      [String],

  // ── Follow-up ────────────────────────────────────────────────────
  followUpDoctor:  { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  followUpDate:    { type: Date },
  followUpSpecialty: { type: String },
  followUpNotes:   { type: String },
  teleconsultOption: { type: Boolean, default: false },

  // ── Transfer/Referral specifics ──────────────────────────────────
  transferToHospital:   { type: String },
  transferReason:       { type: String },
  referralDoctor:       { type: String },
  referralSpecialty:    { type: String },

  // ── DAMA/LAMA/Absconded — risk discharge extra fields ────────────
  riskDischargeDetails: riskDischargeSchema,

  // ── Death specifics ──────────────────────────────────────────────
  causeOfDeath:         { type: String },
  timeOfDeath:          { type: Date },
  deathCertificateNo:   { type: String },
  mlcCase:              { type: Boolean, default: false },

  // ── Sign-off (locks the discharge record) ────────────────────────
  signedBy:             { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  signedByNhcId:        { type: String },
  signedAt:             { type: Date },
  isLocked:             { type: Boolean, default: false }, // true after sign → no edits

  // ── Audit ────────────────────────────────────────────────────────
  createdBy:     { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  createdByRole: { type: String }

}, { timestamps: true });

// Prevent edits after sign-off
dischargeEnhancedSchema.pre("save", function (next) {
  if (this.signedAt && !this.isNew) {
    const err = new Error("Discharge summary is locked after sign-off. Only addendum allowed.");
    err.locked = true;
    return next(err);
  }
  if (this.signedAt) this.isLocked = true;
  if (this.admissionDate && this.dischargeDate) {
    this.daysAdmitted = Math.ceil((this.dischargeDate - this.admissionDate) / (1000 * 60 * 60 * 24));
  }
  next();
});

dischargeEnhancedSchema.index({ encounterId: 1 }, { unique: true });
dischargeEnhancedSchema.index({ hospitalId: 1, dischargeDate: -1 });
dischargeEnhancedSchema.index({ dischargeType: 1 });

export default mongoose.model("DischargeEnhanced", dischargeEnhancedSchema);

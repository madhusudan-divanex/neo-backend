/**
 * AuditLog — immutable audit trail for every clinical/admin action
 * 
 * NeoHealthCard rule: every record stores actor_nhc_id, actor_role, 
 * organization_id, patient_nhc_id, encounter_id, timestamp.
 * No delete. Blockchain hash optional for legal defensibility.
 */
import mongoose, { Schema } from "mongoose";

const auditLogSchema = new Schema({
  // ── Actor (who did it) ────────────────────────────────────────────
  actorId:      { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  actorNhcId:   { type: String },
  actorName:    { type: String },
  actorRole:    { type: String, required: true },

  // ── Organization context ─────────────────────────────────────────
  hospitalId:   { type: mongoose.Schema.Types.ObjectId, ref: "HospitalBasic", required: true, index: true },
  departmentId: { type: mongoose.Schema.Types.ObjectId, ref: "Department" },
  unitId:       { type: String },   // ward/unit name

  // ── Patient context ──────────────────────────────────────────────
  patientId:    { type: mongoose.Schema.Types.ObjectId, ref: "HospitalPatient" },
  patientNhcId: { type: String },   // UHID
  encounterId:  { type: mongoose.Schema.Types.ObjectId, ref: "Encounter" },

  // ── Action ───────────────────────────────────────────────────────
  module:       { type: String, required: true },   // e.g. "IPD_NOTE", "DISCHARGE", "CHARGE"
  action:       { type: String, required: true },   // e.g. "CREATE", "UPDATE", "VOID", "SIGN"
  resourceType: { type: String },                   // e.g. "DailyNote", "Discharge"
  resourceId:   { type: mongoose.Schema.Types.ObjectId },

  // ── Data snapshot ────────────────────────────────────────────────
  before:       { type: Object },   // previous state (for updates)
  after:        { type: Object },   // new state
  changes:      [{ field: String, from: mongoose.Schema.Types.Mixed, to: mongoose.Schema.Types.Mixed }],
  metadata:     { type: Object },   // any extra context

  // ── Technical ────────────────────────────────────────────────────
  ipAddress:    { type: String },
  deviceId:     { type: String },
  userAgent:    { type: String },
  sessionId:    { type: String },
  auditHash:    { type: String },   // SHA256 of (actorId+action+resourceId+timestamp) for tamper detection

  timestamp:    { type: Date, default: Date.now, index: true }
}, {
  // No timestamps — we manage our own timestamp field
  // This collection should have no TTL (permanent records)
  versionKey: false
});

auditLogSchema.index({ hospitalId: 1, timestamp: -1 });
auditLogSchema.index({ patientId: 1, timestamp: -1 });
auditLogSchema.index({ encounterId: 1, timestamp: 1 });
auditLogSchema.index({ actorId: 1, timestamp: -1 });
auditLogSchema.index({ module: 1, action: 1, timestamp: -1 });

// Helper static method to log quickly
auditLogSchema.statics.log = async function (data) {
  try { return await this.create(data); } catch (e) { console.error("AuditLog write failed:", e.message); }
};

export default mongoose.model("AuditLog", auditLogSchema);

/**
 * ChargeLedger — auto-charge system for visit-linked billing
 * 
 * Every clinical action posts a charge line here.
 * Status flow: PENDING → POSTED → PAID → VOIDED → REFUNDED
 * No deletion permitted. Void requires reason + actorNhcId.
 * Billing sees a timeline ledger per encounter, not scattered bills.
 */
import mongoose, { Schema } from "mongoose";

const chargeLedgerSchema = new Schema({
  // ── Links ────────────────────────────────────────────────────────
  hospitalId:   { type: mongoose.Schema.Types.ObjectId, ref: "HospitalBasic", required: true, index: true },
  encounterId:  { type: mongoose.Schema.Types.ObjectId, ref: "Encounter",     required: true, index: true },
  patientId:    { type: mongoose.Schema.Types.ObjectId, ref: "HospitalPatient", required: true },
  serviceId:    { type: mongoose.Schema.Types.ObjectId, ref: "ServiceCatalog" },

  // ── Charge Detail ────────────────────────────────────────────────
  chargeCode:   { type: String },
  description:  { type: String, required: true },
  category:     { type: String },              // from ServiceCatalog
  qty:          { type: Number, default: 1 },
  unitPrice:    { type: Number, required: true },
  taxPercent:   { type: Number, default: 0 },
  taxAmount:    { type: Number, default: 0 },
  totalAmount:  { type: Number, required: true },
  discount:     { type: Number, default: 0 },
  netAmount:    { type: Number },              // totalAmount - discount

  // ── Source ────────────────────────────────────────────────────────
  sourceType: {
    type: String,
    enum: ["AUTO", "MANUAL", "PHARMACY", "LAB", "RADIOLOGY", "PROCEDURE", "BED", "OT"]
  },
  sourceRefId:  { type: mongoose.Schema.Types.ObjectId },  // prescription/order/allotment ref

  // ── Status Lifecycle ─────────────────────────────────────────────
  status: {
    type: String,
    enum: ["PENDING", "POSTED", "PAID", "VOIDED", "REFUNDED"],
    default: "PENDING",
    index: true
  },

  // ── Void / Refund ────────────────────────────────────────────────
  voidReason:     { type: String },
  voidedBy:       { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  voidedByNhcId:  { type: String },
  voidedAt:       { type: Date },
  refundAmount:   { type: Number },

  // ── Audit ─────────────────────────────────────────────────────────
  actorId:        { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  actorNhcId:     { type: String },
  actorRole:      { type: String },
  chargedAt:      { type: Date, default: Date.now }

}, { timestamps: true });

// Auto-compute tax and net
chargeLedgerSchema.pre("save", function (next) {
  this.taxAmount   = +(this.unitPrice * this.qty * this.taxPercent / 100).toFixed(2);
  this.totalAmount = +(this.unitPrice * this.qty + this.taxAmount).toFixed(2);
  this.netAmount   = +(this.totalAmount - (this.discount || 0)).toFixed(2);
  next();
});

chargeLedgerSchema.index({ encounterId: 1, status: 1 });
chargeLedgerSchema.index({ encounterId: 1, chargedAt: 1 });
chargeLedgerSchema.index({ hospitalId: 1, chargedAt: -1 });

export default mongoose.model("ChargeLedger", chargeLedgerSchema);

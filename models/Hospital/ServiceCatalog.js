/**
 * ServiceCatalog — hospital price book
 * Stores prices for: consultation, procedures, lab tests, radiology, IPD bed/day, OT packages
 * Doctor sees "₹___ will be added to bill" badge when performing action.
 * Auto-charge rules trigger charge posting on clinical events.
 */
import mongoose, { Schema } from "mongoose";

const serviceCatalogSchema = new Schema({
  hospitalId: { type: mongoose.Schema.Types.ObjectId, ref: "HospitalBasic", required: true, index: true },

  // ── Service Identity ─────────────────────────────────────────────
  code:        { type: String, required: true },   // e.g. CONS-OPD-001
  name:        { type: String, required: true },   // e.g. "OPD Consultation - Cardiology"
  category: {
    type: String,
    enum: ["CONSULTATION", "PROCEDURE", "LAB", "RADIOLOGY", "IPD_BED", "IPD_NURSING", "OT", "PHARMACY", "OTHER"],
    required: true,
    index: true
  },
  subCategory: { type: String },                   // e.g. "ICU Bed", "General Bed"
  description: { type: String },
  departmentId: { type: mongoose.Schema.Types.ObjectId, ref: "Department" },

  // ── Pricing ─────────────────────────────────────────────────────
  basePrice:       { type: Number, required: true, min: 0 },
  taxPercent:      { type: Number, default: 0 },       // GST %
  taxAmount:       { type: Number, default: 0 },
  finalPrice:      { type: Number },                   // auto-computed: basePrice + tax

  // ── Special pricing ─────────────────────────────────────────────
  insurancePrice:  { type: Number },
  corporatePrice:  { type: Number },
  packageIds:      [{ type: mongoose.Schema.Types.ObjectId, ref: "ServicePackage" }],

  // ── Auto-charge rule ─────────────────────────────────────────────
  autoCharge:      { type: Boolean, default: false },  // auto-post when triggered
  chargeTrigger:   { type: String },                   // e.g. "ADMIT", "DAILY", "ORDER", "DISCHARGE"
  requiresApproval:{ type: Boolean, default: false },

  // ── Unit / Billing ────────────────────────────────────────────────
  unit:            { type: String, default: "per visit" }, // "per day", "per test", "per procedure"
  isActive:        { type: Boolean, default: true },
  effectiveFrom:   { type: Date, default: Date.now },
  effectiveTo:     { type: Date },

  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" }
}, { timestamps: true });

// Auto-compute finalPrice
serviceCatalogSchema.pre("save", function (next) {
  this.taxAmount   = +(this.basePrice * this.taxPercent / 100).toFixed(2);
  this.finalPrice  = +(this.basePrice + this.taxAmount).toFixed(2);
  next();
});

serviceCatalogSchema.index({ hospitalId: 1, category: 1, isActive: 1 });
// Note: code uniqueness enforced in controller, not DB index (allows flexibility)
// serviceCatalogSchema.index({ hospitalId: 1, code: 1 }, { unique: true });

export default mongoose.model("ServiceCatalog", serviceCatalogSchema);

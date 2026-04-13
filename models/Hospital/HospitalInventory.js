/**
 * HospitalInventory — non-pharmacy hospital materials
 * (consumables, implants, biomedical assets, OT supplies)
 * 
 * Matches the JSX inventory component (NHC-hospital_inventory.jsx)
 * Implements FEFO (First Expired First Out) picking
 * Supports multi-store: Central, OT, ICU, ER, Ward, Consignment
 */
import mongoose, { Schema } from "mongoose";

// ── Store Locations ───────────────────────────────────────────────────────────
export const storeLocationSchema = new Schema({
  hospitalId: { type: mongoose.Schema.Types.ObjectId, ref: "HospitalBasic", required: true, index: true },
  locationId: { type: String, required: true },  // e.g. "L-CENTRAL", "L-OT", "L-ICU"
  name:       { type: String, required: true },  // e.g. "Central Store"
  type: {
    type: String,
    enum: ["CENTRAL", "OT", "ICU", "ER", "WARD", "PHARMACY", "LAB", "CONS", "OTHER"],
    required: true
  },
  isActive:   { type: Boolean, default: true },
  notes:      { type: String }
}, { timestamps: true });
storeLocationSchema.index({ hospitalId: 1, locationId: 1 }, { unique: true });
export const StoreLocation = mongoose.model("StoreLocation", storeLocationSchema);

// ── Inventory Item Master ─────────────────────────────────────────────────────
export const inventoryItemSchema = new Schema({
  hospitalId:   { type: mongoose.Schema.Types.ObjectId, ref: "HospitalBasic", required: true, index: true },
  locationId:   { type: String, required: true },
  itemCode:     { type: String, required: true },
  name:         { type: String, required: true },
  category: {
    type: String,
    enum: ["CONSUMABLE", "IMPLANT", "ASSET", "DRUG", "NONCLINICAL", "OT_SUPPLY"],
    required: true
  },
  uom:          { type: String, default: "pcs" },   // unit of measure
  barcode:      { type: String },
  udiBarcod:    { type: String },                   // UDI for implants

  // ── Stock levels ─────────────────────────────────────────────────
  onHand:       { type: Number, default: 0 },
  reserved:     { type: Number, default: 0 },
  available:    { type: Number, default: 0 },   // onHand - reserved
  parMin:       { type: Number },               // reorder point
  parMax:       { type: Number },               // max stock

  // ── Risk flags ───────────────────────────────────────────────────
  nearExpiry:   { type: Boolean, default: false },
  expiryDate:   { type: Date },
  highValue:    { type: Boolean, default: false },
  consignment:  { type: Boolean, default: false },  // vendor-owned until used
  stockoutRisk: { type: Boolean, default: false },

  // ── Financial ────────────────────────────────────────────────────
  unitCost:     { type: Number },
  totalValue:   { type: Number },
  serviceId:    { type: mongoose.Schema.Types.ObjectId, ref: "ServiceCatalog" }, // for auto-charge

  lastMovement: { type: Date },
  isActive:     { type: Boolean, default: true }
}, { timestamps: true });
inventoryItemSchema.index({ hospitalId: 1, locationId: 1 });
inventoryItemSchema.index({ hospitalId: 1, category: 1 });
inventoryItemSchema.index({ hospitalId: 1, nearExpiry: 1 });
export const InventoryItem = mongoose.model("InventoryItem", inventoryItemSchema);

// ── Batch / Lot tracking ──────────────────────────────────────────────────────
export const inventoryBatchSchema = new Schema({
  hospitalId:   { type: mongoose.Schema.Types.ObjectId, ref: "HospitalBasic", required: true, index: true },
  itemId:       { type: mongoose.Schema.Types.ObjectId, ref: "InventoryItem",  required: true, index: true },
  locationId:   { type: String },
  batchNumber:  { type: String },
  lotNumber:    { type: String },
  expiryDate:   { type: Date, index: true },   // FEFO sort key
  mfgDate:      { type: Date },
  qty:          { type: Number, default: 0 },
  unitCost:     { type: Number },
  vendorId:     { type: mongoose.Schema.Types.ObjectId, ref: "Supplier" },
  grnId:        { type: mongoose.Schema.Types.ObjectId, ref: "HospitalGRN" },
  status: {
    type: String,
    enum: ["IN_STOCK", "RESERVED", "DISPENSED", "EXPIRED", "DAMAGED", "QUARANTINE", "RETURNED"],
    default: "IN_STOCK"
  },
  isRecalled:   { type: Boolean, default: false }
}, { timestamps: true });
inventoryBatchSchema.index({ itemId: 1, expiryDate: 1 }); // FEFO index
inventoryBatchSchema.index({ batchNumber: 1 });
export const InventoryBatch = mongoose.model("InventoryBatch", inventoryBatchSchema);

// ── Stock Ledger (every movement) ─────────────────────────────────────────────
export const stockLedgerSchema = new Schema({
  hospitalId:    { type: mongoose.Schema.Types.ObjectId, ref: "HospitalBasic", required: true, index: true },
  itemId:        { type: mongoose.Schema.Types.ObjectId, ref: "InventoryItem",  required: true },
  batchId:       { type: mongoose.Schema.Types.ObjectId, ref: "InventoryBatch" },
  locationId:    { type: String },
  
  txnType: {
    type: String,
    enum: ["GRN", "ISSUE_PATIENT", "ISSUE_DEPT", "TRANSFER_OUT", "TRANSFER_IN", "ADJUST", "RETURN", "EXPIRED", "DAMAGE"],
    required: true
  },
  direction: { type: String, enum: ["IN", "OUT"], required: true },
  qty:       { type: Number, required: true },
  unitCost:  { type: Number },

  // ── Reference ────────────────────────────────────────────────────
  refDocId:  { type: mongoose.Schema.Types.ObjectId },  // GRN, Indent, Issue doc
  refDocType:{ type: String },
  encounterId:{ type: mongoose.Schema.Types.ObjectId, ref: "Encounter" },
  patientId: { type: mongoose.Schema.Types.ObjectId, ref: "HospitalPatient" },
  chargeable:{ type: Boolean, default: false },

  // ── Audit ─────────────────────────────────────────────────────────
  actorId:     { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  actorNhcId:  { type: String },
  actorRole:   { type: String },
  notes:       { type: String },
  txnAt:       { type: Date, default: Date.now }
}, { timestamps: true });
stockLedgerSchema.index({ hospitalId: 1, txnAt: -1 });
stockLedgerSchema.index({ itemId: 1, txnAt: -1 });
stockLedgerSchema.index({ encounterId: 1 });
export const StockLedger = mongoose.model("StockLedger", stockLedgerSchema);

// ── GRN (Goods Receipt Note) ──────────────────────────────────────────────────
const grnLineSchema = new Schema({
  itemId:        { type: mongoose.Schema.Types.ObjectId, ref: "InventoryItem" },
  itemName:      { type: String },
  batchNumber:   { type: String },
  expiryDate:    { type: Date },
  mfgDate:       { type: Date },
  qtyOrdered:    { type: Number },
  qtyReceived:   { type: Number },
  unitCost:      { type: Number },
  totalCost:     { type: Number },
  toLocationId:  { type: String },
  accepted:      { type: Boolean, default: true },
  rejectionReason: { type: String }
}, { _id: false });

export const hospitalGRNSchema = new Schema({
  hospitalId:    { type: mongoose.Schema.Types.ObjectId, ref: "HospitalBasic", required: true, index: true },
  grnNumber:     { type: String, unique: true, sparse: true },
  vendorId:      { type: mongoose.Schema.Types.ObjectId, ref: "Supplier" },
  vendorName:    { type: String },
  poId:          { type: mongoose.Schema.Types.ObjectId, ref: "HospitalPO" },
  toLocationId:  { type: String, default: "L-CENTRAL" },
  lines:         [grnLineSchema],
  status: {
    type: String,
    enum: ["DRAFT", "RECEIVED", "PARTIAL", "CLOSED"],
    default: "DRAFT"
  },
  receivedBy:    { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  receivedAt:    { type: Date },
  notes:         { type: String },
  invoiceNumber: { type: String },
  invoiceDate:   { type: Date }
}, { timestamps: true });
hospitalGRNSchema.pre("save", async function (next) {
  if (this.grnNumber) return next();
  const count = await mongoose.models.HospitalGRN?.countDocuments() || 0;
  this.grnNumber = `GRN-${String(count + 1).padStart(5, "0")}`;
  next();
});
export const HospitalGRN = mongoose.model("HospitalGRN", hospitalGRNSchema);

// ── Indent (internal stock request) ──────────────────────────────────────────
const indentLineSchema = new Schema({
  itemId:  { type: mongoose.Schema.Types.ObjectId, ref: "InventoryItem" },
  itemName:{ type: String },
  qty:     { type: Number, required: true },
  uom:     { type: String },
  batch:   { type: String },
  expiry:  { type: String },
  notes:   { type: String }
}, { _id: false });

export const hospitalIndentSchema = new Schema({
  hospitalId:    { type: mongoose.Schema.Types.ObjectId, ref: "HospitalBasic", required: true, index: true },
  indentNumber:  { type: String, unique: true, sparse: true },
  fromLocationId:{ type: String },
  toCostCenter:  { type: String },
  priority:      { type: String, enum: ["ROUTINE", "URGENT", "STAT"], default: "ROUTINE" },
  lines:         [indentLineSchema],
  status: {
    type: String,
    enum: ["PENDING", "APPROVED", "REJECTED", "FULFILLED", "PARTIAL"],
    default: "PENDING"
  },
  requestedBy:   { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  approvedBy:    { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  notes:         { type: String }
}, { timestamps: true });
hospitalIndentSchema.pre("save", async function (next) {
  if (this.indentNumber) return next();
  const count = await mongoose.models.HospitalIndent?.countDocuments() || 0;
  this.indentNumber = `IND-${String(count + 1).padStart(5, "0")}`;
  next();
});
export const HospitalIndent = mongoose.model("HospitalIndent", hospitalIndentSchema);

// ── Biomedical Asset ──────────────────────────────────────────────────────────
export const biomedicalAssetSchema = new Schema({
  hospitalId:    { type: mongoose.Schema.Types.ObjectId, ref: "HospitalBasic", required: true, index: true },
  assetNumber:   { type: String, unique: true, sparse: true },
  name:          { type: String, required: true },
  model:         { type: String },
  manufacturer:  { type: String },
  serialNumber:  { type: String },
  locationId:    { type: String },
  status: {
    type: String,
    enum: ["ACTIVE", "MAINT", "DOWN", "DISPOSED"],
    default: "ACTIVE"
  },
  purchaseDate:  { type: Date },
  warrantyTill:  { type: Date },
  nextPmDate:    { type: Date },    // preventive maintenance
  lastPmDate:    { type: Date },
  notes:         { type: String }
}, { timestamps: true });
export const BiomedicalAsset = mongoose.model("BiomedicalAsset", biomedicalAssetSchema);

export default { StoreLocation, InventoryItem, InventoryBatch, StockLedger, HospitalGRN, HospitalIndent, BiomedicalAsset };

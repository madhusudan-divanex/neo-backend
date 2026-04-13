import {
  StoreLocation, InventoryItem, InventoryBatch,
  StockLedger, HospitalGRN, HospitalIndent, BiomedicalAsset
} from "../../models/Hospital/HospitalInventory.js";
import Encounter    from "../../models/Hospital/Encounter.js";
import ChargeLedger from "../../models/Hospital/ChargeLedger.js";
import ServiceCatalog from "../../models/Hospital/ServiceCatalog.js";
import AuditLog from "../../models/Hospital/AuditLog.js";

// ── LOCATIONS ──────────────────────────────────────────────────────────────
export const getLocations = async (req, res) => {
  try {
    const data = await StoreLocation.find({ hospitalId: req.user.hospitalId, isActive: true }).sort({ type: 1 });
    res.json({ success: true, data });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
};

export const createLocation = async (req, res) => {
  try {
    const loc = await StoreLocation.create({ hospitalId: req.user.hospitalId, ...req.body });
    res.json({ success: true, data: loc });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
};

// ── ITEMS ──────────────────────────────────────────────────────────────────
export const getItems = async (req, res) => {
  try {
    const { hospitalId } = req.user;
    const { locationId, category, riskFilter, q, onlyLow, onlyExpiry } = req.query;
    const filter = { hospitalId, isActive: true };
    if (locationId && locationId !== "ALL") filter.locationId = locationId;
    if (category   && category !== "ALL")   filter.category = category;
    if (q) filter.name = { $regex: q, $options: "i" };
    if (onlyLow === "true")    filter.stockoutRisk = true;
    if (onlyExpiry === "true") filter.nearExpiry = true;
    if (riskFilter === "STOCKOUT_RISK")  filter.stockoutRisk = true;
    if (riskFilter === "EXPIRY_RISK")    filter.nearExpiry = true;
    if (riskFilter === "HIGH_VALUE")     filter.highValue = true;
    if (riskFilter === "CONSIGNMENT")    filter.consignment = true;

    const data = await InventoryItem.find(filter).sort({ name: 1 });
    res.json({ success: true, data });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
};

export const createItem = async (req, res) => {
  try {
    const item = await InventoryItem.create({ hospitalId: req.user.hospitalId, ...req.body });
    res.json({ success: true, data: item });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
};

// ── KPIs (for dashboard) ────────────────────────────────────────────────────
export const getInventoryKPIs = async (req, res) => {
  try {
    const { hospitalId } = req.user;
    const [stockValue, lowStock, nearExpiry, openIndents, pendingGRNs] = await Promise.all([
      InventoryItem.aggregate([{ $match: { hospitalId, isActive: true } }, { $group: { _id: null, total: { $sum: "$totalValue" } } }]),
      InventoryItem.countDocuments({ hospitalId, stockoutRisk: true }),
      InventoryItem.countDocuments({ hospitalId, nearExpiry: true }),
      HospitalIndent.countDocuments({ hospitalId, status: { $in: ["PENDING", "APPROVED"] } }),
      HospitalGRN.countDocuments({ hospitalId, status: { $in: ["DRAFT", "RECEIVED"] } })
    ]);
    res.json({ success: true, data: {
      stockValue: stockValue[0]?.total || 0,
      lowStockCount: lowStock,
      nearExpiryCount: nearExpiry,
      openIndents, pendingGRNs
    }});
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
};

// ── GRN ─────────────────────────────────────────────────────────────────────
export const createGRN = async (req, res) => {
  try {
    const grn = await HospitalGRN.create({ hospitalId: req.user.hospitalId, ...req.body, receivedBy: req.user._id });
    res.json({ success: true, data: grn });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
};

export const getGRNs = async (req, res) => {
  try {
    const data = await HospitalGRN.find({ hospitalId: req.user.hospitalId }).sort({ createdAt: -1 }).limit(50);
    res.json({ success: true, data });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
};

export const closeGRN = async (req, res) => {
  try {
    const grn = await HospitalGRN.findById(req.params.id);
    if (!grn) return res.status(404).json({ success: false, message: "GRN not found" });

    // Update stock for each accepted line
    for (const line of grn.lines.filter(l => l.accepted)) {
      await InventoryItem.findByIdAndUpdate(line.itemId, {
        $inc: { onHand: line.qtyReceived, available: line.qtyReceived },
        lastMovement: new Date()
      });
      await InventoryBatch.create({
        hospitalId: grn.hospitalId, itemId: line.itemId,
        locationId: line.toLocationId || grn.toLocationId,
        batchNumber: line.batchNumber, expiryDate: line.expiryDate,
        mfgDate: line.mfgDate, qty: line.qtyReceived,
        unitCost: line.unitCost, grnId: grn._id
      });
      await StockLedger.create({
        hospitalId: grn.hospitalId, itemId: line.itemId,
        locationId: line.toLocationId || grn.toLocationId,
        txnType: "GRN", direction: "IN", qty: line.qtyReceived,
        unitCost: line.unitCost, refDocId: grn._id, refDocType: "GRN",
        actorId: req.user._id, actorNhcId: req.user.nh12, actorRole: req.user.role
      });
    }

    grn.status = "CLOSED";
    grn.receivedAt = new Date();
    await grn.save();

    res.json({ success: true, data: grn });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
};

// ── ISSUE to patient (FEFO pick, auto-charge) ────────────────────────────────
export const issueToPatient = async (req, res) => {
  try {
    const { encounterId, patientId, items, chargeable = true } = req.body;
    const { hospitalId } = req.user;

    const ledgerEntries = [];

    for (const it of items) {
      // FEFO: pick earliest expiry batch
      const batch = await InventoryBatch.findOne({
        itemId: it.itemId, status: "IN_STOCK",
        expiryDate: { $gt: new Date() }
      }).sort({ expiryDate: 1 });

      if (!batch || batch.qty < it.qty) {
        return res.status(400).json({ success: false, message: `Insufficient stock for item ${it.itemId}` });
      }

      // Deduct stock
      batch.qty -= it.qty;
      if (batch.qty === 0) batch.status = "DISPENSED";
      await batch.save();

      await InventoryItem.findByIdAndUpdate(it.itemId, {
        $inc: { onHand: -it.qty, available: -it.qty },
        lastMovement: new Date()
      });

      // Stock ledger entry
      const ledger = await StockLedger.create({
        hospitalId, itemId: it.itemId, batchId: batch._id,
        txnType: "ISSUE_PATIENT", direction: "OUT", qty: it.qty,
        unitCost: batch.unitCost, encounterId, patientId,
        refDocId: encounterId, refDocType: "ENCOUNTER",
        chargeable,
        actorId: req.user._id, actorNhcId: req.user.nh12, actorRole: req.user.role,
        notes: req.body.notes
      });
      ledgerEntries.push(ledger);

      // Auto-charge if chargeable
      if (chargeable) {
        const item = await InventoryItem.findById(it.itemId);
        await ChargeLedger.create({
          hospitalId, encounterId, patientId,
          description: `${it.name || item?.name} (issued)`,
          category: "PHARMACY", qty: it.qty,
          unitPrice: batch.unitCost || 0, taxPercent: 0,
          sourceType: "PHARMACY", sourceRefId: ledger._id,
          actorId: req.user._id, actorNhcId: req.user.nh12,
          actorRole: req.user.role, status: "POSTED"
        });
      }
    }

    await AuditLog.log({
      actorId: req.user._id, actorNhcId: req.user.nh12,
      actorName: req.user.name, actorRole: req.user.role,
      hospitalId, encounterId, patientId,
      module: "INVENTORY", action: "ISSUE_PATIENT",
      after: { items: items.length, chargeable }
    });

    res.json({ success: true, data: ledgerEntries });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
};

// ── INDENTS ──────────────────────────────────────────────────────────────────
export const createIndent = async (req, res) => {
  try {
    const indent = await HospitalIndent.create({ hospitalId: req.user.hospitalId, ...req.body, requestedBy: req.user._id });
    res.json({ success: true, data: indent });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
};

export const getIndents = async (req, res) => {
  try {
    const data = await HospitalIndent.find({ hospitalId: req.user.hospitalId }).sort({ createdAt: -1 }).limit(50);
    res.json({ success: true, data });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
};

export const approveIndent = async (req, res) => {
  try {
    const { status } = req.body;
    const indent = await HospitalIndent.findByIdAndUpdate(req.params.id, { status, approvedBy: req.user._id }, { new: true });
    res.json({ success: true, data: indent });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
};

// ── STOCK ADJUSTMENT ─────────────────────────────────────────────────────────
export const adjustStock = async (req, res) => {
  try {
    const { itemId, delta, reason, locationId } = req.body;
    const { hospitalId } = req.user;

    if (!reason) return res.status(400).json({ success: false, message: "Adjustment reason required" });

    await InventoryItem.findByIdAndUpdate(itemId, {
      $inc: { onHand: delta, available: delta },
      lastMovement: new Date()
    });

    await StockLedger.create({
      hospitalId, itemId, locationId,
      txnType: "ADJUST", direction: delta > 0 ? "IN" : "OUT",
      qty: Math.abs(delta),
      actorId: req.user._id, actorNhcId: req.user.nh12, actorRole: req.user.role,
      notes: reason
    });

    await AuditLog.log({
      actorId: req.user._id, actorNhcId: req.user.nh12,
      actorName: req.user.name, actorRole: req.user.role,
      hospitalId, module: "INVENTORY", action: "ADJUST",
      after: { itemId, delta, reason }
    });

    res.json({ success: true, message: "Stock adjusted" });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
};

// ── ASSETS ──────────────────────────────────────────────────────────────────
export const getAssets = async (req, res) => {
  try {
    const data = await BiomedicalAsset.find({ hospitalId: req.user.hospitalId }).sort({ name: 1 });
    res.json({ success: true, data });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
};

export const createAsset = async (req, res) => {
  try {
    const asset = await BiomedicalAsset.create({ hospitalId: req.user.hospitalId, ...req.body });
    res.json({ success: true, data: asset });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
};

export const getStockLedger = async (req, res) => {
  try {
    const { itemId, encounterId, page = 1, limit = 50 } = req.query;
    const filter = { hospitalId: req.user.hospitalId };
    if (itemId)     filter.itemId = itemId;
    if (encounterId) filter.encounterId = encounterId;
    const total = await StockLedger.countDocuments(filter);
    const data  = await StockLedger.find(filter)
      .sort({ txnAt: -1 }).skip((page-1)*limit).limit(Number(limit))
      .populate("itemId", "name itemCode");
    res.json({ success: true, data, total });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
};

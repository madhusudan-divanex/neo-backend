import Encounter    from "../../models/Hospital/Encounter.js";
import AuditLog     from "../../models/Hospital/AuditLog.js";
import ChargeLedger from "../../models/Hospital/ChargeLedger.js";
import ServiceCatalog from "../../models/Hospital/ServiceCatalog.js";
import HospitalPatient from "../../models/Hospital/HospitalPatient.js";
import User         from "../../models/Hospital/User.js";

// ── Create Encounter (OPD / IPD / ER) ─────────────────────────────────────
export const createEncounter = async (req, res) => {
  try {
    const { hospitalId } = req.user;
    const {
      patientId, patientNhcId, encounterType, visitMode,
      departmentId, attendingDoctorId,
      chiefComplaint, provisionalDiagnosis,
      allotmentId, unitName, bedNumber,
      appointmentId, triageLevel
    } = req.body;

    const encounter = await Encounter.create({
      hospitalId, patientId, patientNhcId, encounterType, visitMode,
      departmentId, attendingDoctorId, chiefComplaint, provisionalDiagnosis,
      allotmentId, unitName, bedNumber, appointmentId, triageLevel,
      status: "OPEN",
      createdBy: req.user._id,
      createdByRole: req.user.role,
      auditLog: [{
        actorId: req.user._id, actorName: req.user.name,
        actorRole: req.user.role, action: "CREATE",
        timestamp: new Date()
      }]
    });

    // Auto-post consultation charge if service catalog has a rule
    if (encounterType === "OPD" || encounterType === "ER") {
      const service = await ServiceCatalog.findOne({
        hospitalId, category: "CONSULTATION", autoCharge: true,
        chargeTrigger: "ADMIT", isActive: true
      });
      if (service) {
        await ChargeLedger.create({
          hospitalId, encounterId: encounter._id, patientId,
          serviceId: service._id, chargeCode: service.code,
          description: service.name, category: service.category,
          qty: 1, unitPrice: service.basePrice,
          taxPercent: service.taxPercent,
          sourceType: "AUTO",
          actorId: req.user._id, actorNhcId: req.user.nh12,
          actorRole: req.user.role, status: "POSTED"
        });
      }
    }

    await AuditLog.log({
      actorId: req.user._id, actorNhcId: req.user.nh12,
      actorName: req.user.name, actorRole: req.user.role,
      hospitalId, patientId, encounterId: encounter._id,
      module: "ENCOUNTER", action: "CREATE",
      after: { encounterType, visitMode }
    });

    res.json({ success: true, data: encounter });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// ── Get Encounters for hospital ────────────────────────────────────────────
export const getEncounters = async (req, res) => {
  try {
    const { hospitalId } = req.user;
    const { status, encounterType, patientId, page = 1, limit = 20 } = req.query;

    const filter = { hospitalId };
    if (status)        filter.status = status;
    if (encounterType) filter.encounterType = encounterType;
    if (patientId)     filter.patientId = patientId;

    const total = await Encounter.countDocuments(filter);
    const data  = await Encounter.find(filter)
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit).limit(Number(limit))
      .populate("patientId", "name contactNumber")
      .populate("attendingDoctorId", "name")
      .populate("departmentId", "name");

    res.json({ success: true, data, total, totalPages: Math.ceil(total / limit) });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// ── Get Single Encounter ───────────────────────────────────────────────────
export const getEncounterById = async (req, res) => {
  try {
    const encounter = await Encounter.findById(req.params.id)
      .populate("patientId")
      .populate("attendingDoctorId", "name profileImage")
      .populate("departmentId", "name")
      .populate("consultingDoctors", "name");
    if (!encounter) return res.status(404).json({ success: false, message: "Not found" });
    res.json({ success: true, data: encounter });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// ── Update Encounter Status ────────────────────────────────────────────────
export const updateEncounterStatus = async (req, res) => {
  try {
    const { status, finalDiagnosis, icdCode } = req.body;
    const encounter = await Encounter.findById(req.params.id);
    if (!encounter) return res.status(404).json({ success: false, message: "Not found" });

    // Rule: DISCHARGED status locks the encounter
    if (encounter.status === "DISCHARGED") {
      return res.status(400).json({ success: false, message: "Discharged encounter cannot be modified." });
    }

    const prev = encounter.status;
    encounter.status = status;
    if (finalDiagnosis) encounter.finalDiagnosis = finalDiagnosis;
    if (icdCode)        encounter.icdCode = icdCode;
    if (status === "DISCHARGED") encounter.endTime = new Date();

    encounter.auditLog.push({
      actorId: req.user._id, actorName: req.user.name,
      actorRole: req.user.role, action: `STATUS_${prev}_TO_${status}`,
      timestamp: new Date()
    });

    await encounter.save();

    await AuditLog.log({
      actorId: req.user._id, actorNhcId: req.user.nh12,
      actorName: req.user.name, actorRole: req.user.role,
      hospitalId: encounter.hospitalId,
      patientId: encounter.patientId, encounterId: encounter._id,
      module: "ENCOUNTER", action: "STATUS_CHANGE",
      before: { status: prev }, after: { status }
    });

    res.json({ success: true, data: encounter });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// ── Get Discharge Checklist gate ───────────────────────────────────────────
export const getDischargeReadiness = async (req, res) => {
  try {
    const encounter = await Encounter.findById(req.params.id);
    if (!encounter) return res.status(404).json({ success: false, message: "Not found" });

    // Check all pending charges
    const pendingCharges = await ChargeLedger.countDocuments({
      encounterId: encounter._id,
      status: { $in: ["PENDING"] }
    });

    const checklist = {
      ...encounter.dischargeChecklist.toObject(),
      pendingChargesCount: pendingCharges,
      canDischarge: pendingCharges === 0
        && encounter.dischargeChecklist.ordersClosed
        && encounter.dischargeChecklist.chargesPosted
        && encounter.dischargeChecklist.paymentSettled
    };

    res.json({ success: true, data: { encounter, checklist } });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// ── Post Manual Charge ─────────────────────────────────────────────────────
export const postCharge = async (req, res) => {
  try {
    const { hospitalId } = req.user;
    const { encounterId, serviceId, description, qty = 1, unitPrice, taxPercent = 0, category, sourceType = "MANUAL" } = req.body;

    const charge = await ChargeLedger.create({
      hospitalId, encounterId,
      patientId: req.body.patientId,
      serviceId, description, qty, unitPrice, taxPercent, category, sourceType,
      actorId: req.user._id, actorNhcId: req.user.nh12,
      actorRole: req.user.role, status: "POSTED"
    });

    res.json({ success: true, data: charge });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// ── Get Charge Ledger (billing timeline) ────────────────────────────────────
export const getChargeLedger = async (req, res) => {
  try {
    const charges = await ChargeLedger.find({ encounterId: req.params.encounterId })
      .sort({ chargedAt: 1 })
      .populate("serviceId", "name code category");

    const summary = {
      total: charges.reduce((s, c) => s + (c.netAmount || 0), 0),
      paid:  charges.filter(c => c.status === "PAID").reduce((s, c) => s + (c.netAmount || 0), 0),
      pending: charges.filter(c => c.status === "PENDING").reduce((s, c) => s + (c.netAmount || 0), 0),
      byCategory: {}
    };
    charges.forEach(c => {
      summary.byCategory[c.category] = (summary.byCategory[c.category] || 0) + (c.netAmount || 0);
    });

    res.json({ success: true, data: charges, summary });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// ── Void Charge ────────────────────────────────────────────────────────────
export const voidCharge = async (req, res) => {
  try {
    const { reason } = req.body;
    if (!reason) return res.status(400).json({ success: false, message: "Void reason required" });

    const charge = await ChargeLedger.findById(req.params.chargeId);
    if (!charge) return res.status(404).json({ success: false, message: "Not found" });
    if (charge.status === "PAID") return res.status(400).json({ success: false, message: "Paid charge cannot be voided directly. Raise refund." });

    charge.status     = "VOIDED";
    charge.voidReason = reason;
    charge.voidedBy   = req.user._id;
    charge.voidedByNhcId = req.user.nh12;
    charge.voidedAt   = new Date();
    await charge.save();

    await AuditLog.log({
      actorId: req.user._id, actorNhcId: req.user.nh12,
      actorName: req.user.name, actorRole: req.user.role,
      hospitalId: charge.hospitalId, encounterId: charge.encounterId,
      module: "CHARGE_LEDGER", action: "VOID",
      resourceId: charge._id,
      before: { status: "POSTED" }, after: { status: "VOIDED", reason }
    });

    res.json({ success: true, data: charge });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

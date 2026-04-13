import express from "express";
import auth from "../../middleware/auth.js";
import DischargeEnhanced from "../../models/Hospital/DischargeEnhanced.js";
import Encounter from "../../models/Hospital/Encounter.js";
import AuditLog from "../../models/Hospital/AuditLog.js";

const router = express.Router();

// Create discharge summary
router.post("/", auth, async (req, res) => {
  try {
    const { encounterId } = req.body;
    const encounter = await Encounter.findById(encounterId);
    if (!encounter) return res.status(404).json({ success: false, message: "Encounter not found" });

    const discharge = await DischargeEnhanced.create({
      hospitalId: req.user.hospitalId, encounterId,
      patientId: encounter.patientId,
      allotmentId: encounter.allotmentId,
      attendingDoctorId: encounter.attendingDoctorId,
      admissionDate: encounter.startTime,
      ...req.body,
      createdBy: req.user._id, createdByRole: req.user.role
    });

    res.json({ success: true, data: discharge });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});

// Get discharge by encounter
router.get("/encounter/:encounterId", auth, async (req, res) => {
  try {
    const data = await DischargeEnhanced.findOne({ encounterId: req.params.encounterId })
      .populate("attendingDoctorId", "name profileImage")
      .populate("patientId", "name contactNumber")
      .populate("followUpDoctor", "name");
    res.json({ success: true, data });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});

// Update discharge (before sign-off)
router.put("/:id", auth, async (req, res) => {
  try {
    const discharge = await DischargeEnhanced.findById(req.params.id);
    if (!discharge) return res.status(404).json({ success: false, message: "Not found" });
    if (discharge.isLocked) return res.status(400).json({ success: false, message: "Discharge is locked. Only addendum allowed." });
    Object.assign(discharge, req.body);
    await discharge.save();
    res.json({ success: true, data: discharge });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});

// Sign-off (locks record, changes encounter to DISCHARGED)
router.post("/:id/sign", auth, async (req, res) => {
  try {
    const discharge = await DischargeEnhanced.findById(req.params.id);
    if (!discharge) return res.status(404).json({ success: false, message: "Not found" });

    discharge.signedBy   = req.user._id;
    discharge.signedByNhcId = req.user.nh12;
    discharge.signedAt   = new Date();
    discharge.dischargeDate = discharge.dischargeDate || new Date();
    discharge.isLocked   = true;
    await discharge.save();

    // Lock encounter
    await Encounter.findByIdAndUpdate(discharge.encounterId, {
      status: "DISCHARGED", endTime: new Date(),
      "dischargeChecklist.summarySignedOff": true,
      dischargeType: discharge.dischargeType,
      followUpDoctor: discharge.followUpDoctor,
      followUpDate: discharge.followUpDate
    });

    await AuditLog.log({
      actorId: req.user._id, actorNhcId: req.user.nh12,
      actorName: req.user.name, actorRole: req.user.role,
      hospitalId: req.user.hospitalId,
      encounterId: discharge.encounterId,
      module: "DISCHARGE", action: "SIGN_OFF",
      resourceId: discharge._id,
      after: { dischargeType: discharge.dischargeType, signedAt: discharge.signedAt }
    });

    res.json({ success: true, data: discharge });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});

// Audit history for discharge
router.get("/:id/audit", auth, async (req, res) => {
  try {
    const discharge = await DischargeEnhanced.findById(req.params.id);
    const logs = await AuditLog.find({ resourceId: req.params.id }).sort({ timestamp: 1 });
    res.json({ success: true, data: { discharge, auditLogs: logs } });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});

export default router;

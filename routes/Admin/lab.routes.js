import express from "express";
import LabAppointment from "../../models/LabAppointment.js";
import {
  getLaboratories,
  toggleLabStatus,
  deleteLab,
  getLaboratorieDetail,
  LabAppointmentGet,
  getLabAppointmentDetail,
  approveRejectLab
} from "../../controller/Admin/lab.controller.js";

const router = express.Router();

// ── Specific routes FIRST ─────────────────────────────────────────────
router.get("/", getLaboratories);

router.get("/all-appointments", async (req, res) => {
  try {
    const { page = 1, limit = 10, status } = req.query;
    const filter = {};
    if (status && status !== "all") filter.status = status;
    const total = await LabAppointment.countDocuments(filter);
    const data  = await LabAppointment.find(filter)
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit).limit(Number(limit))
      .populate("labId",      "name")
      .populate("patientId",  "name contactNumber");
    res.json({ success: true, data, total, totalPages: Math.ceil(total / limit) });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});


// Single lab appointment detail
router.get("/appointment/:id", async (req, res) => {
  try {
    const appt = await LabAppointment.findById(req.params.id)
      .populate("patientId", "name contactNumber email profileImage unique_id")
      .populate("labId",     "name contactNumber email profileImage unique_id")
      .populate("doctorId",  "name contactNumber email profileImage unique_id")
      .populate("testId",    "name shortName")
      .lean();
    if (!appt) return res.status(404).json({ success: false, message: "Not found" });

    // Patient demographic
    const PatDemog = (await import("../../models/Patient/demographic.model.js")).default;
    const demographic = appt.patientId?._id
      ? await PatDemog.findOne({ userId: appt.patientId._id }).lean()
      : null;

    res.json({ success: true, data: { ...appt, demographic } });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ── Param routes AFTER ───────────────────────────────────────────────
router.get("/lab-detail/:id",        getLaboratorieDetail);
router.get("/lab-appointments/:id",  LabAppointmentGet);
router.get("/appointments-detail/:id", getLabAppointmentDetail);
router.patch("/:id/status",          toggleLabStatus);
router.patch("/:id/approve-reject",  approveRejectLab);
router.delete("/:id",                deleteLab);

export default router;

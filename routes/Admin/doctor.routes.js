import express from "express";
import adminAuth from "../../middleware/adminAuth.js";
import DoctorAppointment from "../../models/DoctorAppointment.js";
import DoctorAbout from "../../models/Doctor/addressAbout.model.js";
import {
  getDoctors,
  getDoctorDetail,
  getDoctorAppointments,
  toggleDoctorStatus,
  deleteDoctor,
  approveRejectDoctor
} from "../../controller/Admin/doctor.controller.js";

const router = express.Router();

// ── Specific routes FIRST (before /:id) ──────────────────────────────
router.get("/", adminAuth, getDoctors);

// All appointments (must be before /:id)
router.get("/all-appointments", adminAuth, async (req, res) => {
  try {
    const { page = 1, limit = 10, status, search } = req.query;
    const filter = {};
    if (status && status !== "all") filter.status = status;
    const total = await DoctorAppointment.countDocuments(filter);
    const data  = await DoctorAppointment.find(filter)
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit).limit(Number(limit))
      .populate("doctorId", "name profileImage contactNumber")
      .populate("patientId", "name profileImage contactNumber");
    res.json({ success: true, data, total, totalPages: Math.ceil(total / limit) });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ── Param routes AFTER specific routes ───────────────────────────────
// Single appointment detail
router.get("/appointment/:id", adminAuth, async (req, res) => {
  try {
    const appt = await DoctorAppointment.findById(req.params.id)
      .populate("patientId", "name contactNumber email profileImage unique_id")
      .populate("doctorId",  "name contactNumber email profileImage unique_id")
      .populate("prescriptionId")
      .populate({ path: "labTest.lab",   select: "name contactNumber email" })
      .populate({ path: "labTest.labTests", select: "name shortName" })
      .lean();
    if (!appt) return res.status(404).json({ success: false, message: "Not found" });

    // Get patient demographic for age/gender/address
    const User = (await import("../../models/Hospital/User.js")).default;
    const PatDemog = (await import("../../models/Patient/demographic.model.js")).default;
    const demographic = appt.patientId?._id
      ? await PatDemog.findOne({ userId: appt.patientId._id })
          .populate("countryId stateId cityId", "name").lean()
      : null;

    // Get doctor speciality
    const DoctorAboutModel = (await import("../../models/Doctor/addressAbout.model.js")).default;
    const docAbout = appt.doctorId?._id
      ? await DoctorAboutModel.findOne({ userId: appt.doctorId._id })
          .populate("specialty", "name").lean()
      : null;

    res.json({ success: true, data: { ...appt, demographic, docAbout } });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

router.get("/:id", adminAuth, getDoctorDetail);
router.get("/:id/appointments", adminAuth, getDoctorAppointments);
router.patch("/:doctorId/status", adminAuth, toggleDoctorStatus);
router.patch("/:id/approve-reject", adminAuth, approveRejectDoctor);
router.delete("/:id", adminAuth, deleteDoctor);

export default router;

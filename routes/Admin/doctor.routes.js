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
  approveRejectDoctor, getDoctorAppointmentData,
  getDoctorRequests
} from "../../controller/Admin/doctor.controller.js";
import User from "../../models/Hospital/User.js";

const router = express.Router();

// ── Specific routes FIRST (before /:id) ──────────────────────────────
router.get("/", adminAuth, getDoctors);
router.get("/requests", adminAuth, getDoctorRequests);

// All appointments (must be before /:id)
router.get("/all-appointments", adminAuth, async (req, res) => {
  try {
    const { page = 1, limit = 10, status, search } = req.query;
    const filter = {};
    if (search) {
      const patients = await User.find({
        role: "patient", $or: [
          { nh12: { $regex: search, $options: "i" } },
          { name: { $regex: search, $options: "i" } },
          { email: { $regex: search, $options: "i" } },
          { contactNumber: { $regex: search, $options: "i" } },
        ]
      }).select("_id")
      if (patients.length > 0) {
        filter.patientId = { $in: patients }
      }

    }
    if (status && status !== "all") filter.status = status;
    const total = await DoctorAppointment.countDocuments(filter);
    const data = await DoctorAppointment.find(filter)
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit).limit(Number(limit))
      .populate({
        path: "doctorId", select: "name email contactNumber nh12 doctorId",
        populate: ({ path: "doctorId", select: "profileImage" })
      })
      .populate({
        path: "patientId", select: "name email contactNumber nh12 patientId",
        populate: ({ path: "patientId", select: "profileImage" })
      });


    res.json({ success: true, data, total, totalPages: Math.ceil(total / limit) });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ── Param routes AFTER specific routes ───────────────────────────────
// Single appointment detail
router.get("/appointment/:id", adminAuth, getDoctorAppointmentData);

router.get("/:id", adminAuth, getDoctorDetail);
router.get("/:id/appointments", adminAuth, getDoctorAppointments);
router.patch("/:doctorId/status", adminAuth, toggleDoctorStatus);
router.patch("/:id/approve-reject", adminAuth, approveRejectDoctor);
router.delete("/:id", adminAuth, deleteDoctor);
export default router;

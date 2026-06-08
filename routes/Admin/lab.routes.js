import express from "express";
import LabAppointment from "../../models/LabAppointment.js";
import {
  getLaboratories,
  toggleLabStatus,
  deleteLab,
  getLaboratorieDetail,
  LabAppointmentGet,
  getLabAppointmentDetail, getLabAppointmentData,
  approveRejectLab,
  getLabRequests
} from "../../controller/Admin/lab.controller.js";
import adminAuth from "../../middleware/adminAuth.js";
import User from "../../models/Hospital/User.js";

const router = express.Router();

// ── Specific routes FIRST ─────────────────────────────────────────────
router.get("/", getLaboratories);
router.get("/requests", getLabRequests);

router.get("/all-appointments", async (req, res) => {
  try {
    const { page = 1, limit = 10, status, search = '' } = req.query;
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
    const total = await LabAppointment.countDocuments(filter);
    const data = await LabAppointment.find(filter)
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit).limit(Number(limit))
      .populate({
        path: "labId", select: "name email contactNumber nh12 labId",
        populate: ({ path: "labId", select: "logo" })
      })
      .populate({
        path: "patientId", select: "name email contactNumber nh12 patientId",
        populate: ({ path: "patientId", select: "profileImage" })
      }).populate('tests.category');
    res.json({ success: true, data, total, totalPages: Math.ceil(total / limit) });
  } catch (err) {
    res.status(500).json({ success: false, message: "Internal server error" });
  }
});


// Single lab appointment detail
router.get("/appointment/:id", adminAuth, getLabAppointmentData);

// ── Param routes AFTER ───────────────────────────────────────────────
router.get("/lab-detail/:id", getLaboratorieDetail);
router.get("/lab-appointments/:id", LabAppointmentGet);
router.get("/appointments-detail/:id", getLabAppointmentDetail);
router.patch("/:id/status/:status", toggleLabStatus);
router.patch("/:id/approve-reject", approveRejectLab);
router.delete("/:id", deleteLab);

export default router;

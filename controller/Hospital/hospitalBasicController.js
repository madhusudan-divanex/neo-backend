import HospitalBasic from "../../models/Hospital/HospitalBasic.js";
import User from "../../models/Hospital/User.js";
import { saveToGrid } from "../../services/gridfsService.js";

const saveBasic = async (req, res) => {
    try {
        const hospital = await HospitalBasic.findById(req.user.hospitalId);

        Object.assign(hospital, req.body);

        if (req.file) {
            const file = await saveToGrid(req.file.buffer, req.file.originalname, req.file.mimetype);
            hospital.logoFileId = file._id.toString();
        }

        await hospital.save();

        res.json({ message: "Basic details saved", hospital });
    } catch (err) {
        res.status(500).json({ message: "Server error" });
    }
};
const PatientList = async (req, res) => {
  try {
    const patients = await User.find({
      hospitalId: req.user.id,
      role: "patient"
    }).select("-password");

    res.json({ success: true, data: patients });
  } catch (err) {
    res.status(500).json({ message: "Failed to load patients" });
  }
};

/* ===============================
   DOCTOR LIST
================================ */
const DoctorList = async (req, res) => {
  try {
    const doctors = await User.find({
      hospitalId: req.user.id,
      role: "doctor"
    }).select("-password");

    res.json({ success: true, data: doctors });
  } catch (err) {
    res.status(500).json({ message: "Failed to load doctors" });
  }
};
/* ===============================
   STAFF LIST
================================ */
const StaffList = async (req, res) => {
  try {
    const staff = await User.find({
      hospitalId: req.user.id,
      role: { $in: ["staff", "nurse", "receptionist"] }
    }).select("-password");

    res.json({ success: true, data: staff });
  } catch (err) {
    res.status(500).json({ message: "Failed to load staff" });
  }
};

export default {saveBasic,StaffList,DoctorList,PatientList}
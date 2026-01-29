import DoctorAbout from "../../models/Doctor/addressAbout.model.js";
import DoctorAppointment from "../../models/DoctorAppointment.js";
import HospitalBasic from "../../models/Hospital/HospitalBasic.js";
import User from "../../models/Hospital/User.js";
import LabAppointment from "../../models/LabAppointment.js";
import Laboratory from "../../models/Laboratory/laboratory.model.js";
import TestReport from "../../models/testReport.js";
import { saveToGrid } from "../../services/gridfsService.js";

// ================= SAVE BASIC DETAILS =================
export const saveBasic = async (req, res) => {
  try {
    const hospital = await HospitalBasic.findById(req.user.created_by_id);
    const basic = req.body
    const userId=req.user.id
    Object.assign(hospital, req.body);

    if (req.file) {
      const file = await saveToGrid(
        req.file.buffer,
        req.file.originalname,
        req.file.mimetype
      );
      hospital.logoFileId = file._id.toString();
    }

    await hospital.save();
    if (hospital) {
      const baseUrl = `api/file/`;
      await User.findByIdAndUpdate(userId, { name: basic.hospitalName, email: basic.email }, { new: true })
      await Laboratory.findOneAndUpdate({userId:userId}, {
        name: basic.hospitalName,
        email: basic.email,
        contactNumber: basic.mobileNo,
        gstNumber: basic.gstNumber,
        about: basic.about,
        logo:basic.logoFieldId ? baseUrl + basic.logoFieldId:null,
      }, { new: true })
    }

    res.json({ message: "Basic details saved", hospital });
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
};

// ================= PATIENT LIST =================
export const PatientList = async (req, res) => {
  try {
    const patients = await User.find({
      created_by_id: req.user.id,
      role: "patient"
    }).select("-password");

    res.json({ success: true, data: patients });
  } catch (err) {
    res.status(500).json({ message: "Failed to load patients" });
  }
};

// ================= DOCTOR LIST =================
export const DoctorList = async (req, res) => {
  try {
    const doctors = await User.find({
      created_by_id: req.user.id,
      role: "doctor"
    }).select("-password");

    res.json({ success: true, data: doctors });
  } catch (err) {
    res.status(500).json({ message: "Failed to load doctors" });
  }
};

// ================= STAFF LIST =================
export const StaffList = async (req, res) => {
  try {
    const staff = await User.find({
      created_by_id: req.user.id,
      role: { $in: ["staff", "nurse", "receptionist"] }
    }).select("-password");

    res.json({ success: true, data: staff });
  } catch (err) {
    res.status(500).json({ message: "Failed to load staff" });
  }
};

export const getHospitalPatientReport = async (req, res) => {
  const hospitalId = req.params.hospitalId;
  const patientId = req.params.patientId
  try {
    const isExist = await HospitalBasic.findById(hospitalId);
    if (!isExist) {
      return res.status(200).json({ message: 'Hospital not exist', success: false });
    }
    const doctorAdd = await DoctorAbout.find({ hospitalName: hospitalId })
    const doctorIds = doctorAdd.map(item => item.userId)
    const appointments = await DoctorAppointment.find({
      doctorId: { $in: doctorIds }, patientId,
      "labTest.lab": { $exists: true, $ne: null },
      "labTest.labTests.0": { $exists: true }
    })
    const aptIds = appointments.map(item => item._id)
    const labAppointments = await LabAppointment.find({ doctorAp: { $in: aptIds }, status: 'deliver-report' })
    const labAptIds = labAppointments.map(item => item?._id)
    const labReports = await TestReport.find({ appointmentId: { $in: labAptIds } }).populate('labId').populate('testId')
      .populate('appointmentId')
    return res.status(200).json({ message: "labReports", data: labReports, success: true })

  } catch (error) {
    console.error(error);
    return res.status(500).json({
      message: "Internal Server Error",
      success: false,
    });
  }
}
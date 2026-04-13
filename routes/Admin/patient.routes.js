import express from "express";
import {
  getPatients,
  getPatientDetail,
  deletePatient,
  getHospitalPastAppointment,
  getPastPatientLabAppointment,
  getPatientAllotments,
  getPatientLabReports
} from "../../controller/Admin/patient.controller.js";
import adminAuth from "../../middleware/adminAuth.js";

const router = express.Router();

router.get("/", adminAuth, getPatients);
router.get("/detail/:id", adminAuth, getPatientDetail);
router.delete("/:id", adminAuth, deletePatient);
router.get('/hospital/past-appointments/:hospitalId/:patientId',adminAuth,getHospitalPastAppointment)
router.get('/lab/past-appointments/:labId/:patientId',adminAuth,getPastPatientLabAppointment)

export default router;

router.get("/:id/allotments",   adminAuth, getPatientAllotments);
router.get("/:id/lab-reports",  adminAuth, getPatientLabReports);

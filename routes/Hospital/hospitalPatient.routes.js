import express from "express";

import auth from "../../middleware/auth.js";
import {
  addPatient,
  listPatients,
  getPatientById,
  updatePatient,
  deletePatient,
  getPatientByPatientId,
  admitPatient,
} from "../../controller/Hospital/hospitalPatient.controller.js";
import { checkPermission } from "../../middleware/permissionCheck.js";

const router = express.Router();

router.post("/add", auth,checkPermission("patients","add"), addPatient);
router.post("/admit", auth,checkPermission("patients","add"), admitPatient);
router.get("/list", auth, listPatients);
router.get("/by-patient-id/:patientId", auth, getPatientByPatientId);
router.get("/:id", auth,getPatientById);
router.put("/:id", auth,checkPermission("patients","edit"), updatePatient);
// router.delete("/:id", auth,checkPermission("patients","delete"), deletePatient);
export default router;

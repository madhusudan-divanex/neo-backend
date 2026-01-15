import express from "express";

import auth from "../../middleware/auth.js";
import {
  addPatient,
  listPatients,
  getPatientById,
  updatePatient,
  deletePatient,
  getPatientByPatientId,
} from "../../controller/Hospital/hospitalPatient.controller.js";

const router = express.Router();

router.post("/add", auth, addPatient);
router.get("/list", auth, listPatients);
router.get("/by-patient-id/:patientId", auth, getPatientByPatientId);
router.get("/:id", auth, getPatientById);
router.put("/:id", auth, updatePatient);
router.delete("/:id", auth, deletePatient);
export default router;

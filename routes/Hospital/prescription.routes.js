import express from "express";
import auth from "../../middleware/auth.js";

import {
  addPrescription,
  getPrescriptionsByPatient,
  getPrescriptionById,
  updatePrescription
} from "../../controller/Hospital/prescription.controller.js";

const router = express.Router();

router.post("/add", auth, addPrescription);
router.get("/patient/:patientId", auth, getPrescriptionsByPatient);
router.get("/:id", auth, getPrescriptionById);
router.put("/:id", auth, updatePrescription);

export default router;

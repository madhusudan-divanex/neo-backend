import express from "express";
const hospitalPrescription = express.Router();
import controller from "../../controller/Hospital/prescription.controller.js";
import auth from "../../middleware/auth.js";

hospitalPrescription.post("/add", auth, controller.addPrescription);
hospitalPrescription.get("/patient/:patientId", auth, controller.getPrescriptionsByPatient);
hospitalPrescription.get("/:id", auth, controller.getPrescriptionById);
hospitalPrescription.put("/:id", auth, controller.updatePrescription);

export default hospitalPrescription;

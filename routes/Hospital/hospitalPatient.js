import express from "express";
const hospitalPatient = express.Router();
import { addPatient,listPatients,getPatientById,updatePatient,deletePatient } from "../../controller/Hospital/hospitalPatient.controller.js";
import auth from "../../middleware/auth.js";

hospitalPatient.post("/add", auth, addPatient);
hospitalPatient.get("/list", auth, listPatients);
hospitalPatient.get("/:id", auth, getPatientById);
hospitalPatient.put("/:id", auth, updatePatient);
hospitalPatient.delete("/:id", auth, deletePatient);

export default hospitalPatient;

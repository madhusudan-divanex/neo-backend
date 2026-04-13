import express from "express";
import adminAuth from "../../middleware/adminAuth.js";
import { getHospitals, deleteHospital, getHospitalDetail, approveRejectHospital } from "../../controller/Admin/hospital.controller.js";

const router = express.Router();

router.get("/",                      adminAuth, getHospitals);
router.patch("/:id/approve-reject",  adminAuth, approveRejectHospital);  // BEFORE /:id
router.get("/:id",                   adminAuth, getHospitalDetail);
router.delete("/:id",                adminAuth, deleteHospital);

export default router;

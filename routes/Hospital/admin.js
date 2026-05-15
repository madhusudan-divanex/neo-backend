import express from "express";

import auth from "../../middleware/auth.js";
import admin from "../../middleware/admin.js";
import HospitalBasic from "../../models/Hospital/HospitalBasic.js";
import KycLog from "../../models/Hospital/KycLog.js";
import authMiddleware from "../../middleware/authMiddleare.js";
import { addDoctorByAdmin, addHospitalCategory, addLabByAdmin, addPatientBanner, addPatientByAdmin, addPharmacyByAdmin, addPharmacyCategory, addSpecialty, addTestCategory,  blockUserController,  deleteHospitalCategory,  deletePatientBanner, deletePharmacyCategory, deleteSpecialty, deleteTestCategory, getCmsData, getHospitalCategory, getPatientBanner, getPharmacyCategory, getSpecialty, getTestCategory, updateHospitalCategory, updatePatientBanner, updatePharmacyCategory, updateSpecialty, updateTestCategory } from "../../controller/Admin/adminController.js";
import getUploader from "../../config/multerConfig.js";
import adminAuth from "../../middleware/adminAuth.js";

const router = express.Router();

// list pending
router.get("/pending", auth, admin, async (req, res) => {
  const list = await HospitalBasic.find({ kycStatus: "pending" });
  res.json(list);
});

// review (approve / reject)
router.post("/review/:id", auth, admin, async (req, res) => {
  const hospital = await HospitalBasic.findById(req.params.id);
  const { status, comment } = req.body;

  const prev = hospital.kycStatus;
  hospital.kycStatus = status;
  await hospital.save();

  await KycLog.create({
    hospitalId: hospital._id,
    changedBy: req.user._id,
    fromStatus: prev,
    toStatus: status,
    comment
  });

  res.json({ message: "KYC updated", hospital });
});


const uploader=getUploader('admin')

router.post('/speciality',adminAuth,uploader.single('icon'),addSpecialty)
router.put('/speciality',adminAuth,uploader.single('icon'),updateSpecialty)
router.get('/speciality',getSpecialty)
router.delete('/speciality/:id',adminAuth,deleteSpecialty)

router.post('/test-category',adminAuth,uploader.single('icon'),addTestCategory)
router.put('/test-category',adminAuth,uploader.single('icon'),updateTestCategory)
router.get('/test-category',getTestCategory)
router.delete('/test-category/:id',adminAuth,deleteTestCategory)




router.post('/patient-banner',authMiddleware,uploader.single('image'),addPatientBanner)
router.put('/patient-banner',authMiddleware,uploader.single('image'),updatePatientBanner)
router.get('/patient-banner',getPatientBanner)
router.delete('/patient-banner/:id',authMiddleware,deletePatientBanner)


router.get('/cms',getCmsData)
router.post('/deactivate-user',blockUserController)
export default router;

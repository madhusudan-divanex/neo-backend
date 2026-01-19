import express from "express";
import multer from "multer";

import auth from "../../middleware/auth.js";

import * as basic from "../../controller/Hospital/hospitalBasicController.js";
import * as images from "../../controller/Hospital/hospitalImageController.js";
import * as address from "../../controller/Hospital/hospitalAddressController.js";
import * as contact from "../../controller/Hospital/hospitalContactController.js";
import * as cert from "../../controller/Hospital/hospitalCertificateController.js";
import * as kyc from "../../controller/Hospital/kycController.js";
import * as profile from "../../controller/Hospital/profileController.js";

const router = express.Router();
const upload = multer({ storage: multer.memoryStorage() });

router.get("",  profile.getHospitals);
router.get("/list",  profile.getHospitalList);
router.get("/profile-data/:id",  profile.getHospitalProfile);
router.get("/doctor/:id",  profile.getHospitalDoctors);
// ================= PROFILE =================
router.get("/get-hospital-profile", auth, profile.getProfile);
router.put("/update-hospital-profile", auth, profile.updateProfile);
router.post("/edit-request", auth, profile.sendEditRequest);
router.post(
  "/edit-request/:requestId/approve",
  auth,
  profile.approveEditRequest
);

// ================= STEP 1 : BASIC =================
router.post("/basic", auth, upload.single("logo"), basic.saveBasic);

// ================= STEP 2 : IMAGES =================
router.post(
  "/images",
  upload.fields([
    { name: "thumbnail", maxCount: 1 },
    { name: "gallery", maxCount: 5 }
  ]),
  auth,
  images.uploadImages
);

// ================= STEP 3 : ADDRESS =================
router.post("/address", auth, address.saveAddress);

// ================= STEP 4 : CONTACT =================
router.post(
  "/contact",
  auth,
  upload.single("profilePhoto"),
  contact.saveContact
);

// ================= STEP 5 : CERTIFICATE =================
router.post(
  "/certificate",
  upload.single("file"),
  auth,
  cert.uploadCertificate
);

// ================= KYC =================
router.post("/submit-kyc", auth, kyc.submitKyc);
router.post("/change-password", auth, profile.changePassword);

// ================= LISTS =================
router.get("/patient-list", auth, basic.PatientList);
router.get("/doctor-list", auth, basic.DoctorList);
router.get("/staff-list", auth, basic.StaffList);
router.get("/patient-lab-report/:hospitalId/:patientId", auth, basic.getHospitalPatientReport);


// ================= PERMISSIon =================
router.post('/permission',auth,profile.addHospitalPermission)
router.put('/permission',auth,profile.updateHospitalPermission)
router.get('/permission/:id',auth,profile.getAllPermission)
router.delete('/permission',auth,profile.deleteHospitalPermission)
export default router;

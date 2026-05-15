import express from "express";
import adminAuth from "../../middleware/adminAuth.js";

import {
  getLandingPageList,
  getLandingPage,
  saveLandingPage,
  saveFirstPharPage,
  getPharmacyLandingPage,
  saveSecondPharPage,
  saveThirdPharPage,
  saveFourthPharPage,
  saveFivethPharPage,
  saveFirstLabPage,
  getLabLandingPage,
  saveSecondLabPage,
  saveThirdLabPage,
  saveFourthLabPage,
  saveFivethLabPage,
  saveSixLabPage,
  saveSevenLabPage,
  saveFirstDoctorPage,
  saveSecondDoctorPage,
  saveThirdDoctorPage,
  saveFourthDoctorPage,
  saveFivethDoctorPage,
  getDoctorLandingPage,
  saveFirstPatientPage,
  getPatientLandingPage,
  savePatentTesimonial,
  saveHowItWork,
  deletePatentTesimonial,
  deleteHowItWorks,
  savePatientService,
  deletePatientService,
  saveFirstHospitalPage,
  saveSecondHospitalPage,
  saveThirdHospitalPage,
  saveFourthHospitalPage,
  getHospitalLandingPage,
  saveFourthMainPage,
  getMainLandingPage,
  saveThirdMainPage,
  saveSecondMainPage,
  saveFirstMainPage
} from "../../controller/Admin/LandingPage.controller.js";
import getUploader from "../../config/multerConfig.js";

const router = express.Router();
const uploader = getUploader("landing");
// All landing pages list
// router.get("/", adminAuth, getLandingPageList);

// Get landing page by type (doctor/hospital/lab/pharmacy)
// router.get("/:type", adminAuth, getLandingPage);
// router.get("/:type", getLandingPage);

// Save / Update landing page
// router.post("/:type", adminAuth, saveLandingPage);

router.post("/first-phar-page", adminAuth, uploader.array("image"), saveFirstPharPage);
router.get("/pharmacy", getPharmacyLandingPage);
router.post("/second-phar-page", adminAuth, uploader.array("image"), saveSecondPharPage);
router.post("/third-phar-page", adminAuth, saveThirdPharPage);
router.post("/fourth-phar-page", adminAuth, saveFourthPharPage);
router.post("/fiveth-phar-page", adminAuth, uploader.array("image"), saveFivethPharPage);

router.post("/first-lab-page", adminAuth, uploader.array("image"), saveFirstLabPage);
router.get("/lab", getLabLandingPage);
router.post("/second-lab-page", adminAuth, uploader.array("image"), saveSecondLabPage);
router.post("/third-lab-page", adminAuth, uploader.array("image"), saveThirdLabPage);
router.post("/fourth-lab-page", adminAuth, uploader.array("image"), saveFourthLabPage);
router.post("/fiveth-lab-page", adminAuth, uploader.array("image"), saveFivethLabPage);
router.post("/six-lab-page", adminAuth, uploader.array("image"), saveSixLabPage);
router.post("/seven-lab-page", adminAuth, saveSevenLabPage);


router.post("/first-doctor-page", adminAuth, saveFirstDoctorPage);
router.get("/doctor", getDoctorLandingPage);
router.post("/second-doctor-page", adminAuth, saveSecondDoctorPage);
router.post("/third-doctor-page", adminAuth, saveThirdDoctorPage);
router.post("/fourth-doctor-page", adminAuth, saveFourthDoctorPage);
router.post("/fiveth-doctor-page", adminAuth, saveFivethDoctorPage);

router.post(
  "/first-patient-page",
  adminAuth,
  uploader.fields([
    { name: "heroImage", maxCount: 1 },
    { name: "downloadImage", maxCount: 1 },
    { name: "howItWorkImage", maxCount: 1 }
  ]),
  saveFirstPatientPage
);
router.get("/patient", getPatientLandingPage);
router.post("/patient-testimonial",adminAuth,uploader.fields([{ name: "image", maxCount: 1 }]),savePatentTesimonial);
router.delete("/patient-testimonial/:id",adminAuth,deletePatentTesimonial);
router.post("/patient-how-it-works", adminAuth,uploader.fields([{ name: "image", maxCount: 1 }]), saveHowItWork);
router.delete("/patient-how-it-works/:id",adminAuth,deleteHowItWorks);
router.post("/patient-service", adminAuth,uploader.fields([{ name: "image", maxCount: 1 }]), savePatientService);
router.delete("/patient-service/:id",adminAuth,deletePatientService);

router.post("/first-main-page", adminAuth,uploader.any("image"), saveFirstMainPage);
router.get("/main", getMainLandingPage);
router.post("/second-main-page", adminAuth,uploader.array("image"), saveSecondMainPage);
router.post("/third-main-page", adminAuth, uploader.array("image"),saveThirdMainPage);
router.post("/fourth-main-page", adminAuth, saveFourthMainPage);


router.get("/hospital", getHospitalLandingPage);
router.post("/first-hospital-page",adminAuth,saveFirstHospitalPage);
router.post("/second-hospital-page",adminAuth,uploader.array("image"),saveSecondHospitalPage);
router.post("/third-hospital-page", adminAuth, saveThirdHospitalPage);
router.post("/fourth-hospital-page",adminAuth,saveFourthHospitalPage);

export default router;
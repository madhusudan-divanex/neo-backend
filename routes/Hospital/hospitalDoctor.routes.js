import express from "express";
import multer from "multer";

import auth from "../../middleware/auth.js";
import {
  createHospitalDoctor,
  getHospitalDoctorList,
  getHospitalDoctorById,
  getHospitalDoctorByIdNew,
  updateHospitalDoctor,
  getMyAllStaffList,
  deleteDoctor,
  saveDoctorProfessionalDetails,
  doctorEmploymentDetails,
  saveDoctorAccess
} from "../../controller/Hospital/hospitalDoctor.controller.js";
import getUploader from "../../config/multerConfig.js";

const router = express.Router();

const storage = multer.diskStorage({
  destination: "uploads/staff",
  filename: (_, file, cb) => {
    cb(null, Date.now() + "-" + file.originalname);
  }
});
const uploader = getUploader('doctor');

router.post(
  "/create",
  auth,
 uploader.single('profileImage'),
  createHospitalDoctor
);

router.post(
  "/professional-details",
  uploader.array("medicalLicense"),
  saveDoctorProfessionalDetails
);
router.post(
  "/employment-details",auth,
  doctorEmploymentDetails
);
router.post(
  "/access-details",auth,
  saveDoctorAccess
);
router.get("/list", auth, getHospitalDoctorList);
router.get("/my-all-staff", auth, getMyAllStaffList);
router.get("/get-by-id/:id", auth, getHospitalDoctorByIdNew);

router.get("/:id", auth, getHospitalDoctorById);

router.put(
  "/:id",
  auth,
  // upload.fields([
  //   { name: "profileImage", maxCount: 1 },
  //   { name: "certificates", maxCount: 10 }
  // ]),
  updateHospitalDoctor
);

router.delete("/:id", auth, deleteDoctor);

export default router;

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
  saveDoctorAccess,
  getHospitalDoctorEmployement,
  getTimeSlots,
  addTimeSlot,
  updateDaySlot,
  availableDoctor,
  getDoctorAboutData
} from "../../controller/Hospital/hospitalDoctor.controller.js";
import getUploader from "../../config/multerConfig.js";
import { checkPermission } from "../../middleware/permissionCheck.js";
import StaffEmployement from "../../models/Staff/StaffEmployement.js";

const router = express.Router();

const storage = multer.diskStorage({
  destination: "uploads/staff",
  filename: (_, file, cb) => {
    cb(null, Date.now() + "-" + file.originalname);
  }
});
const uploader = getUploader('doctor');
const checkDoctorEmploymentPermission = async (req, res, next) => {
  const { userId } = req.body;

  const existingEmployment = await StaffEmployement.findOne({
    userId, organizationId: req.user.id
  });

  const action = existingEmployment ? "edit" : "add";

  return checkPermission("doctors", action)(req, res, next);
};
router.post(
  "/create",
  auth, checkPermission("doctors", "add"),
  uploader.single('profileImage'),
  createHospitalDoctor
);

router.post(
  "/professional-details", auth,
  uploader.array("medicalLicenseFiles"),
  saveDoctorProfessionalDetails
);
router.post(
  "/employment-details", auth, checkDoctorEmploymentPermission,
  doctorEmploymentDetails
);
router.post(
  "/access-details", auth, checkDoctorEmploymentPermission,
  saveDoctorAccess
);
router.get("/list", auth, getHospitalDoctorList);
router.get("/my-all-staff", auth, getMyAllStaffList);
router.get("/get-by-id/:id", auth, getHospitalDoctorByIdNew);
router.get("/employment/:hospitalId/:doctorId", getHospitalDoctorEmployement);
router.get("/available/:department/:time", auth, availableDoctor)
router.get("/:id", auth, getHospitalDoctorById);
router.get("/time-slot/:userId/:hospitalId", getTimeSlots)
router.post("/time-slot", auth, addTimeSlot)
router.put("/time-slot", auth, updateDaySlot)

router.put(
  "/:id",
  auth,
  // upload.fields([
  //   { name: "profileImage", maxCount: 1 },
  //   { name: "certificates", maxCount: 10 }
  // ]),
  updateHospitalDoctor
);

router.get('/about/:id', auth, getDoctorAboutData)
// router.delete("/:id", auth,checkPermission("doctors","delete"), deleteDoctor);







export default router;

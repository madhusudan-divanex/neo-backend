import express from "express";
import multer from "multer";

import auth from "../../middleware/auth.js";
import {
  createHospitalStaff,
  getHospitalStaffList,
  getHospitalStaffById,
  getHospitalStaffByIdNew,
  updateHospitalStaff,
  getMyAllStaffList
} from "../../controller/Hospital/hospitalStaff.controller.js";

const router = express.Router();

const storage = multer.diskStorage({
  destination: "uploads/staff",
  filename: (_, file, cb) => {
    cb(null, Date.now() + "-" + file.originalname);
  }
});
const upload = multer({ storage });

router.post(
  "/create",
  upload.fields([
    { name: "profileImage", maxCount: 1 },
    { name: "certificates", maxCount: 10 }
  ]),
  auth,
  createHospitalStaff
);

router.get("/list", auth, getHospitalStaffList);
router.get("/my-all-staff", auth, getMyAllStaffList);
router.get("/get-by-id/:id", auth, getHospitalStaffByIdNew);

router.get("/:id", auth, getHospitalStaffById);

router.put(
  "/:id",
  auth,
  upload.fields([
    { name: "profileImage", maxCount: 1 },
    { name: "certificates", maxCount: 10 }
  ]),
  updateHospitalStaff
);

export default router;

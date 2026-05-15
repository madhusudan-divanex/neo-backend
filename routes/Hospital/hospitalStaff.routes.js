import express from "express";
import multer from "multer";

import auth from "../../middleware/auth.js";
import {
  createHospitalStaff,
  getHospitalStaffList,
  getHospitalStaffById,
  getHospitalStaffByIdNew,
  updateHospitalStaff,
  getMyAllStaffList,
  getHospitalStaffData,
  deleteHospitalStaffById,
  getHospitalStaffNh12
} from "../../controller/Hospital/hospitalStaff.controller.js";
import { checkPermission } from "../../middleware/permissionCheck.js";

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
  auth,checkPermission("staff","add"),
  createHospitalStaff
);

router.get("/list", auth,checkPermission("staff","list"), getHospitalStaffList);
router.get("/my-all-staff", auth, getMyAllStaffList);
router.get("/get-by-id/:id", auth,checkPermission("staff","view"), getHospitalStaffByIdNew);

router.get("/:id", auth, getHospitalStaffById);
// router.delete("/:id", auth, checkPermission("staff","delete"),deleteHospitalStaffById);

router.put(
  "/:id",
  auth,checkPermission("staff","edit"),
  upload.fields([
    { name: "profileImage", maxCount: 1 },
    { name: "certificates", maxCount: 10 }
  ]),
  updateHospitalStaff
);
router.get("/data/:id", auth, getHospitalStaffData);
router.get("/nh12/:id", auth, getHospitalStaffNh12);
export default router;

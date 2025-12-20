import express from "express";
const hospitalStaff = express.Router();
import multer from "multer";
import { createHospitalStaff,getHospitalStaffList,getHospitalStaffById,getHospitalStaffByIdNew,updateHospitalStaff,getMyAllStaffList } 
  from "../../controller/Hospital/hospitalStaff.controller.js";
import auth from "../../middleware/auth.js";

const storage = multer.diskStorage({
  destination: "uploads/staff",
  filename: (_, file, cb) => {
    cb(null, Date.now() + "-" + file.originalname);
  }
});
const upload = multer({ storage });



hospitalStaff.post("/create", upload.fields([
  { name: "profileImage", maxCount: 1 },
  { name: "certificates", maxCount: 10 }
]), auth, createHospitalStaff);
hospitalStaff.get('/list',auth,getHospitalStaffList);
hospitalStaff.get('/my-all-staff',auth,getMyAllStaffList);
hospitalStaff.get("/get-by-id/:id", auth, getHospitalStaffByIdNew);
hospitalStaff.get(
  "/:id",
  auth,
  getHospitalStaffById
);
hospitalStaff.put("/:id",auth,
  upload.fields([
    { name: "profileImage", maxCount: 1 },
    { name: "certificates", maxCount: 10 }
  ]),
  updateHospitalStaff
);


export default hospitalStaff;

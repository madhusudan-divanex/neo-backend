import express from "express";
const hospitalDoctor = express.Router();
import multer from "multer";
import { createHospitalDoctor,getHospitalDoctorList,getHospitalDoctorById,getHospitalDoctorByIdNew,updateHospitalDoctor,getMyAllStaffList,deleteDoctor } from "../../controller/Hospital/hospitalDoctor.controller.js";
import auth from "../../middleware/auth.js";

const storage = multer.diskStorage({
  destination: "uploads/staff",
  filename: (_, file, cb) => {
    cb(null, Date.now() + "-" + file.originalname);
  }
});
const upload = multer({ storage });



hospitalDoctor.post("/create", upload.fields([
  { name: "profileImage", maxCount: 1 },
  { name: "certificates", maxCount: 10 }
]), auth, createHospitalDoctor);
hospitalDoctor.get('/list',auth,getHospitalDoctorList);
hospitalDoctor.get('/my-all-staff',auth,getMyAllStaffList);
hospitalDoctor.get("/get-by-id/:id", auth, getHospitalDoctorByIdNew);
hospitalDoctor.get(
  "/:id",
  auth,
  getHospitalDoctorById
);
hospitalDoctor.put("/:id",auth,
  upload.fields([
    { name: "profileImage", maxCount: 1 },
    { name: "certificates", maxCount: 10 }
  ]),
  updateHospitalDoctor
);
hospitalDoctor.delete(
  "/:id",
  auth,
  deleteDoctor
);




export default hospitalDoctor;

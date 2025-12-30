import express from "express";
import auth from "../../middleware/auth.js";

import {
  GetDoctor,
  addExistingDoctorToHospital,
  searchUsers,
  saveFcmToken
} from "../../controller/Hospital/commanController.js";

const router = express.Router();

router.get("/check-doctor-id/:unique_id", GetDoctor);
router.post("/add-existing-doctor", auth, addExistingDoctorToHospital);
router.get("/search", auth, searchUsers);
router.post("/save-fcm-token", auth, saveFcmToken);

export default router;

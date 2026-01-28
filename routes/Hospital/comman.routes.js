import express from "express";
import auth from "../../middleware/auth.js";

import {
  GetDoctor,
  addExistingDoctorToHospital,
  searchUsers,
  saveFcmToken,
  getNotification,
  deleteNotification,
  deleteOneNotification,
  addPermission,
  updatePermission,
  deletePermission,
  getAllPermission
} from "../../controller/Hospital/commanController.js";
import authMiddleware from "../../middleware/authMiddleare.js";

const router = express.Router();

router.get("/check-doctor-id/:unique_id", GetDoctor);
router.post("/add-existing-doctor", auth, addExistingDoctorToHospital);
router.get("/search", auth, searchUsers);
router.post("/save-fcm-token", auth, saveFcmToken);
router.get("/notification", auth, getNotification);
router.delete("/delete-all-notification", auth, deleteNotification);
router.delete("/delete-notification/:id", auth, deleteOneNotification);


router.post('/permission',authMiddleware,addPermission)
router.put('/permission',authMiddleware,updatePermission)
router.get('/permission/:id',authMiddleware,getAllPermission)
router.delete('/permission',authMiddleware,deletePermission)


export default router;

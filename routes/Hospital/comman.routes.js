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
  getAllPermission,
  getProfile,
  allowedChat,
  createGroup,
  followUpQuestionController,
  askQuestionController,
  getAskQuestionController,
  getGeneralQuestionController,
  createChatSessionController,
  getChatSessionsController,
  getUserDataController,
  addOrUpatePaymentInfo
} from "../../controller/Hospital/commanController.js";
import authMiddleware from "../../middleware/authMiddleare.js";
import getUploader from "../../config/multerConfig.js";
import { askQuestionRateLimiter } from "../../utils/globalFunction.js";

const router = express.Router();
const uploader=getUploader('hospital')

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

router.get('/profile',authMiddleware,getProfile)

router.get('/chat-allowed/:patientId/:doctorId',authMiddleware,allowedChat)
router.post('/create-group',authMiddleware,uploader.single("image"),createGroup)

router.post("/create-chat",authMiddleware,createChatSessionController)
router.get("/chat-sessions",authMiddleware,getChatSessionsController)
router.post("/follow-up-question",authMiddleware,askQuestionRateLimiter,uploader.fields([
    { name: 'audio', maxCount: 1 },
    { name: 'file', maxCount: 1 }
  ]),followUpQuestionController)
router.post("/ask-question",authMiddleware,askQuestionRateLimiter,askQuestionController)
router.get("/ask/question",authMiddleware,getAskQuestionController)
router.get("/general/question",authMiddleware,getGeneralQuestionController)
router.get("/user-data/:nh12",authMiddleware,getUserDataController)
router.post("/payment-info",authMiddleware,uploader.single('qr'),addOrUpatePaymentInfo)
export default router;

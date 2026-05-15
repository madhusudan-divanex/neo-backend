import { addPrescriptions, changePassword, deletePatient, deletePrescription, editRequest, familyMedicalHistory,  forgotPassword,  getCustomProfile, getMedicalHistory, getNameProfile, getPatientDemographic, getPatientKyc, getPatientProfile, getProfile, getProfileDetail, patientDemographic, patientKyc, patientLocation, patientMedicalHistory, resendOtp, resetPassword, sendOtp, signInPatient, signUpPatient, updateImage, updatePatient, verifyOtp } from "../controller/Patient/authController.js"
import express from 'express'
import authMiddleware from "../middleware/authMiddleare.js"
import getUploader from "../config/multerConfig.js";
import { getLabReport,  getPatientAppointment } from "../controller/appointmentController.js";
import {  favoriteController,  getMyRating, getNearByDoctor, getPatientFavorite, getPatientFavoriteData, getPatientPrescriptions, getPatients, getPrescriptionLabDetail, getTopUserByCategory, getTopUsers, profileAction } from "../controller/Patient/patientController.js";

import { sendPush } from "../utils/sendPush.js";
import { getPatientFooterCategory } from "../controller/Admin/LandingPage.controller.js";
import { ChatList } from "../controller/Hospital/chatController.js";
const patient=express.Router()
const uploader = getUploader('patient');

patient.get("/conversations", authMiddleware, ChatList);
patient.post('',signUpPatient)
patient.get('/near-by-doctor',getNearByDoctor)
patient.get('/top-users',getTopUsers)
patient.get('/footer-category',getPatientFooterCategory)
patient.get('/category/top-users',getTopUserByCategory)
patient.get('/all',authMiddleware,getPatients)
patient.get('',authMiddleware,getProfile)
patient.get('/detail/:id',authMiddleware,getProfileDetail)
patient.get('/:id',getCustomProfile)
patient.get('/profile-detail/:id',getPatientProfile)
patient.get('/search/:name',authMiddleware,getNameProfile)

patient.post('/signin',signInPatient)
patient.post('/forgot-password',forgotPassword)
patient.post('/resend-otp',resendOtp)
patient.post('/send-otp',sendOtp)
patient.post('/verify-otp',verifyOtp)

patient.post('/change-password',authMiddleware,changePassword)
patient.post('/reset-password',authMiddleware,resetPassword)
patient.put('',uploader.fields([{ name: 'profileImage', maxCount: 1 },]),authMiddleware,updatePatient)
patient.delete('',authMiddleware,deletePatient)
patient.post('/kyc',uploader.fields([{ name: 'frontImage', maxCount: 1 },
    { name: 'backImage', maxCount: 1 }
]),authMiddleware,patientKyc)
patient.get('/kyc/:id',getPatientKyc)
patient.post('/prescription', uploader.array('fileUrl'), authMiddleware, addPrescriptions);
patient.delete('/prescription/:id/:itemId',authMiddleware,deletePrescription)
patient.post('/medical-history',authMiddleware,patientMedicalHistory)
patient.get('/medical-history/:id',authMiddleware,getMedicalHistory)
patient.post('/family-medical-history',authMiddleware,familyMedicalHistory)
patient.post('/demographic',authMiddleware,patientDemographic)
patient.get('/demographic/:id',getPatientDemographic)

patient.post('/edit-request',authMiddleware,editRequest)


patient.post('/update-image',uploader.fields([{ name: 'profileImage', maxCount: 1 }
]),authMiddleware,updateImage)

patient.get('/appointment/:id',authMiddleware,getPatientAppointment)
patient.post('/location',authMiddleware,patientLocation)
patient.get('/lab-report/:id',authMiddleware,getLabReport)

patient.post('/favorite',authMiddleware,favoriteController)
patient.get('/favorite/:id',authMiddleware,getPatientFavorite)
patient.get('/favorite-data/:id',authMiddleware,getPatientFavoriteData)
patient.get('/my-rating/:id',authMiddleware,getMyRating)
patient.get('/prescriptions/:id',authMiddleware,getPatientPrescriptions)
patient.get('/appointment-test-detail/:id',authMiddleware,getPrescriptionLabDetail)
patient.post('/profile-action',authMiddleware,profileAction)


patient.post("/test-push", async (req, res) => {
  const { token } = req.body;

  if (!token) {
    return res.status(400).json({
      success: false,
      message: "FCM token required"
    });
  }

  try {
    await sendPush({
      token,
      title: "🔥 Test Notification",
      body: "Push notification successfully received!",
      data: {
        type: "test",
        time: Date.now().toString()
      }
    });

    res.json({
      success: true,
      message: "Push notification sent"
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: "Failed to send push"
    });
  }
});
export default patient
import { addPrescriptions, changePassword, deletePatient, deletePrescription, forgotEmail, getProfile, getProfileDetail, patientDemographic, patientKyc, patientMedicalHistory, resendOtp, signInPatient, signUpPatient, updatePatient, verifyOtp } from "../controller/Patient/authController.js"
import express from 'express'
import authMiddleware from "../middleware/authMiddleare.js"
import getUploader from "../config/multerConfig.js";
const patient=express.Router()
const uploader = getUploader('patient');


patient.post('',signUpPatient)
patient.get('',authMiddleware,getProfile)
patient.get('/detail/:id',authMiddleware,getProfileDetail)
patient.post('/signin',signInPatient)
patient.post('/forgot-email',forgotEmail)
patient.post('/resend-otp',resendOtp)
patient.post('/verify-otp',verifyOtp)

patient.post('/change-password',changePassword)
patient.put('',authMiddleware,updatePatient)
patient.delete('',authMiddleware,deletePatient)
patient.post('kyc',uploader.fields([{ name: 'frontImage', maxCount: 1 },
    { name: 'backImage', maxCount: 1 }
]),authMiddleware,patientKyc)
patient.post('prescription',authMiddleware,addPrescriptions)
patient.delete('prescription/:id/:itemId',authMiddleware,deletePrescription)
patient.post('medical-history',authMiddleware,patientMedicalHistory)
patient.post('demographic',authMiddleware,patientDemographic)



export default patient
import { addPrescriptions, changePassword, deletePatient, deletePrescription, editRequest, familyMedicalHistory, forgotEmail, getCustomProfile, getNameProfile, getPatientDemographic, getProfile, getProfileDetail, patientDemographic, patientKyc, patientMedicalHistory, resendOtp, signInPatient, signUpPatient, updateImage, updatePatient, verifyOtp } from "../controller/Patient/authController.js"
import express from 'express'
import authMiddleware from "../middleware/authMiddleare.js"
import getUploader from "../config/multerConfig.js";
import { getLabReport, getNearByDoctor, getPatientAppointment } from "../controller/appointmentController.js";
const patient=express.Router()
const uploader = getUploader('patient');


patient.post('',signUpPatient)
patient.get('/near-by-doctor',getNearByDoctor)
patient.get('',authMiddleware,getProfile)
patient.get('/detail/:id',authMiddleware,getProfileDetail)
patient.get('/:id',authMiddleware,getCustomProfile)
patient.get('/search/:name',authMiddleware,getNameProfile)

patient.post('/signin',signInPatient)
patient.post('/forgot-email',forgotEmail)
patient.post('/resend-otp',resendOtp)
patient.post('/verify-otp',verifyOtp)

patient.post('/change-password',changePassword)
patient.put('',authMiddleware,updatePatient)
patient.delete('',authMiddleware,deletePatient)
patient.post('/kyc',uploader.fields([{ name: 'frontImage', maxCount: 1 },
    { name: 'backImage', maxCount: 1 }
]),authMiddleware,patientKyc)
patient.post('/prescription', uploader.array('fileUrl'), authMiddleware, addPrescriptions);
patient.delete('/prescription/:id/:itemId',authMiddleware,deletePrescription)
patient.post('/medical-history',authMiddleware,patientMedicalHistory)
patient.post('/family-medical-history',authMiddleware,familyMedicalHistory)
patient.post('/demographic',authMiddleware,patientDemographic)
patient.get('/demographic/:id',authMiddleware,getPatientDemographic)

patient.post('/edit-request',authMiddleware,editRequest)


patient.post('/update-image',uploader.fields([{ name: 'profileImage', maxCount: 1 }
]),authMiddleware,updateImage)

patient.get('/appointment/:id',authMiddleware,getPatientAppointment)
patient.get('/lab-report/:id',authMiddleware,getLabReport)



export default patient
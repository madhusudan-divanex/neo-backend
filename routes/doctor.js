import {  changePassword, deleteDoctor,getCustomProfile,  forgotEmail, getProfile, getProfileDetail,  doctorKyc,  resendOtp, signInDoctor, signUpDoctor, updateDoctor, verifyOtp, doctorLicense, deleteLicense, doctorAbout, doctorEduWork, updateImage, editRequest, deleteEdu, deleteWork, getDoctorKyc, getDoctorEduWork, getDoctorLicense, getDoctorAbout, getDoctors, getDoctorData } from "../controller/Doctor/authController.js"
import express from 'express'
import authMiddleware from "../middleware/authMiddleare.js"
import getUploader from "../config/multerConfig.js";
import { doctorLabTest, getDoctorAppointment, getDoctorAppointmentData } from "../controller/appointmentController.js";
import { doctorDashboard, getDoctorPatientReport, getOccupiedSlots, getPatientHistory, getPatientPending } from "../controller/Doctor/doctorController.js";
const doctor=express.Router()
const uploader = getUploader('doctor');


doctor.post('',signUpDoctor)
doctor.get('/all-doctors',getDoctors)
doctor.get('',authMiddleware,getProfile)
doctor.get('/patient',authMiddleware,getPatientPending)
doctor.get('/detail/:id',authMiddleware,getProfileDetail)
doctor.get('/data/:id',getDoctorData)
doctor.get('/:id',authMiddleware,getCustomProfile)
doctor.post('/signin',signInDoctor)
doctor.post('/forgot-email',forgotEmail)
doctor.post('/resend-otp',resendOtp)
doctor.post('/verify-otp',verifyOtp)

doctor.post('/change-password',changePassword)
doctor.put('',authMiddleware,updateDoctor)
doctor.delete('',authMiddleware,deleteDoctor)
doctor.post('/kyc',uploader.fields([{ name: 'frontImage', maxCount: 1 },
    { name: 'backImage', maxCount: 1 }
]),authMiddleware,doctorKyc)
doctor.get('/kyc/:id',getDoctorKyc)
doctor.post('/education-work',authMiddleware,doctorEduWork)
doctor.get('/education-work/:id',authMiddleware,getDoctorEduWork)
doctor.delete('/education/:itemId/:id',authMiddleware,deleteEdu)
doctor.delete('/work/:itemId/:id',authMiddleware,deleteWork)

doctor.post('/medical-license',uploader.array('certFile' ),authMiddleware,doctorLicense)
doctor.get('/medical-license/:id',authMiddleware,getDoctorLicense)
doctor.delete('/medical-license/:id/:itemId',authMiddleware,deleteLicense)
doctor.post('/about',authMiddleware,doctorAbout)
doctor.get('/about/:id',authMiddleware,getDoctorAbout)
doctor.post('/edit-request',authMiddleware,editRequest)


doctor.post('/update-image',uploader.fields([{ name: 'profileImage', maxCount: 1 }
]),authMiddleware,updateImage)


doctor.get('/appointment/:id',authMiddleware,getDoctorAppointment)
doctor.get('/appointment-data/:id',authMiddleware,getDoctorAppointmentData)
doctor.get('/dashboard/:id',authMiddleware,doctorDashboard)
doctor.get('/patient-history/:id',authMiddleware,getPatientHistory)
doctor.get('/occupied-slots/:doctorId/:date',getOccupiedSlots)
doctor.get('/patient-lab-report/:doctorId/:patientId',getDoctorPatientReport)

export default doctor
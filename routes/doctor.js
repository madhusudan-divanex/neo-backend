import {  changePassword, deleteDoctor,getCustomProfile, getProfile, getProfileDetail,  doctorKyc,  resendOtp, signInDoctor, signUpDoctor, updateDoctor, verifyOtp, doctorLicense, deleteLicense, doctorAbout, doctorEduWork, updateImage, editRequest, deleteEdu, deleteWork, getDoctorKyc, getDoctorEduWork, getDoctorLicense, getDoctorAbout, getDoctors, getDoctorData, sendOtp, resetPassword, forgotPassword, doctorClinicData, getDoctorClinic } from "../controller/Doctor/authController.js"
import express from 'express'
import authMiddleware from "../middleware/authMiddleare.js"
import getUploader from "../config/multerConfig.js";
import { bookDoctorAppointment, doctorAptPayment, doctorAptVitals, doctorLabTest, getDoctorAppointment, getDoctorAppointmentData } from "../controller/appointmentController.js";
import {  addPatient, addTimeSlot,   deleteTimeSlot, doctorDashboard,   getDoctorPatientReport, getOccupiedSlots, getPatientHistory, getPatientPending, getTimeSlots,     sendReminder, updateDaySlot, updateTimeSlot,  } from "../controller/Doctor/doctorController.js";
import { checkPermission } from "../middleware/permissionCheck.js";
import { ChatList } from "../controller/Hospital/chatController.js";
const doctor=express.Router()
const uploader = getUploader('doctor');


doctor.post('',signUpDoctor)
doctor.get("/conversations", authMiddleware,checkPermission('doctor',"chat"), ChatList);
doctor.get('/all-doctors',getDoctors)
doctor.get('',authMiddleware,getProfile)
doctor.get('/patient',authMiddleware,getPatientPending)
doctor.get('/detail/:id',authMiddleware,getProfileDetail)
doctor.get('/data/:id',getDoctorData)
doctor.get('/:id',authMiddleware,getCustomProfile)
doctor.post('/signin',signInDoctor)
doctor.post('/forgot-password',forgotPassword)
doctor.post('/resend-otp',resendOtp)
doctor.post('/verify-otp',verifyOtp)
doctor.post('/send-otp',sendOtp)

doctor.post('/change-password',authMiddleware,changePassword)
doctor.post('/reset-password',authMiddleware,resetPassword)
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
doctor.post('/clinic',authMiddleware,uploader.fields([
    { name: 'clinicImage', maxCount: 1 },
    { name: 'licenseImage', maxCount: 1 }
  ]),doctorClinicData)
doctor.get('/clinic/:id',authMiddleware,getDoctorClinic)
doctor.post('/medical-license',authMiddleware,uploader.any(),doctorLicense)
doctor.get('/medical-license/:id',authMiddleware,getDoctorLicense)
doctor.delete('/medical-license/:id/:itemId',authMiddleware,deleteLicense)
doctor.post('/about',authMiddleware,doctorAbout)
doctor.get('/about/:id',authMiddleware,getDoctorAbout)
doctor.post('/edit-request',authMiddleware,editRequest)


doctor.post('/update-image',uploader.fields([{ name: 'profileImage', maxCount: 1 }
]),authMiddleware,updateImage)

doctor.post('/appointment',authMiddleware,checkPermission("doctors","addAppointment"),bookDoctorAppointment)
doctor.get('/appointment/:id',authMiddleware,getDoctorAppointment)
doctor.get('/appointment-data/:id',authMiddleware,getDoctorAppointmentData)
doctor.get('/dashboard/:id',authMiddleware,doctorDashboard)
doctor.get('/patient-history/:id',authMiddleware,getPatientHistory)
doctor.get('/occupied-slots/:doctorId/:date',getOccupiedSlots)
doctor.get('/patient-lab-report/:doctorId/:patientId',getDoctorPatientReport)
doctor.post('/send-reminder',authMiddleware,sendReminder)




doctor.post('/time-slot',authMiddleware,addTimeSlot)
doctor.get('/time-slot/:userId',getTimeSlots)
doctor.put('/time-slot',authMiddleware,updateTimeSlot)
doctor.put('/day-slot',authMiddleware,updateDaySlot)
doctor.delete('/time-slot/:slotId',authMiddleware,deleteTimeSlot)

doctor.post('/add-patient',authMiddleware,addPatient)
doctor.post('/appointment-payment',authMiddleware,checkPermission("doctors","appointmentPayment"),doctorAptPayment)
doctor.post('/add-patient-vitals',authMiddleware,checkPermission("doctors","appointmentVital"),doctorAptVitals)
export default doctor
import {  changePassword, deleteDoctor,getCustomProfile,  forgotEmail, getProfile, getProfileDetail,  doctorKyc,  resendOtp, signInDoctor, signUpDoctor, updateDoctor, verifyOtp, doctorLicense, deleteLicense, doctorAbout, doctorEduWork, updateImage, editRequest, deleteEdu, deleteWork } from "../controller/Doctor/authController.js"
import express from 'express'
import authMiddleware from "../middleware/authMiddleare.js"
import getUploader from "../config/multerConfig.js";
import { doctorLabTest, getDoctorAppointment } from "../controller/appointmentController.js";
const doctor=express.Router()
const uploader = getUploader('doctor');


doctor.post('',signUpDoctor)
doctor.get('',authMiddleware,getProfile)
doctor.get('/detail/:id',authMiddleware,getProfileDetail)
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
doctor.post('/education-work',authMiddleware,doctorEduWork)
doctor.delete('/education/:itemId/:id',authMiddleware,deleteEdu)
doctor.delete('/work/:itemId/:id',authMiddleware,deleteWork)

doctor.post('/medical-license',uploader.fields([{ name: 'certFile' }
]),authMiddleware,doctorLicense)
doctor.delete('/medical-license/:id/:itemId',authMiddleware,deleteLicense)
doctor.post('/about',authMiddleware,doctorAbout)
doctor.post('/edit-request',authMiddleware,editRequest)


doctor.post('/update-image',uploader.fields([{ name: 'profileImage', maxCount: 1 }
]),authMiddleware,updateImage)


doctor.get('/appointment/:id',authMiddleware,getDoctorAppointment)


export default doctor
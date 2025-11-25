import {  changePassword, deleteLab,  forgotEmail, getProfile, getProfileDetail, resendOtp, signInLab, signUpLab, updateLab, verifyOtp, labLicense,  labAddress,  updateImage, editRequest, labImage,  } from "../controller/Laboratory/authController.js"
import express from 'express'
import authMiddleware from "../middleware/authMiddleare.js"
import getUploader from "../config/multerConfig.js";
import {  getLabAppointment } from "../controller/appointmentController.js";
import { addLabPermission, deleteLabPermission, deleteStaffData, getAllPermission, labStaff, labStaffData, saveEmpAccess, saveEmpEmployement, saveEmpProfessional, saveLabStaff } from "../controller/Laboratory/laboratoryContoller.js";
const lab=express.Router()
const uploader = getUploader('lab');


lab.post('',signUpLab)
lab.get('',authMiddleware,getProfile)
lab.get('/detail/:id',authMiddleware,getProfileDetail)
lab.post('/signin',signInLab)
lab.post('/forgot-email',forgotEmail)
lab.post('/resend-otp',resendOtp)
lab.post('/verify-otp',verifyOtp)

lab.post('/change-password',changePassword)
lab.put('',authMiddleware,updateLab)
lab.delete('',authMiddleware,deleteLab)

lab.post('/license',uploader.fields([{ name: 'certFile' }
]),authMiddleware,labLicense)
lab.post('/about',authMiddleware,labAddress)
lab.post('/edit-request',authMiddleware,editRequest)


lab.post('/update-image',uploader.fields([{ name: 'logo', maxCount: 1 }
]),authMiddleware,updateImage)

lab.post('/image',authMiddleware,labImage)

lab.post('/permission',authMiddleware,addLabPermission)
lab.get('/permission/:id',authMiddleware,getAllPermission)
lab.delete('/permission/:id',authMiddleware,deleteLabPermission)


lab.get('/appointment/:id',authMiddleware,getLabAppointment)

lab.post('/staff',authMiddleware,saveLabStaff)
lab.post('/professional',authMiddleware,saveEmpProfessional)
lab.post('/employment',authMiddleware,saveEmpEmployement)
lab.post('/access',authMiddleware,saveEmpAccess)
lab.post('/staff/:id',authMiddleware,labStaff)
lab.post('/staff-data/:id',authMiddleware,labStaffData)

lab.delete('/staff/:id',authMiddleware,deleteStaffData)





export default lab
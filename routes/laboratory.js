import {  changePassword, deleteLab,  forgotEmail, getProfile, getProfileDetail, resendOtp, signInLab, signUpLab, updateLab, verifyOtp, labLicense,  labAddress,  updateImage, editRequest, labImage, labPerson, resetPassword,  } from "../controller/Laboratory/authController.js"
import express from 'express'
import authMiddleware from "../middleware/authMiddleare.js"
import getUploader from "../config/multerConfig.js";
import {  getLabAppointment } from "../controller/appointmentController.js";
import { addLabPermission, addTest, deleteLabPermission, deleteStaffData, deleteTest, getAllPermission, getTest, labStaff, labStaffData, saveEmpAccess, saveEmpEmployement, saveEmpProfessional, saveLabStaff, updateLabPermission } from "../controller/Laboratory/laboratoryContoller.js";
const lab=express.Router()
const uploader = getUploader('lab');


lab.post('',uploader.fields([{ name: 'logo' }]),signUpLab)
lab.get('/:id',getProfile)
lab.get('/detail/:id',authMiddleware,getProfileDetail)
lab.post('/signin',signInLab)
lab.post('/forgot-email',forgotEmail)
lab.post('/resend-otp',resendOtp)
lab.post('/verify-otp',verifyOtp)

lab.post('/change-password',authMiddleware,changePassword)
lab.post('/reset-password',authMiddleware,resetPassword)

lab.put('',authMiddleware,updateLab)
lab.delete('',authMiddleware,deleteLab)

lab.post(
    '/license',
    uploader.fields([
        { name: 'certFiles', maxCount: 20 },   // multiple certificates
        { name: 'licenseFile', maxCount: 1 }   // single license file
    ]),
    authMiddleware,
    labLicense
);

lab.post('/about',authMiddleware,labAddress)
lab.post('/person',uploader.fields([{ name: 'photo' }]),authMiddleware,labPerson)
lab.post('/edit-request',authMiddleware,editRequest)


lab.post('/update-image',uploader.fields([{ name: 'logo', maxCount: 1 }
]),authMiddleware,updateImage)

lab.post('/image',uploader.fields([{ name: 'thumbnail' },{ name: 'labImg' }]),authMiddleware,labImage)

lab.post('/permission',authMiddleware,addLabPermission)
lab.put('/permission',authMiddleware,updateLabPermission)
lab.get('/permission/:id',authMiddleware,getAllPermission)
lab.delete('/permission',authMiddleware,deleteLabPermission)


lab.get('/appointment/:id',authMiddleware,getLabAppointment)

lab.post('/staff',authMiddleware,saveLabStaff)
lab.post('/professional',authMiddleware,saveEmpProfessional)
lab.post('/employment',authMiddleware,saveEmpEmployement)
lab.post('/access',authMiddleware,saveEmpAccess)
lab.post('/staff/:id',authMiddleware,labStaff)
lab.post('/staff-data/:id',authMiddleware,labStaffData)
lab.delete('/staff/:id',authMiddleware,deleteStaffData)


lab.post('/test',authMiddleware,addTest)
lab.get('/test/:id',authMiddleware,getTest)
lab.delete('/test/:id',authMiddleware,deleteTest)



export default lab
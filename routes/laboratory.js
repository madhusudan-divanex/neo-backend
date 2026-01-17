import {  changePassword, deleteLab,  forgotEmail, getProfile, getProfileDetail, resendOtp, signInLab, signUpLab, updateLab, verifyOtp, labLicense,  labAddress,  updateImage, editRequest, labImage, labPerson, resetPassword, deleteLabImage, sendReport, getLabs, getLabDetail,  } from "../controller/Laboratory/authController.js"
import express from 'express'
import authMiddleware from "../middleware/authMiddleare.js"
import getUploader from "../config/multerConfig.js";
import {  getLabAppointment, getLabAppointmentData, getPatientLabReport, labDashboardData } from "../controller/appointmentController.js";
import { addLabPermission, addTest, deleteLabPermission, deleteStaffData, deleteSubEmpProffesional, deleteTest, getAllPermission, getTest, getTestData, getTestReport, labStaff, labStaffAction, labStaffData, labTestAction, saveEmpAccess, saveEmpEmployement, saveEmpProfessional, saveLabStaff, saveReport, updateLabPermission, updateTest } from "../controller/Laboratory/laboratoryContoller.js";
const lab=express.Router()
const uploader = getUploader('lab');


lab.post('',uploader.fields([{ name: 'logo' }]),signUpLab)
lab.get('',getLabs)
lab.get('/:id',getProfile)
lab.get('/detail/:id',authMiddleware,getProfileDetail)
lab.get('/data/:id',getLabDetail)
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
lab.get('/appointment-data/:id',authMiddleware,getLabAppointmentData)


lab.post('/staff',uploader.fields([{ name: 'profileImage' }]),authMiddleware,saveLabStaff)
lab.post('/professional',uploader.fields([{ name: 'certFile' }]),authMiddleware,saveEmpProfessional)
lab.post('/employment',authMiddleware,saveEmpEmployement)
lab.post('/sub-professional',authMiddleware,deleteSubEmpProffesional)

lab.post('/access',authMiddleware,saveEmpAccess)
lab.get('/staff/:id',authMiddleware,labStaff)
lab.post('/staff-action',authMiddleware,labStaffAction)
lab.get('/staff-data/:id',authMiddleware,labStaffData)
lab.delete('/staff/:id',authMiddleware,deleteStaffData)
lab.get('/dashboard/:id',authMiddleware,labDashboardData)



lab.post('/test',authMiddleware,addTest)
lab.put('/test',authMiddleware,updateTest)
lab.get('/test-data/:id',authMiddleware,getTestData)
lab.post('/test-report',authMiddleware,uploader.single('report'),saveReport)
lab.post('/test-report-data',authMiddleware,getTestReport)


lab.get('/test/:id',authMiddleware,getTest)
lab.delete('/test/:id',authMiddleware,deleteTest)
lab.post('/test-action',authMiddleware,labTestAction)
lab.post('/delete-image',authMiddleware,deleteLabImage)

lab.post('/send-report',authMiddleware,sendReport)


lab.get('/patient-lab-report/:labId/patientId',authMiddleware,getPatientLabReport)

export default lab
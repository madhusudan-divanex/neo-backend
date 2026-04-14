import {  changePassword, deleteLab,  getProfile, getProfileDetail, resendOtp, signInLab, signUpLab, updateLab, verifyOtp, labLicense,  labAddress,  updateImage, editRequest, labImage, labPerson, resetPassword, deleteLabImage, sendReport, getLabs, getLabDetail, forgotPassword,  } from "../controller/Laboratory/authController.js"
import express from 'express'
import authMiddleware from "../middleware/authMiddleare.js"
import getUploader from "../config/multerConfig.js";
import {  getLabAppointment, getLabAppointmentData, getPatientLabReport, labDashboardData } from "../controller/appointmentController.js";
import {  addPatient, addTest, collectSample,  deleteTest,  getLabInvoice, getTest, getTestData, getTestReport,  labTestAction,   saveLabInvoice,  saveReport,   updateTest } from "../controller/Laboratory/laboratoryContoller.js";
import { checkPermission } from "../middleware/permissionCheck.js";
import { updateDaySlot ,addTimeSlot, getTimeSlots} from "../controller/Doctor/doctorController.js";
import { ChatList } from "../controller/Hospital/chatController.js";
const lab=express.Router()
const uploader = getUploader('lab');

lab.get("/conversations", authMiddleware,checkPermission('lab',"chat"), ChatList);
lab.post('',uploader.fields([{ name: 'logo' }]),signUpLab)
lab.get('',getLabs)
lab.get('/:id',authMiddleware,getProfile)
lab.get('/detail/:id',authMiddleware,getProfileDetail)
lab.get('/data/:id',getLabDetail)
lab.post('/signin',signInLab)
lab.post('/forgot-password',forgotPassword)
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




lab.get('/appointment/:id',authMiddleware,getLabAppointment)
lab.get('/appointment-data/:id',authMiddleware,getLabAppointmentData)



lab.get('/dashboard/:id',authMiddleware,labDashboardData)



lab.post('/test',authMiddleware,checkPermission("lab","addTest"),addTest)
lab.put('/test',authMiddleware,checkPermission("lab","editTest"),updateTest)
lab.get('/test-data/:id',authMiddleware,getTestData)
lab.post('/test-report',authMiddleware,checkPermission("lab","addReport"),uploader.single('report'),saveReport)
lab.post('/test-report-data',authMiddleware,getTestReport)
lab.post('/test-sample',authMiddleware,checkPermission("lab","addReport"),collectSample)


lab.get('/test/:id',authMiddleware,getTest)
lab.delete('/test/:id',authMiddleware,deleteTest)
lab.post('/test-action',authMiddleware,labTestAction)
lab.post('/delete-image',authMiddleware,deleteLabImage)

lab.post('/send-report',authMiddleware,checkPermission("lab","sendReportMail"),sendReport)
lab.post('/add-patient',authMiddleware,addPatient)

lab.get('/patient-lab-report/:labId/:patientId',authMiddleware,getPatientLabReport)

lab.post('/time-slot',authMiddleware,addTimeSlot)
lab.get('/time-slot/:userId',getTimeSlots)
lab.put('/day-slot',authMiddleware,updateDaySlot)
lab.post('/payment',authMiddleware,checkPermission("lab","billing"),saveLabInvoice)
lab.get('/payment/:id',authMiddleware,getLabInvoice)


export default lab
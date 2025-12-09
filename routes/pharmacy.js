import {  changePassword, deletePhar,  forgotEmail, getProfile, getProfileDetail, resendOtp, signInPhar, signUpPhar, updatePhar, verifyOtp, pharLicense,  pharAddress,  updateImage, editRequest, pharImage, pharPerson, resetPassword, deletePharImage,   } from "../controller/Pharmacy/authController.js"
import express from 'express'
import authMiddleware from "../middleware/authMiddleare.js"
import getUploader from "../config/multerConfig.js";
import { addInventry, addSupplier, changeRequestStatus, completeReturn, createPO, createReturn, deletePO, deleteReturn, deleteSupplier, getAllMedicineRequestsForAdmin, getMedicineRequestsList, getPODetails, getPOList, getReturnById, getSupplier, getSupplierById, inventoryDelete, inventoryGetById, inventoryList, inventoryUpdate, listReturns, receivePO, sendMedicineRequest, updatePO, updateReturn, updateSupplier } from "../controller/Pharmacy/pharmacyController.js";
// import {   pharDashboardData } from "../controller/appointmentController.js";
// import { addPharPermission,  deletePharPermission,    getAllPermission,  } from "../controller/Pharmacy/PharoratoryContoller.js";
import { addLabPermission,  deleteLabPermission, deleteStaffData, deleteSubEmpProffesional,  getAllPermission,   labStaff, labStaffAction, labStaffData, labTestAction, saveEmpAccess, saveEmpEmployement, saveEmpProfessional, saveLabStaff, saveReport, updateLabPermission, updateTest } from "../controller/Laboratory/laboratoryContoller.js";

const pharmacy=express.Router()
const uploader = getUploader('phar');


pharmacy.post('',uploader.fields([{ name: 'logo' }]),signUpPhar)
pharmacy.get('/:id',authMiddleware,getProfile)
pharmacy.get('/detail/:id',authMiddleware,getProfileDetail)
pharmacy.post('/signin',signInPhar)
pharmacy.post('/forgot-email',forgotEmail)
pharmacy.post('/resend-otp',resendOtp)
pharmacy.post('/verify-otp',verifyOtp)

pharmacy.post('/change-password',authMiddleware,changePassword)
pharmacy.post('/reset-password',authMiddleware,resetPassword)

pharmacy.put('',authMiddleware,updatePhar)
pharmacy.delete('',authMiddleware,deletePhar)

pharmacy.post(
    '/license',
    uploader.fields([
        { name: 'certFiles', maxCount: 20 },   // multiple certificates
        { name: 'licenseFile', maxCount: 1 }   // single license file
    ]),
    authMiddleware,
    pharLicense
);

pharmacy.post('/about',authMiddleware,pharAddress)
pharmacy.post('/person',uploader.fields([{ name: 'photo' }]),authMiddleware,pharPerson)
pharmacy.post('/edit-request',authMiddleware,editRequest)


pharmacy.post('/update-image',uploader.fields([{ name: 'logo', maxCount: 1 }
]),authMiddleware,updateImage)

pharmacy.post('/image',uploader.fields([{ name: 'thumbnail' },{ name: 'PharImg' }]),authMiddleware,pharImage)

// pharmacy.post('/permission',authMiddleware,addPharPermission)
// pharmacy.put('/permission',authMiddleware,updatePharPermission)
// pharmacy.get('/permission/:id',authMiddleware,getAllPermission)
// pharmacy.delete('/permission',authMiddleware,deletePharPermission)


// pharmacy.get('/appointment/:id',authMiddleware,getPharAppointment)
// pharmacy.get('/appointment-data/:id',authMiddleware,getPharAppointmentData)


pharmacy.post('/staff',uploader.fields([{ name: 'profileImage' }]),authMiddleware,savePharStaff)
pharmacy.post('/professional',uploader.fields([{ name: 'certFile' }]),authMiddleware,saveEmpProfessional)
pharmacy.post('/employment',authMiddleware,saveEmpEmployement)
pharmacy.post('/sub-professional',authMiddleware,deleteSubEmpProffesional)

pharmacy.post('/access',authMiddleware,saveEmpAccess)
pharmacy.get('/staff/:id',authMiddleware,PharStaff)
pharmacy.post('/staff-action',authMiddleware,PharStaffAction)
pharmacy.get('/staff-data/:id',authMiddleware,PharStaffData)
pharmacy.delete('/staff/:id',authMiddleware,deleteStaffData)
pharmacy.get('/dashboard/:id',authMiddleware,pharDashboardData)

pharmacy.post('/delete-image',authMiddleware,deletePharImage)

pharmacy.post('/inventry', authMiddleware, addInventry);
pharmacy.get('/inventry', authMiddleware, inventoryList);
pharmacy.get('/inventry/:id', authMiddleware, inventoryGetById);
pharmacy.put('/inventry', authMiddleware, inventoryUpdate);
pharmacy.delete('/inventry/:id', authMiddleware, inventoryDelete);

pharmacy.post('/medicine-request/send', authMiddleware, sendMedicineRequest);
pharmacy.get('/medicine-request', authMiddleware, getMedicineRequestsList);
pharmacy.get('/medicine-request/all', authMiddleware, getAllMedicineRequestsForAdmin);
pharmacy.patch('/medicine-request/:id/status', authMiddleware, changeRequestStatus);

pharmacy.post("/supplier", authMiddleware, addSupplier);
pharmacy.get("/supplier", authMiddleware, getSupplier);
pharmacy.get("/supplier/:id", authMiddleware, getSupplierById);
pharmacy.put("/supplier/:id", authMiddleware, updateSupplier);
pharmacy.delete("/supplier/:id", authMiddleware, deleteSupplier);

pharmacy.post("/return", authMiddleware, createReturn);
pharmacy.get("/return", authMiddleware, listReturns);
pharmacy.get("/return/:id", authMiddleware, getReturnById);
pharmacy.post("/return/:id/complete", authMiddleware, completeReturn);
pharmacy.put("/return/:id", authMiddleware, updateReturn);
pharmacy.delete("/return/:id", authMiddleware, deleteReturn);

pharmacy.post("/purchase-order", authMiddleware, createPO);
pharmacy.get("/purchase-order", authMiddleware, getPOList);
pharmacy.get("/purchase-order/:id", authMiddleware, getPODetails);
pharmacy.get("/purchase-order/receive/:poId", authMiddleware, receivePO);
pharmacy.put("/purchase-order/:id", authMiddleware, updatePO);
pharmacy.delete("/purchase-order/:id", authMiddleware, deletePO);

export default pharmacy
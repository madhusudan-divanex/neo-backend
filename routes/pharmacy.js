import {  changePassword, deletePhar,  forgotEmail, getProfile, getProfileDetail, resendOtp, signInPhar, signUpPhar, updatePhar, verifyOtp, pharLicense,  pharAddress,  updateImage, editRequest, pharImage, pharPerson, resetPassword, deletePharImage, getPharmacy, getPharData,   } from "../controller/Pharmacy/authController.js"
import express from 'express'
import authMiddleware from "../middleware/authMiddleare.js"
import getUploader from "../config/multerConfig.js";
import { addInventry, addPharPermission, addSupplier,deleteStaffData, deleteSubEmpProffesional, changeRequestStatus, completeReturn, createPO, createReturn, deletePharPermission, deletePO, deleteReturn, deleteSupplier, saveEmpAccess, saveEmpEmployement,saveEmpProfessional,getAllMedicineRequestsForAdmin, getAllPharPermission, getMedicineRequestsList, getPODetails, getPOList, getReturnById, getSupplier, getSupplierById, inventoryDelete, inventoryGetById, inventoryList, inventoryUpdate, listReturns, pharStaff, pharStaffAction, pharStaffData, receivePO, savePharStaff, sendMedicineRequest, updatePharPermission, updatePO, updateReturn, updateSupplier, medicineData, pharDashboardData, sellMedicine, getSellMedicine, deleteSellData, getSellData, getPatientPrescriptionData } from "../controller/Pharmacy/pharmacyController.js";

const pharmacy=express.Router()
const uploader = getUploader('phar');


pharmacy.post('',uploader.fields([{ name: 'logo' }]),signUpPhar)
pharmacy.get('',getPharmacy)
pharmacy.get('/:id',authMiddleware,getProfile)
pharmacy.get('/detail/:id',authMiddleware,getProfileDetail)
pharmacy.get('/data/:id',getPharData)
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

pharmacy.post('/image',uploader.fields([{ name: 'thumbnail' },{ name: 'pharImg' }]),authMiddleware,pharImage)

pharmacy.post('/permission',authMiddleware,addPharPermission)
pharmacy.put('/permission',authMiddleware,updatePharPermission)
pharmacy.get('/permission/:id',authMiddleware,getAllPharPermission)
pharmacy.delete('/permission',authMiddleware,deletePharPermission)


// pharmacy.get('/appointment/:id',authMiddleware,getPharAppointment)
// pharmacy.get('/appointment-data/:id',authMiddleware,getPharAppointmentData)


pharmacy.post('/staff',uploader.fields([{ name: 'profileImage' }]),authMiddleware,savePharStaff)
pharmacy.post('/professional',uploader.fields([{ name: 'certFile' }]),authMiddleware,saveEmpProfessional)
pharmacy.post('/employment',authMiddleware,saveEmpEmployement)
pharmacy.post('/sub-professional',authMiddleware,deleteSubEmpProffesional)

pharmacy.post('/access',authMiddleware,saveEmpAccess)
pharmacy.get('/staff/:id',authMiddleware,pharStaff)
pharmacy.post('/staff-action',authMiddleware,pharStaffAction)
pharmacy.get('/staff-data/:id',authMiddleware,pharStaffData)
pharmacy.delete('/staff/:id',authMiddleware,deleteStaffData)
pharmacy.get('/dashboard/:id',authMiddleware,pharDashboardData)

pharmacy.post('/delete-image',authMiddleware,deletePharImage)

pharmacy.post('/inventory', authMiddleware, addInventry);
pharmacy.get('/inventory/:id', authMiddleware, inventoryList);
pharmacy.get('/inventory-data/:id', authMiddleware, inventoryGetById);
pharmacy.put('/inventory', authMiddleware, inventoryUpdate);
pharmacy.delete('/inventory/:id', authMiddleware, inventoryDelete);
pharmacy.get('/medicine-data/:name/:pharId', authMiddleware, medicineData);


pharmacy.post('/medicine-request', authMiddleware, sendMedicineRequest);
pharmacy.get('/medicine-request/:id', authMiddleware, getMedicineRequestsList);
pharmacy.get('/medicine-request/all', authMiddleware, getAllMedicineRequestsForAdmin);
pharmacy.patch('/medicine-request/:id/status', authMiddleware, changeRequestStatus);

pharmacy.post("/supplier", authMiddleware, addSupplier);
pharmacy.get("/supplier/:id", authMiddleware, getSupplier);
pharmacy.get("/supplier/:id", authMiddleware, getSupplierById);
pharmacy.put("/supplier", authMiddleware, updateSupplier);
pharmacy.delete("/supplier/:id", authMiddleware, deleteSupplier);

pharmacy.post("/return", authMiddleware, createReturn);
pharmacy.get("/return/:id", authMiddleware, listReturns);
pharmacy.get("/return-data/:id", authMiddleware, getReturnById);
pharmacy.post("/return/:id/complete", authMiddleware, completeReturn);
pharmacy.put("/return", authMiddleware, updateReturn);
pharmacy.delete("/return/:id", authMiddleware, deleteReturn);

pharmacy.post("/purchase-order", authMiddleware, createPO);
pharmacy.get("/purchase-order/:id", authMiddleware, getPOList);
pharmacy.get("/purchase-order/:id", authMiddleware, getPODetails);
pharmacy.get("/purchase-order/receive/:poId", authMiddleware, receivePO);
pharmacy.put("/purchase-order/:id", authMiddleware, updatePO);
pharmacy.delete("/purchase-order/:id", authMiddleware, deletePO);
pharmacy.post('/sell',uploader.fields([{ name: 'prescriptionFile' }]),authMiddleware,sellMedicine)
pharmacy.get('/sell/:id',authMiddleware,getSellMedicine)
pharmacy.get('/sell-data/:id',authMiddleware,getSellData)
pharmacy.delete('/sell/:id',authMiddleware,deleteSellData)

pharmacy.get('/patient-prescription/:id',authMiddleware,getPatientPrescriptionData)


export default pharmacy
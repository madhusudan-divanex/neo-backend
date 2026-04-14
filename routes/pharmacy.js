import {  changePassword, deletePhar, getProfile, getProfileDetail, resendOtp, signInPhar, signUpPhar, updatePhar, verifyOtp, pharLicense,  pharAddress,  updateImage, editRequest, pharImage, pharPerson, resetPassword, deletePharImage, getPharmacy, getPharData, forgotPassword,   } from "../controller/Pharmacy/authController.js"
import express from 'express'
import authMiddleware from "../middleware/authMiddleare.js"
import getUploader from "../config/multerConfig.js";
import { addInventry,  addSupplier, changeRequestStatus, completeReturn, createPO, createReturn,  deletePO, deleteReturn, deleteSupplier,  getAllMedicineRequestsForAdmin,  getMedicineRequestsList, getPODetails, getPOList, getReturnById, getSupplier, getSupplierById, inventoryDelete, inventoryGetById, inventoryList, inventoryUpdate, listReturns,    receivePO,  sendMedicineRequest,  updatePO, updateReturn, updateSupplier, medicineData, pharDashboardData, sellMedicine, getSellMedicine, deleteSellData, getSellData, getPatientPrescriptionData, addPatient, getPrescriptionMedicine, getAuditLog, getEODSale, customerReturn, getMySchedule } from "../controller/Pharmacy/pharmacyController.js";
import { checkPermission } from "../middleware/permissionCheck.js";
import { ChatList } from "../controller/Hospital/chatController.js";

const pharmacy=express.Router()
const uploader = getUploader('phar');

pharmacy.get('/audit-log',authMiddleware,getAuditLog)
pharmacy.get('/eod-sell',authMiddleware,getEODSale)
pharmacy.get("/conversations", authMiddleware,checkPermission('pharmacy',"chat"), ChatList);
pharmacy.post('',uploader.fields([{ name: 'logo' }]),signUpPhar)
pharmacy.get('',getPharmacy)
pharmacy.get('/:id',authMiddleware,getProfile)
pharmacy.get('/detail/:id',authMiddleware,getProfileDetail)
pharmacy.get('/data/:id',getPharData)
pharmacy.post('/signin',signInPhar)
pharmacy.post('/forgot-password',forgotPassword)
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




// pharmacy.get('/appointment/:id',authMiddleware,getPharAppointment)
// pharmacy.get('/appointment-data/:id',authMiddleware,getPharAppointmentData)



pharmacy.get('/dashboard/:id',authMiddleware,pharDashboardData)

pharmacy.post('/delete-image',authMiddleware,deletePharImage)

pharmacy.post('/inventory', authMiddleware,checkPermission("pharmacy","addInventory") ,addInventry);
pharmacy.get('/inventory/:id', authMiddleware, inventoryList);
pharmacy.get('/inventory-data/:id', authMiddleware , inventoryGetById);
pharmacy.put('/inventory', authMiddleware,checkPermission("pharmacy","editInventory") , inventoryUpdate);
pharmacy.delete('/inventory/:id', authMiddleware,checkPermission("pharmacy","deleteInventory"), inventoryDelete);
pharmacy.get('/medicine-data/:name/:pharId', authMiddleware, medicineData);


pharmacy.post('/medicine-request', authMiddleware, sendMedicineRequest);
pharmacy.get('/medicine-request/:id', authMiddleware, getMedicineRequestsList);
pharmacy.get('/medicine-request/all', authMiddleware, getAllMedicineRequestsForAdmin);
pharmacy.patch('/medicine-request/:id/status', authMiddleware, changeRequestStatus);

pharmacy.post("/supplier", authMiddleware,checkPermission('pharmacy',"addSupplier"), addSupplier);
pharmacy.get("/supplier/:id", authMiddleware, getSupplier);
pharmacy.get("/supplier/:id", authMiddleware, getSupplierById);
pharmacy.put("/supplier", authMiddleware,checkPermission('pharmacy',"editSupplier"), updateSupplier);
pharmacy.delete("/supplier/:id", authMiddleware,checkPermission('pharmacy',"deleteSupplier"), deleteSupplier);

pharmacy.post("/return", authMiddleware,checkPermission('pharmacy',"addReturn"), createReturn);
pharmacy.get("/return/:id", authMiddleware, listReturns);
pharmacy.get("/return-data/:id", authMiddleware, getReturnById);
pharmacy.post("/return/:id/complete", authMiddleware, completeReturn);
pharmacy.put("/return", authMiddleware, updateReturn);
pharmacy.delete("/return/:id", authMiddleware,checkPermission('pharmacy',"deleteReturn"), deleteReturn);

pharmacy.post("/purchase-order", authMiddleware, createPO);
pharmacy.get("/purchase-order/:id", authMiddleware, getPOList);
pharmacy.get("/purchase-order/:id", authMiddleware, getPODetails);
pharmacy.get("/purchase-order/receive/:poId", authMiddleware, receivePO);
pharmacy.put("/purchase-order/:id", authMiddleware, updatePO);
pharmacy.delete("/purchase-order/:id", authMiddleware, deletePO);
pharmacy.post('/sell',authMiddleware,checkPermission('pharmacy',"addSell"),uploader.fields([{ name: 'prescriptionFile' }]),sellMedicine)
pharmacy.get('/sell/:id',authMiddleware,getSellMedicine)
pharmacy.get('/sell-data/:id',authMiddleware,getSellData)
pharmacy.delete('/sell/:id',authMiddleware,deleteSellData)

pharmacy.get('/patient-prescription/:id',authMiddleware,getPatientPrescriptionData)
pharmacy.post('/add-patient',authMiddleware,addPatient)
pharmacy.post('/prescription-medicine',authMiddleware,getPrescriptionMedicine)
pharmacy.get('/my-schedule/:id',authMiddleware,getMySchedule)
pharmacy.post("/customer-return", authMiddleware,checkPermission('pharmacy',"addReturn"), customerReturn);

export default pharmacy
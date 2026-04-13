import express from "express";
import multer from "multer";

import auth from "../../middleware/auth.js";

import * as basic from "../../controller/Hospital/hospitalBasicController.js";
import * as images from "../../controller/Hospital/hospitalImageController.js";
import * as address from "../../controller/Hospital/hospitalAddressController.js";
import * as contact from "../../controller/Hospital/hospitalContactController.js";
import * as cert from "../../controller/Hospital/hospitalCertificateController.js";
import * as kyc from "../../controller/Hospital/kycController.js";
import * as profile from "../../controller/Hospital/profileController.js";
import authMiddleware from "../../middleware/authMiddleare.js";
import { addTest, deleteTest, getTest, getTestData, getTestReport, labTestAction, saveLabInvoice, saveReport, updateTest } from "../../controller/Laboratory/laboratoryContoller.js";
import getUploader from "../../config/multerConfig.js";
import { addInventry, addSupplier, completeReturn, createPO, createReturn, deletePO, deleteReturn, deleteSupplier, getPODetails, getPOList, getReturnById, getSupplier, getSupplierById, inventoryDelete, inventoryGetById, inventoryList, inventoryUpdate, listReturns, patientHospitalAllotment, receivePO, sellMedicine, updatePO, updateReturn, updateSupplier } from "../../controller/Pharmacy/pharmacyController.js";
import { actionLabAppointment, bookLabAppointment, doctorAptPayment, doctorAptVitals, getDoctorAppointmentData, getLabAppointment, paymentLabAppointment } from "../../controller/appointmentController.js";
import { checkPermission } from "../../middleware/permissionCheck.js";
import { ChatList } from "../../controller/Hospital/chatController.js";

const router = express.Router();
const upload = multer({ storage: multer.memoryStorage() });
const uploader = getUploader('hospital');

router.get("",  profile.getHospitals);
router.get("/list",  profile.getHospitalList);
router.get("/dashboard", auth, profile.hospitalDashboard);
router.get("/profile-data/:id",  profile.getHospitalProfile);
router.get("/profile-detail/:id",  profile.getProfileDetail);
router.get("/doctor/:id",  profile.getHospitalDoctorList);
// ================= PROFILE =================
router.get("/get-hospital-profile", auth, profile.getProfile);
router.put("/update-hospital-profile", auth, profile.updateProfile);
router.post("/edit-request", auth, profile.sendEditRequest);
router.post(
  "/edit-request/:requestId/approve",
  auth,
  profile.approveEditRequest
);

// ================= STEP 1 : BASIC =================
router.post("/basic", auth, upload.single("logo"), basic.saveBasic);

// ================= STEP 2 : IMAGES =================
router.post(
  "/images",
  upload.fields([
    { name: "thumbnail", maxCount: 1 },
    { name: "gallery", maxCount: 5 }
  ]),
  auth,
  images.uploadImages
);

// ================= STEP 3 : ADDRESS =================
router.post("/address", auth, address.saveAddress);

// ================= STEP 4 : CONTACT =================
router.post(
  "/contact",
  auth,
  upload.single("profilePhoto"),
  contact.saveContact
);

// ================= STEP 5 : CERTIFICATE =================
router.post(
  "/certificate",
  upload.single("file"),
  auth,
  cert.uploadCertificate
);

// ================= KYC =================
router.post("/submit-kyc", auth, kyc.submitKyc);
router.post("/change-password", auth, profile.changePassword);

// ================= LISTS =================
router.get("/patient-list", auth, basic.PatientList);
router.get("/doctor-list", auth, basic.DoctorList);
router.get("/staff-list", auth, basic.StaffList);
router.get("/patient-lab-report/:hospitalId/:patientId", auth, basic.getHospitalPatientReport);


// ================= PERMISSIon =================
router.post('/permission',auth,profile.addHospitalPermission)
router.put('/permission',auth,profile.updateHospitalPermission)
router.get('/permission/:id',auth,profile.getAllPermission)
router.delete('/permission',auth,profile.deleteHospitalPermission)



router.post('/test',authMiddleware,checkPermission("lab","addTest"),addTest)
router.put('/test',authMiddleware,checkPermission("lab","editTest"),updateTest)
router.get('/test-data/:id',authMiddleware,getTestData)
router.post('/test-report',authMiddleware,checkPermission("lab","addReport"),uploader.single('report'),saveReport)
router.post('/test-report-data',authMiddleware,getTestReport)
router.get('/test/:id',authMiddleware,getTest)
// router.delete('/test/:id',authMiddleware,checkPermission("lab","deleteTest"),deleteTest)
router.post('/test-action',authMiddleware,labTestAction)
router.put('/lab-action',authMiddleware,checkPermission("lab","appointmentStatus"),actionLabAppointment)
router.put('/lab/payment-action',authMiddleware,checkPermission("lab","paymentStatus"),paymentLabAppointment)

router.post('/inventory', authMiddleware,checkPermission("pharmacy","addInventory"),addInventry);
router.get('/inventory/:id', authMiddleware,checkPermission("pharmacy","listInventory"), inventoryList);
router.get('/inventory-data/:id', authMiddleware, inventoryGetById);
router.put('/inventory', authMiddleware,checkPermission("pharmacy","editInventory"),inventoryUpdate);
// router.delete('/inventory/:id', authMiddleware,checkPermission("pharmacy","deleteInventory"),inventoryDelete);

router.post("/supplier", authMiddleware, addSupplier);
router.get("/supplier/:id", authMiddleware, getSupplier);
router.get("/supplier/:id", authMiddleware, getSupplierById);
router.put("/supplier", authMiddleware, updateSupplier);
// router.delete("/supplier/:id", authMiddleware, deleteSupplier);

router.post("/return", authMiddleware,createReturn);
router.get("/return/:id", authMiddleware,listReturns);
router.get("/return-data/:id", authMiddleware, getReturnById);
router.post("/return/:id/complete", authMiddleware, completeReturn);
router.put("/return", authMiddleware, updateReturn);
// router.delete("/return/:id", authMiddleware, deleteReturn);

router.get("/patient-allotment/:patientId/:hospitalId", authMiddleware, patientHospitalAllotment);

router.get('/appointment-data/:id',authMiddleware,getDoctorAppointmentData)
router.get("/conversations", authMiddleware,checkPermission("chat","access"), ChatList);
router.post('/lab-appointment',authMiddleware,checkPermission("lab","addAppointment"),bookLabAppointment)
router.get('/lab-appointment/:id',authMiddleware,getLabAppointment)
router.post('/lab-payment',authMiddleware,saveLabInvoice)
router.get('/audit-log',authMiddleware,profile.getAuditLog)
router.post("/purchase-order", authMiddleware, createPO);
router.get("/purchase-order/:id", authMiddleware, getPOList);
router.get("/purchase-order/:id", authMiddleware, getPODetails);
router.get("/purchase-order/receive/:poId", authMiddleware, receivePO);
router.put("/purchase-order/:id", authMiddleware, updatePO);
router.delete("/purchase-order/:id", authMiddleware, deletePO);

router.post('/service',auth,profile.addHospitalService)
router.post('/doctor-appointment-payment',auth,checkPermission("billing","doctorPayment"),doctorAptPayment)
router.post('/add-patient-vitals',auth,doctorAptVitals)
router.post('/sell-medicine',authMiddleware,checkPermission('pharmacy',"sellMedicine"),uploader.fields([{ name: 'prescriptionFile' }]),sellMedicine)

export default router;

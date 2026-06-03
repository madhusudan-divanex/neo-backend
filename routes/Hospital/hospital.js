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
import { addSample, addTest, deleteTest, getTest, getTestData, getTestReport, labTestAction, saveLabInvoice, saveReport, updateTest } from "../../controller/Laboratory/laboratoryContoller.js";
import getUploader from "../../config/multerConfig.js";
import { addInventry, addSupplier, completeReturn, createPO, createReturn, customerReturn, deletePO, deleteReturn, deleteSupplier, getPODetails, getPOList, getReturnById, getSupplier, getSupplierById, inventoryDelete, inventoryGetById, inventoryList, inventoryUpdate, listReturns, patientHospitalAllotment, patientHospitalPrescriptions, receivePO, sellMedicine, updatePO, updateReturn, updateSupplier } from "../../controller/Pharmacy/pharmacyController.js";
import { actionLabAppointment, bookLabAppointment, doctorAptPayment, doctorAptVitals, getDoctorAppointmentData, getLabAppointment, paymentLabAppointment } from "../../controller/appointmentController.js";
import { checkPermission } from "../../middleware/permissionCheck.js";
import { ChatList } from "../../controller/Hospital/chatController.js";
import { sendReport } from "../../controller/Laboratory/authController.js";

const router = express.Router();
const upload = multer({ storage: multer.memoryStorage() });
const uploader = getUploader('hospital');

router.get("", profile.getHospitals);
router.get("/list", profile.getHospitalList);
router.get("/dashboard", auth, profile.hospitalDashboard);
router.get("/profile-data/:id", profile.getHospitalProfile);
router.get("/profile-detail/:id", profile.getProfileDetail);
router.get("/doctor/:id", profile.getHospitalDoctorList);
// ================= PROFILE =================
router.get("/get-hospital-profile", auth, profile.getProfile);
router.put("/update-hospital-profile", auth, checkPermission("hospital", "updateProfile"), profile.updateProfile);
router.post("/edit-request", auth, checkPermission("hospital", "updateProfile"), profile.sendEditRequest);
router.post(
  "/edit-request/:requestId/approve",
  auth,
  profile.approveEditRequest
);

// ================= STEP 1 : BASIC =================
router.post("/basic", auth, checkPermission("hospital", "updateProfile"), upload.single("logo"), basic.saveBasic);

// ================= STEP 2 : IMAGES =================
router.post(
  "/images",
  upload.fields([
    { name: "thumbnail", maxCount: 1 },
    { name: "gallery", maxCount: 5 }
  ]),
  auth, checkPermission("hospital", "updateProfile"),
  images.uploadImages
);

// ================= STEP 3 : ADDRESS =================
router.post("/address", auth, checkPermission("hospital", "updateProfile"), address.saveAddress);

// ================= STEP 4 : CONTACT =================
router.post(
  "/contact",
  auth, checkPermission("hospital", "updateProfile"),
  upload.single("profilePhoto"),
  contact.saveContact
);
router.delete("/image/:imageId", auth, images.deleteHospitalImage)

// ================= STEP 5 : CERTIFICATE =================
router.post(
  "/certificate", checkPermission("hospital", "updateProfile"),
  upload.single("file"),
  auth,
  cert.uploadCertificate
);
router.delete("/certificate/:fileId", auth, cert.deleteHospitalCertificate)

// ================= KYC =================
router.post("/submit-kyc", auth, checkPermission("hospital", "updateProfile"), kyc.submitKyc);
router.post("/change-password", auth, checkPermission("hospital", "updateProfile"), profile.changePassword);

// ================= LISTS =================
router.get("/patient-list", auth, basic.PatientList);
router.get("/doctor-list", auth, basic.DoctorList);
router.get("/staff-list", auth, basic.StaffList);
router.get("/patient-lab-report/:hospitalId/:patientId", auth, basic.getHospitalPatientReport);


// ================= PERMISSIon =================
router.post('/permission', auth, profile.addHospitalPermission)
router.put('/permission', auth, profile.updateHospitalPermission)
router.get('/permission/:id', auth, profile.getAllPermission)
router.delete('/permission', auth, profile.deleteHospitalPermission)



router.post('/test', authMiddleware, checkPermission("lab", "addTest"), addTest)
router.put('/test', authMiddleware, checkPermission("lab", "editTest"), updateTest)
router.get('/test-data/:id', authMiddleware, getTestData)
router.post('/test-report', authMiddleware, checkPermission("lab", "addReport"), uploader.single('report'), saveReport)
router.post('/test-report-data', authMiddleware, getTestReport)
router.get('/test/:id', authMiddleware, getTest)
// router.delete('/test/:id',authMiddleware,checkPermission("lab","deleteTest"),deleteTest)
router.post('/test-action', authMiddleware, labTestAction)
router.put('/lab-action', authMiddleware, checkPermission("lab", "appointmentStatus"), actionLabAppointment)
router.put('/lab/payment-action', authMiddleware, checkPermission("lab", "paymentStatus"), paymentLabAppointment)

router.post('/inventory', authMiddleware, checkPermission("pharmacy", "addInventory"), addInventry);
router.get('/inventory/:id', authMiddleware, checkPermission("pharmacy", "listInventory"), inventoryList);
router.get('/inventory-data/:id', authMiddleware, inventoryGetById);
router.put('/inventory', authMiddleware, checkPermission("pharmacy", "editInventory"), inventoryUpdate);
// router.delete('/inventory/:id', authMiddleware,checkPermission("pharmacy","deleteInventory"),inventoryDelete);

router.post("/supplier", authMiddleware, checkPermission("pharmacy", "addSupplier"), addSupplier);
router.get("/supplier/:id", authMiddleware, getSupplier);
router.get("/supplier/:id", authMiddleware, getSupplierById);
router.put("/supplier", authMiddleware, checkPermission("pharmacy", "editSupplier"), updateSupplier);
// router.delete("/supplier/:id", authMiddleware, deleteSupplier);

router.post("/return", authMiddleware, checkPermission('pharmacy', "addReturn"), createReturn);
router.get("/return/:id", authMiddleware, listReturns);
router.get("/return-data/:id", authMiddleware, getReturnById);
router.post("/return/:id/complete", authMiddleware, completeReturn);
router.put("/return", authMiddleware, checkPermission('pharmacy', "editReturn"), updateReturn);
// router.delete("/return/:id", authMiddleware, deleteReturn);

router.get("/patient-allotment/:patientId/:hospitalId", authMiddleware, patientHospitalAllotment);
router.get("/patient-prescriptions/:patientId/:hospitalId", authMiddleware, patientHospitalPrescriptions);
router.get('/appointment-data/:id', authMiddleware, getDoctorAppointmentData)
router.get("/conversations", authMiddleware, checkPermission("chat", "access"), ChatList);
router.post('/lab-appointment', authMiddleware, checkPermission("lab", "addAppointment"), bookLabAppointment)
router.get('/lab-appointment/:id', authMiddleware, getLabAppointment)
router.post('/lab-payment', authMiddleware, checkPermission("billing", "labPayment"), saveLabInvoice)
router.post("/purchase-order", authMiddleware, checkPermission("pharmacy", "purchaseOrder"), createPO);
router.get("/purchase-order/:id", authMiddleware, getPOList);
router.get("/purchase-order/:id", authMiddleware, getPODetails);
router.get("/purchase-order/receive/:poId", authMiddleware, receivePO);
router.put("/purchase-order/:id", authMiddleware, checkPermission("pharmacy", "editPurchaseOrder"), updatePO);
router.delete("/purchase-order/:id", authMiddleware, deletePO);

router.post('/service', auth, profile.addHospitalService)
router.post('/doctor-appointment-payment', auth, checkPermission("billing", "doctorPayment"), doctorAptPayment)
router.post('/add-patient-vitals', auth, doctorAptVitals)
router.post('/sell-medicine', authMiddleware, checkPermission('pharmacy', "sellMedicine"), uploader.fields([{ name: 'prescriptionFile' }]), sellMedicine)
router.post('/customer-return', authMiddleware, checkPermission('pharmacy', "customerReturn"), customerReturn)


router.get('/department/:id', auth, profile.getHospitalDepartments)
router.get('/ipd-patient', auth, profile.IpdPatientsList)
router.get('/transfer-data/:id', profile.getPatientTransferLetter)
router.get('/staff-all/:id', auth, profile.getHospitalAllStaff)
router.post('/send-report', authMiddleware, sendReport)
router.get('/check-patient-ipd/:id', auth, profile.getIsInIpd)

router.post('/lab/sample', auth, checkPermission("lab", "collectSample"), addSample)
router.post('/lab/test-report-data', auth, getTestReport)
export default router;

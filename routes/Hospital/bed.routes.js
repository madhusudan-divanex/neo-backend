import express from "express";
import auth from "../../middleware/auth.js";

// ===== FLOOR =====
import {
  addFloor,
  listFloors,
  getFloorById,
  updateFloor,
  deleteFloor
} from "../../controller/Hospital/Bed/floor.controller.js";

// ===== ROOM =====
import {
  addRoom,
  getRoomById,
  updateRoom,
  listRoomsByFloor
} from "../../controller/Hospital/Bed/room.controller.js";

// ===== BED =====
import {
  addBed,
  getBedById,
  updateBed,
  deleteBed,
  getAllotmentHistory,
  addOrUpdateHospitalPayment,
  getAllotmentPayment,
  getDischargePatient,
  addOrUpdateDischargePatient,
  allotmentPrescription,
  getAllotmentPrescriptiondata,
  editAllotmentPrescription,
  prescriptionAction,
  deleteAllotmentPrescription,
  getTestReportForBedPatient,
  addTestForBedPatient,
  getHospitalBed,
  departmentTransfer,
  getDepartmentTransfer,
  getDischargeScan
} from "../../controller/Hospital/Bed/bed.controller.js";

// ===== BED MANAGEMENT =====
import { bedManagementList } from "../../controller/Hospital/Bed/bedManagement.controller.js";


// ===== BED ALLOTMENT =====
import {
  addAllotment,
  dischargePatient,
  getAllotmentById,
  updateAllotment
} from "../../controller/Hospital/Bed/bedAllotment.controller.js";
import authMiddleware from "../../middleware/authMiddleare.js";
import { checkPermission } from "../../middleware/permissionCheck.js";
import { createTransfer } from "../../controller/Hospital/profileController.js";

const router = express.Router();

// ---------- FLOOR ----------
router.post("/floor/add", auth, addFloor);
router.get("/floor/list", auth, listFloors);
router.get("/floor/:id", auth, getFloorById);
router.put("/floor/update/:id", auth, updateFloor);
// router.delete("/floor/:id", auth, deleteFloor);

// ---------- ROOM ----------
router.post("/room/add", auth, addRoom);
router.get("/room/single/:id", auth, getRoomById);
router.put("/room/update/:id", auth, updateRoom);
router.get("/room/:floorId", auth, listRoomsByFloor);

// ---------- BED ----------
router.post("/bed/add", auth,checkPermission("beds","add"), addBed);
router.get("/bed/single/:id", auth, getBedById);
router.put("/bed/update/:id", auth,checkPermission("beds","add"), updateBed);
// router.delete("/bed/:id", auth,checkPermission("beds","delete"), deleteBed);

// ---------- ALLOTMENT ----------
router.post("/allotment/add", auth,checkPermission("beds","addAllotment"), addAllotment);
router.put("/allotment/discharge/:allotmentId", auth, dischargePatient);
router.get("/allotment/:id", auth, getAllotmentById);
router.put("/allotment/update/:id", auth,checkPermission("beds","editAllotment"), updateAllotment);

// ---------- MANAGEMENT ----------
router.get("/management/list", auth, bedManagementList);
router.get("/allotment/history/:id",authMiddleware,getAllotmentHistory)
router.post("/allotment/payment",authMiddleware,checkPermission("billing","allotmentPayment"),addOrUpdateHospitalPayment)
router.get("/allotment-payment/:id",authMiddleware,getAllotmentPayment)

// router.post("/discharge-patient",authMiddleware,checkPermission("beds","dischargePatient"),addOrUpdateDischargePatient)
router.post("/discharge-patient",authMiddleware,checkPermission("beds","dischargePatient"),addOrUpdateDischargePatient)
router.get("/discharge-patient/:id",authMiddleware,getDischargePatient)
router.get("/discharge-scan/:id",getDischargeScan)

router.post('/prescription',authMiddleware,allotmentPrescription)
router.get('/prescription-data/:id',authMiddleware,getAllotmentPrescriptiondata)
router.put('/prescription',authMiddleware,editAllotmentPrescription)
router.post('/prescription-action',authMiddleware,prescriptionAction)
router.delete('/prescription/:id',authMiddleware,deleteAllotmentPrescription)

router.post('/add-tests',authMiddleware,addTestForBedPatient)
router.get('/test-reports/:appointmentId',authMiddleware,getTestReportForBedPatient)
router.get("/hospital", auth, getHospitalBed);
router.post("/department-transfer", auth, departmentTransfer);
router.get("/department-transfer/:id", auth, getDepartmentTransfer);
router.post("/hospital-transfer", auth, createTransfer);
export default router;

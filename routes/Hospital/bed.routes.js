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
  getAllotmentPayment
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

const router = express.Router();

// ---------- FLOOR ----------
router.post("/floor/add", auth, addFloor);
router.get("/floor/list", auth, listFloors);
router.get("/floor/:id", auth, getFloorById);
router.put("/floor/update/:id", auth, updateFloor);
router.delete("/floor/:id", auth, deleteFloor);

// ---------- ROOM ----------
router.post("/room/add", auth, addRoom);
router.get("/room/single/:id", auth, getRoomById);
router.put("/room/update/:id", auth, updateRoom);
router.get("/room/:floorId", auth, listRoomsByFloor);

// ---------- BED ----------
router.post("/bed/add", auth, addBed);
router.get("/bed/single/:id", auth, getBedById);
router.put("/bed/update/:id", auth, updateBed);
router.delete("/bed/:id", auth, deleteBed);

// ---------- ALLOTMENT ----------
router.post("/allotment/add", auth, addAllotment);
router.put("/allotment/discharge/:allotmentId", auth, dischargePatient);
router.get("/allotment/:id", auth, getAllotmentById);
router.put("/allotment/update/:id", auth, updateAllotment);

// ---------- MANAGEMENT ----------
router.get("/management/list", auth, bedManagementList);
router.get("/allotment/history/:id",authMiddleware,getAllotmentHistory)
router.post("/allotment/payment",authMiddleware,addOrUpdateHospitalPayment)
router.get("/allotment-payment/:id",authMiddleware,getAllotmentPayment)
export default router;

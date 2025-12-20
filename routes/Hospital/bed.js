import express from 'express'
const bed = express.Router();
import auth from "../../middleware/auth.js";

import floorCtrl from "../../controller/Hospital/Bed/floor.controller.js";
import roomCtrl from "../../controller/Hospital/Bed/room.controller.js";
import bedCtrl from "../../controller/Hospital/Bed/bed.controller.js";
import bedMgmtCtrl from "../../controller/Hospital/Bed/bedManagement.controller.js";
import bedAllotmentCtrl from "../../controller/Hospital/Bed/bedAllotment.controller.js";

bed.post("/floor/add", auth, floorCtrl.addFloor);
bed.get("/floor/list", auth, floorCtrl.listFloors);
bed.get("/floor/:id", auth, floorCtrl.getFloorById);
bed.put("/floor/update/:id", auth, floorCtrl.updateFloor);
bed.delete("/floor/:id", auth, floorCtrl.deleteFloor);
bed.post("/room/add", auth, roomCtrl.addRoom);
bed.get("/room/single/:id", auth, roomCtrl.getRoomById);
bed.put("/room/update/:id", auth, roomCtrl.updateRoom);
bed.get("/room/:floorId", auth, roomCtrl.listRoomsByFloor);
bed.post("/bed/add", auth, bedCtrl.addBed);
bed.get("/bed/single/:id", auth, bedCtrl.getBedById);
bed.put("/bed/update/:id", auth, bedCtrl.updateBed);
bed.delete("/bed/:id", auth, bedCtrl.deleteBed);
bed.post("/allotment/add", auth, bedAllotmentCtrl.addAllotment);
bed.put("/allotment/discharge/:allotmentId", auth, bedAllotmentCtrl.dischargePatient);
bed.get("/allotment/:id", auth, bedAllotmentCtrl.getAllotmentById);
bed.put("/allotment/update/:id", auth, bedAllotmentCtrl.updateAllotment);
bed.get("/management/list", auth, bedMgmtCtrl.bedManagementList);

export default bed;

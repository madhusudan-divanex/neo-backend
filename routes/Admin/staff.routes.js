import express from "express";
import adminAuth from "../../middleware/adminAuth.js";
import { getStaffData, getStaffEmp, getStaffs } from "../../controller/Admin/staff.controller.js";

const router = express.Router();

router.get("/", adminAuth, getStaffs);
router.get('/data/:id', adminAuth, getStaffData)
router.get('/employement/:id', adminAuth, getStaffEmp)
export default router;

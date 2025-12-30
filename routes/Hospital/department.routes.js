import express from "express";

import auth from "../../middleware/auth.js";

// Controllers
import {
  createDepartment,
  getDepartments,
  getDepartmentById,
  updateDepartment,
  deleteDepartment
} from "../../controller/Hospital/hospitalDepartmentController.js";

const router = express.Router();

// ===============================
// Department Routes
// ===============================

// Create Department
router.post("/", auth, createDepartment);

// Get All Departments (List / Table)
router.get("/", auth, getDepartments);

// Get Single Department (Edit Modal)
router.get("/:id", auth, getDepartmentById);

// Update Department
router.put("/:id", auth, updateDepartment);

// Delete Department
router.delete("/:id", auth, deleteDepartment);

export default router;

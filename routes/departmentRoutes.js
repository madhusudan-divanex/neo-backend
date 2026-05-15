import express from "express"
import authMiddleware from "../middleware/authMiddleare.js"
import { createDepartment, getDepartment, updateDepartment } from "../controller/departmentController.js"

const department=express.Router()

department.post('/create',authMiddleware,createDepartment)
department.get('/list',authMiddleware,getDepartment)
department.put('/update',authMiddleware,updateDepartment)

export default department
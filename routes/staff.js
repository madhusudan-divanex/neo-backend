import express from 'express'
import authMiddleware from '../middleware/authMiddleare.js'
import { createStaffEmployement, createStaffProffessional, createStaffProfile, getStaffById, getStaffByNHId, getStaffList, staffAction, staffLogin, updateStaffEmployement, verifyOtp } from '../controller/staffController.js'
import getUploader from '../config/multerConfig.js'
const staff=express.Router()
const uploader=getUploader('staff')

staff.post('/profile',authMiddleware,uploader.fields([
    { name: "profileImage", maxCount: 1 },
  ]),createStaffProfile)
staff.post('/professional',authMiddleware,uploader.fields([
    { name: "certificates", maxCount: 5 }
  ]),createStaffProffessional)
staff.get('/list',authMiddleware,getStaffList)
staff.get('/data/:id',authMiddleware,getStaffById)
staff.get('/:id',authMiddleware,getStaffByNHId)
staff.post('/status',authMiddleware,staffAction)
staff.post('/login',staffLogin)
staff.post('/verify-otp',verifyOtp)
staff.post('/employment',authMiddleware,createStaffEmployement)
staff.put('/employment',authMiddleware,updateStaffEmployement)

export default staff

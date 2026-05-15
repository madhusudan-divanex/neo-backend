import express from 'express'
import authMiddleware from '../middleware/authMiddleare.js'
import { getHospitalDoctor, getLabAptData, getPatientDashboard, getScanUserData, saveFrotnendQuery } from '../controller/optimizeController.js'

const optimizeApi=express.Router()

optimizeApi.get('/patient-dashboard',authMiddleware,getPatientDashboard)
optimizeApi.get('/patient-lab-apt-data/:id',authMiddleware,getLabAptData)
optimizeApi.get('/hospital-doctor',authMiddleware,getHospitalDoctor)
optimizeApi.post('/contact-query',saveFrotnendQuery)
optimizeApi.get('/user/:id',getScanUserData)
export default optimizeApi
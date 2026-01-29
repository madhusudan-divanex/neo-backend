import express from 'express'
import authMiddleware from '../middleware/authMiddleare.js'
import { addPatientBanner, addSpecialty, addTestCategory, deletePatientBanner, deleteSpecialty, deleteTestCategory, getPatientBanner, getSpecialty, getTestCategory, updatePatientBanner, updateSpecialty, updateTestCategory } from '../controller/Admin/adminController.js'
import getUploader from '../config/multerConfig.js'

const admin=express.Router()
const uploader=getUploader('admin')

admin.post('/speciality',authMiddleware,uploader.single('icon'),addSpecialty)
admin.put('/speciality',authMiddleware,uploader.single('icon'),updateSpecialty)
admin.get('/speciality',getSpecialty)
admin.delete('/speciality/:id',authMiddleware,deleteSpecialty)

admin.post('/test-category',authMiddleware,uploader.single('icon'),addTestCategory)
admin.put('/test-category',authMiddleware,uploader.single('icon'),updateTestCategory)
admin.get('/test-category',getTestCategory)
admin.delete('/test-category/:id',authMiddleware,deleteTestCategory)


admin.post('/patient-banner',authMiddleware,uploader.single('image'),addPatientBanner)
admin.put('/patient-banner',authMiddleware,uploader.single('image'),updatePatientBanner)
admin.get('/patient-banner',getPatientBanner)
admin.delete('/patient-banner/:id',authMiddleware,deletePatientBanner)

export default admin
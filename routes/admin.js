import express from 'express'
import { addDoctorByAdmin, addHospitalByAdmin, addHospitalCategory, addLabByAdmin, addPatientBanner, addPatientByAdmin, addPharmacyByAdmin, addPharmacyCategory, addScheduleMedicines, addSpecialty, addSubTestCategory, addTestCategory,  deleteContactQuery,  deleteHospitalCategory,  deletePatientBanner, deletePharmacyCategory, deleteSpecialty, deleteTestCategory, generateCard, getCmsData, getContactQuery, getHospitalCategory, getPatientBanner, getPharmacyCategory, getScheduleMedicines, getServices, getSpecialty, getSubTestCategory, getTestCategory, getUsers, updateHospitalCategory, updatePatientBanner, updatePharmacyCategory, updateScheduleMedicines, updateSpecialty, updateSubTestCategory, updateTestCategory } from '../controller/Admin/adminController.js'
import getUploader from '../config/multerConfig.js'
import { getAdminDashboard } from '../controller/Admin/dashboard.controller.js'
import adminAuth from '../middleware/adminAuth.js'

const admin=express.Router()
const uploader=getUploader('admin')

admin.post('/speciality',adminAuth,uploader.single('icon'),addSpecialty)
admin.put('/speciality',adminAuth,uploader.single('icon'),updateSpecialty)
admin.get('/speciality',getSpecialty)
admin.get('/services',getServices)
admin.delete('/speciality/:id',adminAuth,deleteSpecialty)

admin.post('/test-category',adminAuth,uploader.single('icon'),addTestCategory)
admin.put('/test-category',adminAuth,uploader.single('icon'),updateTestCategory)
admin.get('/test-category',getTestCategory)
admin.delete('/test-category/:id',adminAuth,deleteTestCategory)

admin.post('/patient-banner',adminAuth,uploader.single('image'),addPatientBanner)
admin.put('/patient-banner',adminAuth,uploader.single('image'),updatePatientBanner)
admin.get('/patient-banner',getPatientBanner)
admin.delete('/patient-banner/:id',adminAuth,deletePatientBanner)

admin.post('/hospital-category',adminAuth,uploader.single('icon'),addHospitalCategory)
admin.put('/hospital-category',adminAuth,uploader.single('icon'),updateHospitalCategory)
admin.get('/hospital-category',getHospitalCategory)
admin.delete('/hospital-category/:id',adminAuth,deleteHospitalCategory)

admin.post('/pharmacy-category',adminAuth,uploader.single('icon'),addPharmacyCategory)
admin.put('/pharmacy-category',adminAuth,uploader.single('icon'),updatePharmacyCategory)
admin.get('/pharmacy-category',getPharmacyCategory)
admin.delete('/pharmacy-category/:id',adminAuth,deletePharmacyCategory)

admin.get('/cms',getCmsData)
admin.post('/add-patient',adminAuth,addPatientByAdmin)
admin.post('/add-doctor',adminAuth,addDoctorByAdmin)
admin.post('/add-pharmacy',adminAuth,addPharmacyByAdmin)
admin.post('/add-laboratory',adminAuth,addLabByAdmin)
admin.post('/add-hospital',adminAuth,addHospitalByAdmin)
admin.get('/dashboard', adminAuth, getAdminDashboard)

admin.post('/schedule-medicines',adminAuth,addScheduleMedicines)
admin.put('/schedule-medicines',adminAuth,updateScheduleMedicines)
admin.get('/schedule-medicines',getScheduleMedicines)
admin.get('/contact-query',adminAuth,getContactQuery)
admin.delete('/contact-query/:id',adminAuth,deleteContactQuery)

admin.post('/generate-card',adminAuth,generateCard)
admin.get('/users',adminAuth,getUsers)

admin.get('/sub-test-category',getSubTestCategory)
admin.post('/sub-test-category',adminAuth,addSubTestCategory)
admin.put('/sub-test-category',adminAuth,updateSubTestCategory)
export default admin
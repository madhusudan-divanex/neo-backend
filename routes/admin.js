import express from 'express'
import authMiddleware from '../middleware/authMiddleare.js'
import { addSpecialty, deleteSpecialty, getSpecialty, updateSpecialty } from '../controller/Admin/adminController.js'
import getUploader from '../config/multerConfig.js'

const admin=express.Router()
const uploader=getUploader('admin')

admin.post('/speciality',authMiddleware,uploader.single('icon'),addSpecialty)
admin.put('/speciality',authMiddleware,uploader.single('icon'),updateSpecialty)
admin.get('/speciality',getSpecialty)
admin.delete('/speciality/:id',authMiddleware,deleteSpecialty)


export default admin
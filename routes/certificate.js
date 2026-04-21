import express from 'express'
import authMiddleware from '../middleware/authMiddleare.js'
import { createBirthCertificate, createDeathCertificate, createFitnessCertificate, createMedicalCertificate, getAllBirthCertificates, getAllDeathCertificates, getAllFitnessCertificates, getAllMedicalCertificates, getFitnessCertificatesData, getMedicalCertificatesData } from '../controller/certificateController.js'

const certificate=express.Router()
certificate.post("/fitness",authMiddleware,createFitnessCertificate)
certificate.post("/medical",authMiddleware,createMedicalCertificate)
certificate.post("/birth",authMiddleware,createBirthCertificate)
certificate.post("/death",authMiddleware,createDeathCertificate)
certificate.get("/fitness",authMiddleware,getAllFitnessCertificates)
certificate.get("/fitness-data/:id",getFitnessCertificatesData)
certificate.get("/medical",authMiddleware,getAllMedicalCertificates)
certificate.get("/medical-data/:id",getMedicalCertificatesData)
certificate.get("/birth",authMiddleware,getAllBirthCertificates)
certificate.get("/death",authMiddleware,getAllDeathCertificates)

export default certificate
import express from 'express'
import authMiddleware from '../middleware/authMiddleare.js'
import { actionDoctorAppointment, actionLabAppointment, bookDoctorAppointment, bookLabAppointment, cancelDoctorAppointment, cancelLabAppointment, deleteDoctorPrescription, doctorLabTest, doctorPrescription, editDoctorPrescription, getDoctorAppointment, getDoctorPastAppointment, getDoctorPrescriptiondata, getHospitalAppointment, getHospitalPastAppointment, getLabAppointment, getPastPatientLabAppointment, getPatientAppointment, getPatientLabAppointment, giveRating, prescriptionAction, updateDoctorAppointment } from '../controller/appointmentController.js'
import { get } from 'mongoose'

const appointment=express.Router()
appointment.post('/doctor',authMiddleware,bookDoctorAppointment)
appointment.get('/doctor/:id',authMiddleware,getDoctorAppointment)
appointment.put('/doctor-action',authMiddleware,actionDoctorAppointment)
appointment.post('/doctor-cancel',authMiddleware,cancelDoctorAppointment)
appointment.put('/doctor',authMiddleware,updateDoctorAppointment)

appointment.post('/prescription',authMiddleware,doctorPrescription)
appointment.get('/prescription-data/:id',authMiddleware,getDoctorPrescriptiondata)
appointment.put('/prescription',authMiddleware,editDoctorPrescription)
appointment.post('/prescription-action',authMiddleware,prescriptionAction)
appointment.delete('/prescription/:id',authMiddleware,deleteDoctorPrescription)
appointment.post('/lab-test',authMiddleware,doctorLabTest)
appointment.post('/rating',authMiddleware,giveRating)
appointment.get('/patient/:id',authMiddleware,getPatientAppointment)
appointment.get('/patient-lab/:id',authMiddleware,getPatientLabAppointment)

appointment.post('/lab',authMiddleware,bookLabAppointment)
appointment.get('/lab/:id',authMiddleware,getLabAppointment)
appointment.put('/lab-action',authMiddleware,actionLabAppointment)
appointment.post('/lab-cancel',authMiddleware,cancelLabAppointment)

appointment.get('/doctor/past-appointments/:doctorId/:patientId',authMiddleware,getDoctorPastAppointment)
appointment.get('/hospital/past-appointments/:hospitalId/:patientId',authMiddleware,getHospitalPastAppointment)
appointment.get('/hospital/:id',authMiddleware,getHospitalAppointment)
appointment.get('/lab/past-appointments/:labId/:patientId',authMiddleware,getPastPatientLabAppointment)
export default appointment
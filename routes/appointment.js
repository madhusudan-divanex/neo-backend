import express from 'express'
import authMiddleware from '../middleware/authMiddleare.js'
import { actionDoctorAppointment, actionLabAppointment, bookDoctorAppointment, bookLabAppointment, cancelDoctorAppointment, cancelLabAppointment, deleteDoctorPrescription, doctorLabTest, doctorPrescription, editDoctorPrescription, getDoctorAppointment, getDoctorPastAppointment, getDoctorPrescriptiondata, getHospitalAppointment, getHospitalDoctorAppointment, getHospitalPastAppointment, getLabAppointment, getPastPatientLabAppointment, getPatientAppointment, getPatientLabAppointment, giveRating, paymentLabAppointment, prescriptionAction, updateDoctorAppointment } from '../controller/appointmentController.js'
import { get } from 'mongoose'
import { checkPermission } from '../middleware/permissionCheck.js'

const appointment=express.Router()
appointment.post('/doctor',authMiddleware,bookDoctorAppointment)
appointment.get('/doctor/:id',authMiddleware,getDoctorAppointment)
appointment.put('/doctor-action',authMiddleware,checkPermission("doctor","appointmentStatus"),actionDoctorAppointment)
appointment.post('/doctor-cancel',authMiddleware,cancelDoctorAppointment)
appointment.put('/doctor',authMiddleware,updateDoctorAppointment)

appointment.post('/prescription',authMiddleware,checkPermission("doctor","addPrescription"),doctorPrescription)
appointment.get('/prescription-data/:id',authMiddleware,getDoctorPrescriptiondata)
appointment.put('/prescription',authMiddleware,checkPermission("doctor","editPrescription"),editDoctorPrescription)
appointment.post('/prescription-action',authMiddleware,prescriptionAction)
appointment.delete('/prescription/:id',authMiddleware,checkPermission("doctor","deletePrescription"),deleteDoctorPrescription)
appointment.post('/lab-test',authMiddleware,doctorLabTest)
appointment.post('/rating',authMiddleware,giveRating)
appointment.get('/patient/:id',authMiddleware,getPatientAppointment)
appointment.get('/patient-lab/:id',authMiddleware,getPatientLabAppointment)

appointment.post('/lab',authMiddleware,bookLabAppointment)
appointment.get('/lab/:id',authMiddleware,checkPermission("lab","testRequest"),getLabAppointment)
appointment.put('/lab-action',authMiddleware,checkPermission("lab","appointmentStatus"),actionLabAppointment)
appointment.put('/lab/payment-action',authMiddleware,checkPermission("lab","paymentStatus"),paymentLabAppointment)
appointment.post('/lab-cancel',authMiddleware,cancelLabAppointment)

appointment.get('/doctor/past-appointments/:doctorId/:patientId',authMiddleware,getDoctorPastAppointment)
appointment.get('/hospital/past-appointments/:hospitalId/:patientId',authMiddleware,getHospitalPastAppointment)
appointment.get('/hospital/:id',authMiddleware,getHospitalAppointment)
appointment.get('/lab/past-appointments/:labId/:patientId',authMiddleware,checkPermission("lab","patientDetails"),getPastPatientLabAppointment)

appointment.get('/hospital/doctor/:id',authMiddleware,getHospitalDoctorAppointment)
export default appointment
import express from 'express'
import cors from 'cors'
import dotenv from 'dotenv'
import connectDB from './config/dbConfig.js'
import patient from './routes/patient.js'
import doctor from './routes/doctor.js'
import appointment from './routes/appointment.js'
import lab from './routes/laboratory.js'
import pharmacy from './routes/pharmacy.js'
import path from 'path';
import { fileURLToPath } from 'url';
import authRoutes from './routes/Hospital/auth.js';
import hospitalRoutes from './routes/Hospital/hospital.js';
import adminRoutes from './routes/Hospital/admin.js';
import departmentRoutes from "./routes/Hospital/department.routes.js";
import fileRoutes from './routes/Hospital/fileRoute.js'
import locations from './routes/Hospital/location.js'
import hospitalStaff from './routes/Hospital/hospitalStaff.js'
import hospitalDoctor from './routes/Hospital/hospitalDoctor.js'
import hospitalPatient from './routes/Hospital/hospitalPatient.js'
import bed from './routes/Hospital/bed.js'
import hospitalPrescription from './routes/Hospital/prescription.js'
import './seed/seedLocation.js'
dotenv.config()
const app = express()
app.use(cors())
connectDB()
app.use(express.json())

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Serve uploads folder
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

app.use('/patient', patient)
app.use('/doctor', doctor)
app.use('/appointment', appointment)
app.use('/lab', lab)
app.use('/pharmacy', pharmacy)





app.use("/api",fileRoutes);
app.use("/api/auth", authRoutes);
app.use("/api/hospital", hospitalRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/location", locations);
app.use("/api/hospital-staff", hospitalStaff);
app.use("/api/hospital-doctor", hospitalDoctor);
app.use("/api/patients", hospitalPatient);
app.use("/api/hospital/departments", departmentRoutes);
app.use("/api/bed", bed);
app.use("/api/prescription", hospitalPrescription);



app.listen(process.env.PORT, () => {
    console.log("Start")
})
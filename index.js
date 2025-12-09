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

dotenv.config()
const app=express()
app.use(cors())
connectDB()
app.use(express.json())

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Serve uploads folder
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

app.use('/patient',patient)
app.use('/doctor',doctor)
app.use('/appointment',appointment)
app.use('/lab',lab)
app.use('/pharmacy',pharmacy)



app.listen(process.env.PORT,()=>{
    console.log("Start")
})
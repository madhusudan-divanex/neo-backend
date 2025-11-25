import express from 'express'
import cors from 'cors'
import dotenv from 'dotenv'
import connectDB from './config/dbConfig.js'
import patient from './routes/patient.js'
import doctor from './routes/doctor.js'
import appointment from './routes/appointment.js'
import lab from './routes/laboratory.js'

dotenv.config()
const app=express()
app.use(cors())
connectDB()
app.use(express.json())

app.use('/patient',patient)
app.use('/doctor',doctor)
app.use('/appointment',appointment)
app.use('/lab',lab)


app.listen(process.env.PORT,()=>{
    console.log("Start")
})
import express from 'express'
import cors from 'cors'
import dotenv from 'dotenv'
import connectDB from './config/dbConfig.js'
import patient from './routes/patient.js'

dotenv.config()
const app=express()
app.use(cors())
connectDB()
app.use(express.json())

app.use('/patient',patient)
app.listen(process.env.PORT,()=>{
    console.log("Start")
})
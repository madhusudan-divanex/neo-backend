import mongoose, { Schema } from "mongoose";

const transferSchema = new Schema({
    allotmentId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "BedAllotment",
        required: true,
        unique:true
    },
    patientId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true
    },
    departmentFrom: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Department",
        required: true
    },
    departmentTo: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Department",
        required: true
    },
    bedFrom: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "HospitalBed",
        required: true
    },
    bedTo: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "HospitalBed",
        required: true
    },
    doctorFrom: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true
    },
    doctorTo: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true
    },
    hospitalId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true
    },
    reason: {
        type:String,
        required: true
    }

}, { timestamps: true })
const DepartmentTransfer = await mongoose.model("DepartmentTransfer", transferSchema)
export default DepartmentTransfer
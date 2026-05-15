import mongoose, {  Schema } from "mongoose";

const transferSchema = new Schema({
    fromHospital: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true,
    },
    toHospital: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true, index: true
    },
    receivingDoctor: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true,
    },
    sendingDoctor: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true,
    },
    patientId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true, index: true
    },
    departmentFrom:{
        type: mongoose.Schema.Types.ObjectId,
        ref: "Department",
        required: true
    },
    departmentTo:{
        type: mongoose.Schema.Types.ObjectId,
        ref: "Department",
        required: true
    },
    reasonForTransfer: {
        diagnosis: String,
        reason:String,
        conditionAtTransfer: String,
        treatmentGiven: String,
    },
    documentShared: {
        dischargeSummary:{
            type:mongoose.Schema.Types.ObjectId,
            ref:"DischargePatient"
        },
        labReports:[{
            type:mongoose.Schema.Types.ObjectId,
            ref:"test-report"
        }],
        prescriptions:{
            type:mongoose.Schema.Types.ObjectId,
            ref:"Prescriptions"
        }
    },
    timeLine:{
        transferInitiated: {
            date:Date,
            content:String
        },
        familyConsent: {
            date:Date,
            content:String
        },
        ambulanceDispatched: {
            date:Date,
            content:String
        },
        received: {
            date:Date,
            content:String
        },
    },
    transferDate: {
        type: Date,
        default: Date.now
    },
    status:{
        type: String,
        enum: ["Pending", "Completed", "Cancelled","Rejected","Draft"],
        default: "Draft"    
    }

}, { timestamps: true })
const HospitalTransfer = mongoose.model("HospitalTransfer", transferSchema);
export default HospitalTransfer;
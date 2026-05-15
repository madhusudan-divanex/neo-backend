import mongoose, { Schema } from "mongoose";

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
    reasonForTransfer: {
        diagnosis: String,
        reason: String,
        conditionAtTransfer: String,
        treatmentGiven: String,
    },
    documentShared: {
        dischargeSummary: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "DischargePatient"
        },
        labReports: [{
            type: mongoose.Schema.Types.ObjectId,
            ref: "test-report"
        }],
        prescriptions: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Prescriptions"
        }
    },
    timeLine: {
        transferInitiated: {
            date: Date,
            content: String
        },
        familyConsent: {
            date: Date,
            content: String
        },
        ambulanceDispatched: {
            date: Date,
            content: String
        },
        received: {
            date: Date,
            content: String
        },
    },
    transferDate: {
        type: Date,
        default: Date.now
    },
    allotmentId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "BedAllotment",
        index: true,
        required: true
    },
    status: {
        type: String,
        enum: ["Pending", "Completed", "Cancelled", "Rejected", "Draft"],
        default: "Draft"
    }, customId: String

}, { timestamps: true })
transferSchema.pre("save", async function (next) {
    if (this.customId) return next();

    try {
        while (true) {
            const id = Math.floor(100000 + Math.random() * 900000).toString();
            const exists = await this.constructor.findOne({ customId: id });
            if (!exists) {
                this.customId = id;
                break;
            }
        }
        next();
    } catch (err) {
        next(err);
    }
});

const HospitalTransfer = mongoose.model("HospitalTransfer", transferSchema);
export default HospitalTransfer;
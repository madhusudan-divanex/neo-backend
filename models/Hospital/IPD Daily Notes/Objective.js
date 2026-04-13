import mongoose, { Schema } from "mongoose";

const objectiveSchema = new Schema({
    headerId: {
        type: mongoose.Schema.Types.ObjectId, ref: 'IPDHeader', required: true, index: true
    },
    vitals: {
        temperature: Number,
        pulse: Number,
        bpSystolic: Number,
        bpDiastolic: Number,
        respiratoryRate: Number, // rr
        spo2: Number,
        oxygenSupport: {
            type: {
                type: String,
                enum: ["RA", "O2",""]
            },
            litersPerMin: Number
        },
        weight: Number,
        gcs: Number
    },

    intakeOutput: {
        intakeMl: Number,
        outputMl: Number,
        urineMl: Number,
        drains: String,
        stool: String
    },

    physicalExam: {
        general: {
            comfortable: Boolean,
            distressed: Boolean,
            pallor: Boolean,
            icterus: Boolean,
            edema: Boolean
        },
        cvs: String,
        rs: String,
        abdomen: String,
        cns: String,
        localExam: String
    }

}, { timestamps: true })

const IPDObjective = mongoose.model('IPDObjective', objectiveSchema)

export default IPDObjective
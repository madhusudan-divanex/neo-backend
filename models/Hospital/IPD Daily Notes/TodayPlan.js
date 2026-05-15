import mongoose, { Schema } from "mongoose";

const todayPlanSchema = new Schema({
    headerId: {
        type: mongoose.Schema.Types.ObjectId, ref: 'IPDHeader', required: true, index: true
    },
    medications: {
        continue: [String],
        start: [String],
        stopOrHold: [String],
        antibiotics: {
            name: String,
            day: Number,
            totalDays: Number
        },
        controlledMeds: {
            used: Boolean,
            justification: String
        }
    },

    orders: {
        labs: [String],
        imaging: [String],
        consults: [String],
        procedures: [String]
    },

    monitoring: {
        vitalsFrequency: {
            type: String,
            enum: ["q4h", "q6h", "q8h", "continuous"]
        },
        ioChart: Boolean,
        glucoseMonitoring: Boolean
    },

    dietNursing: {
        diet: {
            type: String,
            enum: ["NPO", "liquid", "soft", "normal"]
        },
        nursingInstructions: String
    },

    discharge: {
        expected: {
            type: String,
            enum: ["today", "24-48h", "later"]
        },
        barriers: String,
        followUp: {
            specialty: String,
            doctor: String,
            days: Number
        }
    }

}, { timestamps: true })

const IPDTodayPlan = mongoose.model('IPDTodayPlan', todayPlanSchema)

export default IPDTodayPlan
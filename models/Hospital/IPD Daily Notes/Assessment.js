import mongoose, { Schema } from "mongoose";

const assessmentSchema = new Schema({
    headerId: {
        type: mongoose.Schema.Types.ObjectId, ref: 'IPDHeader', required: true, index: true
    },
    primaryDiagnosis: String,
    comorbidities: [String],

    activeProblems: {
        infection: Boolean,
        pain: Boolean,
        hypoxia: Boolean,
        electrolyteImbalance: Boolean,
        anemia: Boolean,
        aki: Boolean,
        bleeding: Boolean,
        others: String
    },

    clinicalStatus: {
        type: String,
        enum: ["improving", "stable", "deteriorating"]
    }

}, { timestamps: true })

const IPDAssessment = mongoose.model('IPDAssessment', assessmentSchema)

export default IPDAssessment
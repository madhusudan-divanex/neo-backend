import mongoose, { Schema } from "mongoose";

const subjectiveSchema = new Schema({
    headerId: {
        type: mongoose.Schema.Types.ObjectId, ref: 'IPDHeader', required: true, index: true
    },
    pain: {
        status: { type: String, enum: ["better", "same", "worse",""] },
        location: String,
        score: { type: Number, min: 0, max: 10 }
    },

    fever: { type: Boolean },
    breathlessness: { type: Boolean },

    appetite: {
        type: String,
        enum: ["good", "poor"]
    },

    sleep: {
        type: String,
        enum: ["ok", "disturbed"]
    },

    otherSymptoms: String,

    overnightEvents: {
        stable: Boolean,
        hypotension: Boolean,
        desaturation: Boolean,
        chestPain: Boolean,
        seizure: Boolean,
        vomiting: Boolean,
        bleeding: Boolean
    },

    notes: String

}, { timestamps: true })

const IPDSubjective = mongoose.model('IPDSubjective', subjectiveSchema)

export default IPDSubjective
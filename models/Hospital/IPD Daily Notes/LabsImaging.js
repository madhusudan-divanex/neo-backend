import mongoose, { Schema } from "mongoose";

const labImagingSchema = new Schema({
    headerId: {
        type: mongoose.Schema.Types.ObjectId, ref: 'IPDHeader', required: true, index: true
    },
    cbc: {
        hb: Number,
        wbc: Number,
        platelets: Number,
        abnormal: String
    },

    rft: {
        urea: Number,
        creatinine: Number
    },

    lft: {
        bilirubin: Number,
        ast: Number,
        alt: Number
    },

    electrolytes: {
        sodium: Number,
        potassium: Number,
        chloride: Number
    },

    otherTests: String,

    imaging: {
        type: String
    },

    criticalAlert: {
        exists: Boolean,
        details: String
    }

}, { timestamps: true })

const IPDLabImaging = mongoose.model('IPDLabImaging', labImagingSchema)

export default IPDLabImaging
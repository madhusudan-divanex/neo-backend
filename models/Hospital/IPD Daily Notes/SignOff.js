import mongoose, { Schema } from "mongoose";

const signOffSchema = new Schema({
    headerId: {
        type: mongoose.Schema.Types.ObjectId, ref: 'IPDHeader', required: true, index: true
    },
    authorActorId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    authorSignature: String,
    reviewedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    reviewerSignature: String,
    noteVersion: {
        type: String,
        enum: ["v1", "v2", "Addendum"],
        default: "v1"
    },

    amendmentReason: String

}, { timestamps: true })

const IPDSignOff = mongoose.model('IPDSignOff', signOffSchema)

export default IPDSignOff
import mongoose, { Schema } from "mongoose";

const sixLabSchema = new Schema({

    title: String,
    description: String,
    btnLink:
    {
        first: String,
        second: String,
    }

}, { timestamps: true })
const SevenLab = mongoose.model('seven-lab-page', sixLabSchema)
export default SevenLab;
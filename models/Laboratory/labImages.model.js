import mongoose, { Schema } from "mongoose"

const licSchema = new Schema({
    thumbnail: {type:String,required:true},
    labImg: [String],
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'Laboratory', required: true },
}, { timestamps: true })

const LabImage = mongoose.model('lab-image', licSchema)

export default LabImage
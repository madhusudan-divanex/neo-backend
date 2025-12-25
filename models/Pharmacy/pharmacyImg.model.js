import mongoose, { Schema } from "mongoose"

const licSchema = new Schema({
    thumbnail: {type:String,required:true},
    pharImg: [String],
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
}, { timestamps: true })

const PharmacyImage = mongoose.model('Pharmacy-image', licSchema)

export default PharmacyImage
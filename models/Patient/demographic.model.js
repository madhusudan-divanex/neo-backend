import mongoose, { Schema } from "mongoose"

const contactSchema = new Schema({
    emergencyContactName: { type: String, },
    emergencyContactNumber: { type: String, },
})
const demographicSchema = new Schema({
    height: { type: String, },
    weight: { type: String, },
    bloodGroup: { type: String, },
    dob: { type: Date, required: true },
    contact: contactSchema,
    address: { type: String },
    countryId: { type: mongoose.Schema.Types.ObjectId, ref: "Country", },
    stateId: { type: mongoose.Schema.Types.ObjectId, ref: 'State', },
    cityId: { type: mongoose.Schema.Types.ObjectId, ref: 'City', },
    pinCode: String,
    lat: Number,
    long: Number,
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
}, { timestamps: true })

const PatientDemographic = mongoose.model('Patient-Demographic', demographicSchema)

export default PatientDemographic
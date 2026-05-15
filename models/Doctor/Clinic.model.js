import mongoose, { Schema } from "mongoose";


const clinicSchema = new Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true
    },
    licenseNumber: { type: String },
    licenseImage: { type: String, required: true },
    clinicImage: { type: String, required: true },
    clinicName: { type: String, required: true },


}, { timestamps: true });

const DoctorClinic = mongoose.model("doctor-clinic", clinicSchema);
export default DoctorClinic

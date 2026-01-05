import mongoose, { Schema } from "mongoose"

const educationSchema = new Schema({
  university: { type: String, required: true },
  degree: { type: String, required: true },
  startYear: { type: String, required: true },
  endYear: { type: String, required: true },
});
const workSchema = new Schema({
  organization: { type: String, required: true },
  totalYear: { type: String, required: true },
  month: { type: String, required: true },
  present: { type: Boolean, default: false },
});
const eduWorkSchema = new Schema({
    education: [educationSchema],
    work: [workSchema],     
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
}, { timestamps: true })

const DoctorEduWork = mongoose.model('Doctor-EduWork', eduWorkSchema)
export default DoctorEduWork
import mongoose, { Schema } from "mongoose";

const medicanSchema = new Schema({
    name: { type: String, required: true },
    frequency: { type: String, required: true },
    duration: { type: String, required: true },
    refills: { type: String },
    instructions: { type: String, required: true }
})
const requestSchema = new Schema({
    doctorId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    patientId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    appointmentId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'doctor-appointment',
        // required: true
    },
    allotmentId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'BedAllotment',
        // required: true
    },
    medications: [medicanSchema],
    reVisit:{type:Number},
    notes: { type: String, required: true },
    diagnosis: { type: String, required: true },
    status: { type: String },
    customId: { type: String },
    notif:{type:Boolean,default:false},
    type:{type:String,enum:['appointment','allotment'],default:'appointment'}

}, { timestamps: true })
requestSchema.pre("save", async function (next) {
  if (this.customId) return next();

  try {
    while (true) {
      const id = Math.floor(100000 + Math.random() * 900000).toString();
      const exists = await this.constructor.findOne({ customId: id });
      if (!exists) {
        this.customId = id;
        break;
      }
    }
    next();
  } catch (err) {
    next(err);
  }
});
const Prescriptions = mongoose.model('Prescriptions', requestSchema);
export default Prescriptions
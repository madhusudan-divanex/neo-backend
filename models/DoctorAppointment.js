import mongoose, { Schema } from "mongoose";

const requestSchema = new Schema({
    doctorId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User', required: true
    },
    patientId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User', required: true
    },
    hospitalId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    },
    date: { type: Date, required: true },
    customId: { type: String,},
    fees: { type: String, required: true },
    note: { type: Date },
    labTest: {
        lab: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
        },
        labTests: [{
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Test'
        }]
    },
    prescriptionId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Prescriptions'
    },
    paymentStatus:{type:String,enum:['due','paid'],default:'due'},
    status: { type: String, enum: ['pending', 'approved', 'completed', 'rejected', 'cancel'], default: 'pending', index: true },
    cancelMessage: String

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

const DoctorAppointment = mongoose.model('doctor-appointment', requestSchema);
export default DoctorAppointment
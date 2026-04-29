import mongoose, { Schema } from "mongoose";

const requestSchema = new Schema({
    labId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User', required: true
    },
    patientId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User', required: true
    },
    doctorId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    },
    testId:[{
      type: mongoose.Schema.Types.ObjectId,
        ref: 'Test', required: true
    }],
    subCatId: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'SubTestCat', required: true
    }],
    doctorAp: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'doctor-appointment',
    },
    customId: { type: String},
    date: { type: Date, required: true },
    fees: { type: Number, required: true },
    staff:{
         type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    },
    invoiceId:{
         type: mongoose.Schema.Types.ObjectId,
        ref: 'LabPayment'
    },
    collectionDate:Date,
    testData:[{name:String,fees:Number}],
    paymentStatus: { type: String, enum: ['due', 'paid'], default: 'due' },
    status: { type: String, enum: ['pending', 'approved', 'deliver-report', 'pending-report', 'rejected', 'cancel'], default: 'pending' },
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
const LabAppointment = mongoose.model('lab-appointment', requestSchema);
export default LabAppointment
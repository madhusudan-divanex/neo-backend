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
    testId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Test', required: true
    },
    appointmentId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'lab-appointment', required: true
    },
    component: [
        {
            cmpId: String,
            result: String,
            textResult:String,
            status: String,
        },
    ],
    remark:String,
    upload:
    {
        name: String,
        report: String,
        comment: String,
    },
    customId:String

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
const TestReport = mongoose.model('test-report', requestSchema);
export default TestReport
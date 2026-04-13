
import mongoose, { Schema } from "mongoose";

const componentSchema = new Schema({
  name: { type: String, required: true },
  unit: { type: String, required: true },
  optionType: { type: String, required: true, default: 'text' },
  textResult: { type: String },
  result: [{ value: String, note: String }],
  referenceRange: { type: String, required: true },
  status: { type: Boolean, default: false },
  title: { type: String },

})
const sampleSchema = new Schema({
  type: { type: String, required: true },
  volume: { type: String, required: true },

})

const requestSchema = new Schema({
  labId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User', index: true
  },
  code: { type: String, required :true},
  shortName: { type: String, required: true },
  component: [componentSchema],
  sample: [sampleSchema],
  packageType: { type: String, enum: ['single', 'profile', 'pacakge'], default: 'single' },
  
  department: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Department', index: true
  },
  testType: { type: String, required: true },
  price: { type: String, required: true },
  specialApproval: { type: Boolean, default: false },
  fastingRequired: { type: Boolean, default: false },
  testProcessing: { type: String, required: true },
  customId: { type: String },
  status: { type: String, enum: ['active', 'inactive'], default: 'inactive' },
  hospitalId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', index: true },
  type: { type: String, enum: ['lab', 'hospital'], default: 'lab' }

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
const Test = mongoose.model('Test', requestSchema);
export default Test
import mongoose, { Schema } from 'mongoose'

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
const subCatSchema = new Schema({
    subCategory: {
        type: String,
        required: true
    },
    code: { type: String, required: true },
    shortName: { type: String, required: true },
    component: [componentSchema],
    sample: [sampleSchema],
    category: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'test-category', index: true
    }, 
    
    specialApproval: { type: Boolean, default: false },
    fastingRequired: { type: Boolean, default: false },
    customId: { type: String },
}, { timeStamp: true })
subCatSchema.pre("save", async function (next) {
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
const SubTestCat = mongoose.model('SubTestCat', subCatSchema)
export default SubTestCat
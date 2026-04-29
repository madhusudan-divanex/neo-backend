
import mongoose, { Schema } from "mongoose";



const requestSchema = new Schema({
  labId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User', index: true
  },
  category: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'test-category', index: true
  },
  subCatData: [
    {
      subCat: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'SubTestCat', index: true
      },
      price: { type: Number, required: true },
      status: { type: String, enum: ['active', 'inactive'], default: 'inactive' },
    }
  ],
  hospitalId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User', index: true
  },
  type: { type: String, enum: ['lab', 'hospital'], default: 'lab' },
  customId: { type: String },
  totalAmount:{type:Number,required:true}


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
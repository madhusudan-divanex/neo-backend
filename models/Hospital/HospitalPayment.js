import mongoose, { Schema } from "mongoose";

const serviceSchema = new Schema({
  name: String,
  amount: Number,
})
const ptSchema = new Schema({
  date: Date,
  type: String,
  amount: Number,
  paymentInfoId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "PaymentInfo"
  }
})
const bedPaymentSchema = new Schema({
  date: Date,
  amount: Number,
  bedId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "HospitalBed"
  }
})
const ipdPaymentSchema = new Schema({
  role: String,
  fees: Number,
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User"
  },
  headerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "IPDHeader"
  }
})

const paymentSchema = new Schema({
  customId: String,
  allotmentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "BedAllotment"
  },
  hospitalId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User"
  },
  patientId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User"
  },
  services: [serviceSchema],
  bedCharges:[bedPaymentSchema],
  ipdPayment: [ipdPaymentSchema],
  payments: [ptSchema],
  status: {
    type: String,
    enum: ['Pending', 'Complete'],
    default: 'Pending'
  },
  totalPaid:Number,
  totalAmount: {type:Number,default:0},
  finalAmount: {type:Number,default:0},
  discountType: {
    type: String,
    enum: ['Fixed', 'Percentage']
  },
  discountValue:Number
})
paymentSchema.pre("save", async function (next) {
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
const HospitalPayment = mongoose.model('HospitalPayment', paymentSchema)

export default HospitalPayment
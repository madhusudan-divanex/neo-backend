import mongoose, { Schema } from "mongoose";

const serviceSchema=new Schema({
    name: String,
    amount: Number ,
})
const ptSchema=new Schema({
    date:   Date, 
    type:  String, 
    amount:Number
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
    services:[serviceSchema],
    payments:[ptSchema],
    status: {
        type: String,
        enum: ['Pending', 'Complete'],
        default: 'Pending'
    }
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
const HospitalPayment=mongoose.model('HospitalPayment',paymentSchema)

export default HospitalPayment
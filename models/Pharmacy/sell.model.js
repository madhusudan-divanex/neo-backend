
import mongoose from "mongoose";

const ReturnSchema = new mongoose.Schema({
    pharId: { type: mongoose.Schema.Types.ObjectId, ref: "User",index:true},
    hospitalId: { type: mongoose.Schema.Types.ObjectId, ref: "User",index:true},
    patientId: { type: mongoose.Schema.Types.ObjectId, ref: "User" ,required:true },
    doctorId: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    prescriptionFile: { type: String },
    prescriptionId: { type: mongoose.Schema.Types.ObjectId, ref: "Prescriptions" },
    products: [
        {
            inventoryId: { type: mongoose.Schema.Types.ObjectId, ref: "Inventory" },
            quantity: Number,
            medicineName:String,
            amount:Number,
            rate:Number,
            discountType:{ type: String, enum: ["Percentage", "Fixed"], default: "Fixed" },
            discountValue:{ type: Number, default: 0 },
            totalAmount:{ type: Number, default: 0 },
        }
    ],
    returnProducts: [
        {
            inventoryId: { type: mongoose.Schema.Types.ObjectId, ref: "Inventory" },
            quantity: Number,
            condition:String,
            refundAmount:{type:Number,decimal:true},
            reason:String
        }
    ],
    refundStatus:String,
    refundMode:String,
    returnDate:Date,
    paymentInfoId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "PaymentInfo"
      },
    paymentMethod:{type:String,enum:['CARD','CASH','ONLINE'],default:''},
    deliveryType:{type:String,enum:['Counter pickup','Home delivery','Hospital delivery'],default:'Counter pickup'},
    note:String,
    total:{ type: Number, default: 0 },
    customId:String,
    paymentStatus: {type: String, enum: ["Pending", "Completed"], default: "Pending" },
}, { timestamps: true });
ReturnSchema.pre("save", async function (next) {
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
const Sell = mongoose.model("Sell", ReturnSchema);

export default Sell
import mongoose from 'mongoose';

const InventorySchema = new mongoose.Schema({
    pharId: { type: mongoose.Schema.Types.ObjectId, ref: "User", index: true },
    medicineName: String,
    schedule: String,
    batchNumber: String,
    mfgDate: Date,
    expDate: Date,
    quantity: Number,
    sellCount: { type: Number, default: 0 },
    purchasePrice: Number,
    totalStockPrice: Number,
    salePrice: Number,
    customId: { type: String},
    margin: { type: String },
    hospitalId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', index: true },
    type: { type: String, enum: ['pharmacy', 'hospital'], default: 'pharmacy' },
    status: { type: String, enum: ['Pending', 'Approved', 'Rejected'], default: 'Pending' }
}, { timestamps: true });

InventorySchema.pre("save", async function (next) {
  if (this.customId) return next();

  try {
    while (true) {
      const id = Math.floor(10000 + Math.random() * 90000).toString();
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
const Inventory = mongoose.model('Inventory', InventorySchema);
export default Inventory

import mongoose from 'mongoose';

const InventorySchema = new mongoose.Schema({
    pharId: { type: mongoose.Schema.Types.ObjectId, ref: "Pharmacy" },
    medicineName: String,
    schedule: String,
    batchNumber: String,
    mfgDate: Date,
    expDate: Date,
    quantity: Number,
    purchasePrice: Number,
    totalStockPrice: Number,
    avgMargin: Number,
    highMargin: Number,
    lowMargin: Number,
}, { timestamps: true });
const Inventory= mongoose.model('Inventory', InventorySchema);
export default Inventory

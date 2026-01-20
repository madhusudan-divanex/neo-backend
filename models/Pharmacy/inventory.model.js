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
    customId: { type: String, required: true },
    margin: { type: String },
    hospitalId: { type: mongoose.Schema.Types.ObjectId, ref: 'HospitalBasic', index: true },
    type: { type: String, enum: ['pharmacy', 'hospital'], default: 'pharmacy' },
    status: { type: String, enum: ['Pending', 'Approved', 'Rejected'], default: 'Pending' }
}, { timestamps: true });
const Inventory = mongoose.model('Inventory', InventorySchema);
export default Inventory

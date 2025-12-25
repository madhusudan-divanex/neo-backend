import mongoose from 'mongoose';

const InventorySchema = new mongoose.Schema({
    pharId: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    medicineName: String,
    schedule: String,
    batchNumber: String,
    mfgDate: Date,
    expDate: Date,
    quantity: Number,
    sellCount:{type:Number,default:0},
    purchasePrice: Number,
    totalStockPrice: Number,
    avgMargin: Number,
    highMargin: Number,
    lowMargin: Number,
    customId: { type: String, required: true },
    marginType:{type:String,enum:['Percentage','Fixed'],default:'Percentage'},

    status:{type:String,enum:['Pending','Approved','Rejected'],default:'Pending'}
}, { timestamps: true });
const Inventory= mongoose.model('Inventory', InventorySchema);
export default Inventory

import mongoose from "mongoose";

const ReturnSchema = new mongoose.Schema({
    pharId: { type: mongoose.Schema.Types.ObjectId, ref: "User", index: true },
    supplierId: { type: mongoose.Schema.Types.ObjectId, ref: "Supplier" },
    deliveryDate: Date,
    status: { type: String, enum: ["Pending", "Completed"], default: "Pending" },
    products: [
        {
            inventoryId: { type: mongoose.Schema.Types.ObjectId, ref: "Inventory" },
            quantity: Number,
        }
    ],
    hospitalId: { type: mongoose.Schema.Types.ObjectId, ref: 'HospitalBasic', index: true },
    type: { type: String, enum: ['pharmacy', 'hospital'], default: 'pharmacy' },
    reason: String,
}, { timestamps: true });

const Return = mongoose.model("Returns", ReturnSchema);

export default Return
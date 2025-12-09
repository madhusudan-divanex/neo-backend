import mongoose from "mongoose";

const ReturnSchema = new mongoose.Schema({
    pharId: { type: mongoose.Schema.Types.ObjectId, ref: "Pharmacy" },
    supplierId: { type: mongoose.Schema.Types.ObjectId, ref: "Supplier" },
    deliveryDate: String,
    status: { type: String, enum: ["Pending", "Completed"], default: "Pending" },
    products: [
        {
            inventoryId: { type: mongoose.Schema.Types.ObjectId, ref: "Inventory" },
            quantity: Number,
        }
    ],
    reason: String,
}, { timestamps: true });

const Return = mongoose.model("Returns", ReturnSchema);

export default Return
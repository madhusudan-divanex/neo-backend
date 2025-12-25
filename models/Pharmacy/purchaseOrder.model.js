import mongoose from "mongoose"

const POProductSchema = new mongoose.Schema({
    productName: String,
    schedule: String,
    quantity: Number,
    batchNumber: String,
    expDate: String
});

const POSchema = new mongoose.Schema({
    pharId: { type: mongoose.Schema.Types.ObjectId, ref: "User",required:true },
    supplierId: { type: mongoose.Schema.Types.ObjectId, ref: "Supplier" ,required:true},
    deliveryDate: Date,
    note: String,
    status: {
        type: String,
        enum: ["pending", "received"],
        default: "pending"
    },
    products: [POProductSchema]
}, { timestamps: true });

const PurchaseOrder = mongoose.model("Purchase-order", POSchema);
export default PurchaseOrder
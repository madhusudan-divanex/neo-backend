
import mongoose from "mongoose";

const ReturnSchema = new mongoose.Schema({
    pharId: { type: mongoose.Schema.Types.ObjectId, ref: "Pharmacy" },
    patientId: { type: mongoose.Schema.Types.ObjectId, ref: "Patient" },
    doctorId: { type: mongoose.Schema.Types.ObjectId, ref: "Doctor" },
    products: [
        {
            inventoryId: { type: mongoose.Schema.Types.ObjectId, ref: "Inventory" },
            quantity: Number,
            price:Number
        }
    ],
    paymentStatus: {type: String, enum: ["Pending", "Completed"], default: "Pending" },
}, { timestamps: true });

const Sell = mongoose.model("Sell", ReturnSchema);

export default Sell
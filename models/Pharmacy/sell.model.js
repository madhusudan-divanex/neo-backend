
import mongoose from "mongoose";

const ReturnSchema = new mongoose.Schema({
    pharId: { type: mongoose.Schema.Types.ObjectId, ref: "User",required:true ,index:true},
    patientId: { type: mongoose.Schema.Types.ObjectId, ref: "Patient" ,required:true },
    doctorId: { type: mongoose.Schema.Types.ObjectId, ref: "Doctor" ,required:true },
    prescriptionFile: { type: String },
    prescriptionId: { type: mongoose.Schema.Types.ObjectId, ref: "Prescription" },
    products: [
        {
            inventoryId: { type: mongoose.Schema.Types.ObjectId, ref: "Inventory" },
            quantity: Number,
            price:Number
        }
    ],
    total:{ type: Number, default: 0 },
    paymentStatus: {type: String, enum: ["Pending", "Completed"], default: "Pending" },
}, { timestamps: true });

const Sell = mongoose.model("Sell", ReturnSchema);

export default Sell
import mongoose from "mongoose";

const SupplierSchema = new mongoose.Schema({
    pharId: { type: mongoose.Schema.Types.ObjectId, ref: "Pharmacy", required: true },
    name: { type: String, required: true },
    mobileNumber: { type: String, required: true },
    email: { type: String, unique: true },
    address: { type: String },
    cityId: { type: mongoose.Schema.Types.ObjectId, ref: "City" },
    pincode: { type: String },
    score: { type: Number, default: 0 },
    onTimeDelivery: { type: Number, default: 0 },
    price: { type: Number, default: 0 },
    quality: { type: Number, default: 0 }
}, { timestamps: true });

const Supplier = mongoose.model("Supplier", SupplierSchema);

export default Supplier

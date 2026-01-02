import mongoose from "mongoose";

const SupplierSchema = new mongoose.Schema({
    pharId: { type: mongoose.Schema.Types.ObjectId, ref: "User", index: true },
    name: { type: String, required: true },
    mobileNumber: { type: String, required: true },
    email: { type: String, unique: true },
    address: { type: String },
    city: { type: String },
    pincode: { type: String },
    score: { type: Number, default: 0 },
    hospitalId: { type: mongoose.Schema.Types.ObjectId, ref: 'HospitalBasic', index: true },
    type: { type: String, enum: ['pharmacy', 'hospital'], default: 'pharmacy' },
}, { timestamps: true });

const Supplier = mongoose.model("Supplier", SupplierSchema);

export default Supplier

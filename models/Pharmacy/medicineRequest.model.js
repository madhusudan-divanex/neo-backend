import mongoose from 'mongoose';

const MedicineRequestSchema = new mongoose.Schema({
    pharId: { type: mongoose.Schema.Types.ObjectId, ref: "User",  index: true },
    medicineId: { type: mongoose.Schema.Types.ObjectId, ref: "Inventory", required: true },
    quantity: { type: Number, required: true },
    message: { type: String, default: "" },
    status: { type: String, enum: ['Pending', 'Approved', 'Rejected'], default: 'Pending' },
    hospitalId: { type: mongoose.Schema.Types.ObjectId, ref: 'Hospital', index: true },
    type: { type: String, enum: ['pharmacy', 'hospital'], default: 'pharmacy' },
}, { timpstamp: true });

const MedicineRequest = mongoose.model('MedicineRequest', MedicineRequestSchema);

export default MedicineRequest

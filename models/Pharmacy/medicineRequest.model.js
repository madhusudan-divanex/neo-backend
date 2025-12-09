import  mongoose from 'mongoose';

const MedicineRequestSchema = new mongoose.Schema({
    pharId: { type: mongoose.Schema.Types.ObjectId, ref: "Pharmacy", required: true },
    medicineId: { type: mongoose.Schema.Types.ObjectId, ref: "Inventory", required: true },
    quantity: { type: Number, required: true },
    message: { type: String, default: "" },
    status: { type: String, enum: ['Pending', 'Approved', 'Rejected'], default: 'Pending' },
}, { timpstamp: true });

const MedicineRequest = mongoose.model('MedicineRequest', MedicineRequestSchema);

export default MedicineRequest

import mongoose from 'mongoose';

const userSchema = new mongoose.Schema({
    name: { type: String, required: true },
    email: { type: String, required: true },
    contactNumber: { type: String, required: true },
    gstNumber: { type: String, required: true },
    about: { type: String, required: true },
    logo: { type: String },
    role: { type: String, default: 'parent' },
    category: [{ type: mongoose.Schema.Types.ObjectId, ref: 'pharmacy-category', index: true }],
    allowEdit: { type: Boolean, default: false },
    status: { type: String, enum: ['pending', 'approved', 'rejected', 'block'], default: 'pending' },
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', index: true },
    rating: { type: Number, decimal: true, default: 0 },
}, { timestamps: true });

const Pharmacy = mongoose.model('Pharmacy', userSchema);

export default Pharmacy

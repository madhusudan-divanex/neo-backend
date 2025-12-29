import mongoose from 'mongoose';

const userSchema = new mongoose.Schema({
    labId: { type: mongoose.Schema.Types.ObjectId, ref: 'User',default:null },
    doctorId: { type: mongoose.Schema.Types.ObjectId, ref: 'User',default:null },
    hospitalId: { type: mongoose.Schema.Types.ObjectId, ref: 'User',default:null },
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User',index:true },   


}, { timestamps: true });

const Favorite = mongoose.model('Favorite', userSchema);

export default Favorite

import mongoose from 'mongoose';

const paymentInfoSchema = new mongoose.Schema({
    userId:{
        type:mongoose.Types.ObjectId,
        ref:'User',
        required:true,
        index:true,
    },
    bankName: {
        type: String,
        required: true,
        trim: true
    },
    accountNumber: {
        type: String,
        required: true,
        trim: true
    },
    ifscCode: {
        type: String,
        required: true,
        trim: true,
        uppercase: true
    },
    accountHolderName: {
        type: String,
        required: true,
        trim: true
    },
    branch: {
        type: String,
        required: true,
        trim: true
    },
    qr: {
        type: String,
        trim: true
    },
    
},{timestamps:true});

const PaymentInfo = mongoose.model('PaymentInfo', paymentInfoSchema);
export default PaymentInfo
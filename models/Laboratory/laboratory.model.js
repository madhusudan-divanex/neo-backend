import mongoose  from 'mongoose';

const userSchema = new mongoose.Schema({
    name: { type: String, required: true },
    email: { type: String, required: true },
    contactNumber: { type: String, required: true },
   
    gstNumber: { type: String, required: true }  , 
    about: { type: String, required: true }  , 
    logo: { type: String},
    role:{type:String,default:'parent'},
    allowEdit:{type:Boolean,default:false},
    status: { type: String, default: 'pending' }  ,
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' ,index:true},      

}, { timestamps: true });

const Laboratory = mongoose.model('Laboratory', userSchema);

export default Laboratory

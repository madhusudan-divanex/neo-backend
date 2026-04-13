import mongoose  from 'mongoose';

const userSchema = new mongoose.Schema({
    name: { type: String, required: true },
    email: { type: String, required: true },
    contactNumber: { type: String, required: true },
    customId:String,
    gstNumber: { type: String, required: true }  , 
    about: { type: String, required: true }  , 
    logo: { type: String},
    role:{type:String,default:'parent'},
    allowEdit:{type:Boolean,default:false},
    category:[{ type: mongoose.Schema.Types.ObjectId, ref: 'test-category',index:true }],
    status: { type: String, default: 'pending' }  ,
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' ,index:true},      

}, { timestamps: true });
userSchema.pre("save", async function (next) {
  if (this.customId) return next();

  try {
    while (true) {
      const id = Math.floor(100000 + Math.random() * 900000).toString();
      const exists = await this.constructor.findOne({ customId: id });
      if (!exists) {
        this.customId = id;
        break;
      }
    }
    next();
  } catch (err) {
    next(err);
  }
});
const Laboratory = mongoose.model('Laboratory', userSchema);

export default Laboratory

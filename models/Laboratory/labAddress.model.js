import mongoose,{ Schema }  from "mongoose";



const addressSchema = new Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,index:true
  },
  fullAddress: { type: String, required: true },
  countryId: { type: mongoose.Schema.Types.ObjectId,ref:"Country", required: true },
  stateId: { type: mongoose.Schema.Types.ObjectId,ref:'State', required: true },
  cityId: { type: mongoose.Schema.Types.ObjectId,ref:'City', required: true },
  pinCode: { type: String, required: true },
  lat: Number,
  long: Number
}, { timestamps: true });

const LabAddress = mongoose.model("lab-address", addressSchema);
export default LabAddress

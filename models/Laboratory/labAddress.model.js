import mongoose,{ Schema }  from "mongoose";



const addressSchema = new Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Laboratory",
    required: true
  },
  fullAddress: { type: String, required: true },
  country: { type: String, required: true },
  state: { type: String, required: true },
  city: { type: String, required: true },
  pinCode: { type: String, required: true },
}, { timestamps: true });

const LabAddress = mongoose.model("lab-address", addressSchema);
export default LabAddress

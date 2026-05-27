import mongoose, { Schema } from "mongoose";



const addressSchema = new Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true, index: true
  },
  fullAddress: { type: String, required: true },
  countryId: { type: mongoose.Schema.Types.ObjectId, ref: "Country", required: true },
  stateId: { type: mongoose.Schema.Types.ObjectId, ref: 'State', required: true },
  cityId: { type: mongoose.Schema.Types.ObjectId, ref: 'City', required: true },
  pinCode: { type: String, required: true },
  lat: Number,
  long: Number,
  location: {
    type: {
      type: String,
      enum: ['Point'],
      default: 'Point'
    },
    coordinates: {
      type: [Number],
      default: [0, 0]
    }
  },
}, { timestamps: true });
addressSchema.index({
  location: "2dsphere"
});
const PharAddress = mongoose.model("Phar-address", addressSchema);
export default PharAddress

import mongoose,{ Schema }  from "mongoose";



const addressSchema = new Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Pharmacy",
    required: true
  },
  name: { type: String, required: true },
  contactNumber: { type: String, required: true },
  email: { type: String, required: true },
  gender: { type: String,enum:['male','female','other'] ,required: true },
  photo: { type: String, required: true },
}, { timestamps: true });

const PharPerson = mongoose.model("Phar-person", addressSchema);
export default PharPerson

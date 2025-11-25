import mongoose,{ Schema }  from "mongoose";



const addressSchema = new Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Laboratory",
    required: true
  },
  name: { type: String, required: true },
  contactNumber: { type: String, required: true },
  email: { type: String, required: true },
  gender: { type: String, required: true },
  photo: { type: String, required: true },
}, { timestamps: true });

const LabPerson = mongoose.model("lab-person", addressSchema);
export default LabPerson

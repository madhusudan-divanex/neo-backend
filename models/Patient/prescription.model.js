import mongoose,{ Schema }  from "mongoose";

const prescriptionItemSchema = new Schema({
  name: { type: String, required: true },
  fileUrl: { type: String, required: true },
}, { timestamps: true });

const prescriptionsSchema = new Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Patient",
    required: true
  },
  prescriptions: [prescriptionItemSchema]
}, { timestamps: true });

const Prescriptions = mongoose.model("prescriptions", prescriptionsSchema);
export default Prescriptions

import mongoose, { Schema } from "mongoose";

const contactSchema = new Schema({
  name:    { type: String, required: true, trim: true },
  email:   { type: String, required: true },
  phone:   { type: String },
  subject: { type: String },
  message: { type: String, required: true },
  status:  { type: String, enum: ["new", "read", "replied"], default: "new" },
  reply:   { type: String },
  repliedAt: { type: Date }
}, { timestamps: true });

export default mongoose.model("Contact", contactSchema);

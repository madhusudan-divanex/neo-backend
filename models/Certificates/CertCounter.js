import mongoose from "mongoose";

const counterSchema = new mongoose.Schema({
  key: { type: String, unique: true }, // e.g. FIT-2026-0420
  seq: { type: Number, default: 0 }
});

const CertCounter = mongoose.model("CertCounter", counterSchema);
export default CertCounter;
// models/Organization.js
import mongoose from "mongoose";

const organizationSchema = new mongoose.Schema({
  name: { type: String, required: true },
  guard_name: { type: String, required: true }, // admin | doctor | hospital | pharmacy
}, { timestamps: true });

module.exports = mongoose.model("Organization", organizationSchema);

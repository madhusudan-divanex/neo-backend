import mongoose, { Schema } from "mongoose";

const ambulanceSchema = new Schema({
  patientId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
  driverId:  { type: mongoose.Schema.Types.ObjectId, ref: "User" },

  pickupAddress: { type: String, required: true },
  pickupLat:     { type: Number },
  pickupLng:     { type: Number },

  dropAddress:   { type: String, required: true },
  dropLat:       { type: Number },
  dropLng:       { type: Number },

  emergencyType: {
    type: String,
    enum: ["medical", "accident", "cardiac", "maternity", "other"],
    default: "medical"
  },
  notes:         { type: String },
  vehicleNumber: { type: String },
  amount:        { type: Number, default: 0 },
  eta:           { type: String },
  cancelReason:  { type: String },

  status: {
    type: String,
    enum: ["searching", "driver_assigned", "pickup", "ongoing", "completed", "cancelled"],
    default: "searching",
    index: true
  },

  customId: { type: String, unique: true, sparse: true }
}, { timestamps: true });

ambulanceSchema.pre("save", async function (next) {
  if (this.customId) return next();
  const id = "AMB" + Date.now().toString().slice(-6);
  this.customId = id;
  next();
});

export default mongoose.model("Ambulance", ambulanceSchema);

import mongoose from "mongoose";

const Schema = new mongoose.Schema(
  {
    hospitalId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "HospitalBasic",
      required: true
    },

    fileId: { type: String, required: true },

    fileUrl: { type: String }, // ⭐ optional but super useful for frontend

    type: {
      type: String,
      enum: ["thumbnail", "gallery", "logo", "other"],
      default: "gallery"
    },

    caption: { type: String }
  },
  { timestamps: true }
);

export default mongoose.model("HospitalImage", Schema);

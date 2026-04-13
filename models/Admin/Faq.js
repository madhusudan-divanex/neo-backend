import mongoose from "mongoose";

const faqSchema = new mongoose.Schema(
  {
    question: {
      type: String,
      required: true,
      trim: true
    },
    answer: {
      type: String,
      required: true,
      trim: true
    },
    status: {
      type: Boolean,
      default: true   // active / inactive
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Admin",
      required: true
    },
    panel:{
      type:String,enum:['doctor','patient','hospital','lab','pharmacy','main'],default:'main'
    }
  },
  { timestamps: true }
);

export default mongoose.model("Faq", faqSchema);

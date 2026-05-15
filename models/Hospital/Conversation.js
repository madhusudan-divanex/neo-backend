import mongoose from "mongoose";

const conversationSchema = new mongoose.Schema(
  {
    participants: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true
      }
    ],
    image:String,
    name:String,
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User"
    },
    lastMessage: {
      type: String
    },
    lastMessageAt: {
      type: Date
    },type:{
      type:String,
      enum:["individual","group"],
      default:"individual"
    }
  },
  { timestamps: true }
);

export default mongoose.model("Conversation", conversationSchema);

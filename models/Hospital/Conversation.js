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
    lastMessage: {
      type: String
    },
    lastMessageAt: {
      type: Date
    }
  },
  { timestamps: true }
);

export default mongoose.model("Conversation", conversationSchema);

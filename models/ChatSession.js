import mongoose, { Schema } from "mongoose";

const chatSessionSchema = new Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  title: {
    type: String,
    default: "New Chat",
  },
  audience: {
    type: String, // patient / doctor
  }
}, { timestamps: true });

const ChatSession = mongoose.model("ChatSession", chatSessionSchema);
export default ChatSession
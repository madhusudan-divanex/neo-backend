// models/Message.js
import mongoose from "mongoose";

const messageSchema = new mongoose.Schema({
  conversationId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Conversation",
    required: true
  },
  sender: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true
  },
   message: {
    type: String,
    default: ""
  },
  file: {
    url: { type: String },
    name: { type: String },
    type: { type: String }
  },
  seen: {
    type: Boolean,
    default: false
  }
}, { timestamps: true });
const Message = mongoose.model("Message", messageSchema);
export default Message

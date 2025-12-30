import express from 'express'
import auth from "../../middleware/auth.js";
import multer from "multer";
import { ChatList, CreateConversation, DeleteMessage, EditMessage, GetMessage, searchUsers, UnreadCount, UploadFile } from '../../controller/Hospital/chatController.js';
const chat = express.Router();




const storage = multer.diskStorage({
  destination: "uploads",
  filename: (_, file, cb) => {
    cb(null, Date.now() + "-" + file.originalname);
  }
});
const upload = multer({ storage });


chat.post("/create", auth,CreateConversation);
chat.get("/messages/:conversationId",auth,GetMessage);
chat.get("/unread-count", auth,UnreadCount);
//left sidebar
chat.get("/conversations", auth,ChatList);
//Edit Message
chat.put("/message/:id", auth,EditMessage);
//Delete Message
chat.delete("/message/:id", auth,DeleteMessage);
//Image Upload
chat.post("/upload", auth, upload.single("file"),UploadFile);

chat.get("/search", auth, searchUsers);



export default chat;




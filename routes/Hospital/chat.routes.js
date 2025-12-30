import express from "express";
import multer from "multer";

import auth from "../../middleware/auth.js";
import * as chat from "../../controller/Hospital/chatController.js";

const router = express.Router();

const storage = multer.diskStorage({
  destination: "uploads",
  filename: (_, file, cb) => {
    cb(null, Date.now() + "-" + file.originalname);
  }
});

const upload = multer({ storage });

router.post("/create", auth, chat.CreateConversation);
router.get("/messages/:conversationId", auth, chat.GetMessage);
router.get("/unread-count", auth, chat.UnreadCount);

// left sidebar
router.get("/conversations", auth, chat.ChatList);

// Edit Message
router.put("/message/:id", auth, chat.EditMessage);

// Delete Message
router.delete("/message/:id", auth, chat.DeleteMessage);

// Image Upload
router.post("/upload", auth, upload.single("file"), chat.UploadFile);

export default router;

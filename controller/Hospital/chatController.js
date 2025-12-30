// controllers/chatController.js
import mongoose from "mongoose";
import Conversation from "../../models/Hospital/Conversation.js";
import Message from "../../models/Hospital/Message.js";

export const CreateConversation = async (req, res) => {
  try {
    const myId = req.user.id || req.user.user ;
    const { userId } = req.body;

    if (!mongoose.Types.ObjectId.isValid(userId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid user id"
      });
    }

    let conversation = await Conversation.findOne({
      participants: { $all: [myId, userId] }
    }).populate("participants", "name role profileImage");

    if (!conversation) {
      conversation = await Conversation.create({
        participants: [userId, myId]
      });

      await conversation.populate(
        "participants",
        "name role profileImage"
      );
    }

    res.json({
      success: true,
      data: conversation
    });
  } catch (err) {
    console.error("CreateConversation Error:", err);
    res.status(500).json({
      success: false,
      message: "Server error"
    });
  }
};

export const UploadFile = async (req, res) => {
  res.json({
    success: true,
    file: {
      url: `/uploads/${req.file.filename}`,
      name: req.file.originalname,
      type: req.file.mimetype
    }
  });
};

export const DeleteMessage = async (req, res) => {
  const msg = await Message.findOne({
    _id: req.params.id,
    sender: req.user.id || req.user.user
  });

  if (!msg) return res.status(403).json({ message: "Not allowed" });

  msg.deleted = true;
  msg.message = "This message was deleted";
  await msg.save();

  res.json({ success: true });
};

export const EditMessage = async (req, res) => {
  const msg = await Message.findOne({
    _id: req.params.id,
    sender: req.user.id || req.user.user
  });

  if (!msg) return res.status(403).json({ message: "Not allowed" });

  msg.message = req.body.message;
  msg.edited = true;
  await msg.save();

  res.json({ success: true, data: msg });
};

export const ChatList = async (req, res) => {
  try {
    const userId = req.user.id || req.user.user;

    const conversations = await Conversation.find({
      participants: userId
    })
      .populate("participants", "name role profileImage")
      .sort({ lastMessageAt: -1 });

    const result = await Promise.all(
      conversations.map(async (conv) => {
        const unreadCount = await Message.countDocuments({
          conversationId: conv._id,
          seen: false,
          sender: { $ne: userId }
        });

        return {
          _id: conv._id,
          participants: conv.participants.filter(
            (p) => p._id.toString() !== userId
          ),
          lastMessage: conv.lastMessage,
          lastMessageAt: conv.lastMessageAt,
          unreadCount
        };
      })
    );

    res.json({
      success: true,
      data: result
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

export const UnreadCount = async (req, res) => {
  try {
    const userId = req.user.id || req.user.user;

    const unread = await Message.aggregate([
      {
        $match: {
          seen: false,
          sender: { $ne: userId }
        }
      },
      {
        $lookup: {
          from: "conversations",
          localField: "conversationId",
          foreignField: "_id",
          as: "conversation"
        }
      },
      { $unwind: "$conversation" },
      {
        $match: {
          "conversation.participants": userId
        }
      },
      {
        $group: {
          _id: "$conversationId",
          count: { $sum: 1 }
        }
      }
    ]);

    res.json({
      success: true,
      data: unread
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

export const GetMessage = async (req, res) => {
  try {
    const { conversationId } = req.params;
    const userId = req.user.id || req.user.user;

    if (!mongoose.Types.ObjectId.isValid(conversationId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid conversation ID"
      });
    }

    const conversation = await Conversation.findOne({
      _id: conversationId,
      participants: userId
    });

    if (!conversation) {
      return res.status(403).json({
        success: false,
        message: "You are not allowed to access this conversation"
      });
    }

    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const skip = (page - 1) * limit;

    const messages = await Message.find({ conversationId })
      .populate("sender", "name role profileImage")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    await Message.updateMany(
      {
        conversationId,
        sender: { $ne: userId },
        seen: false
      },
      { $set: { seen: true } }
    );

    return res.json({
      success: true,
      data: messages.reverse(),
      page,
      limit
    });
  } catch (err) {
    console.error("GetMessage Error:", err);
    return res.status(500).json({
      success: false,
      message: "Server error"
    });
  }
};

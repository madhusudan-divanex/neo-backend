import express from 'express'
import cors from 'cors'
import dotenv from 'dotenv'
import connectDB from './config/dbConfig.js'
import patient from './routes/patient.js'
import doctor from './routes/doctor.js'
import appointment from './routes/appointment.js'
import lab from './routes/laboratory.js'
import pharmacy from './routes/pharmacy.js'
import path from 'path';
import { fileURLToPath } from 'url';
// import authRoutes from './routes/Hospital/auth.js';
// import hospitalRoutes from './routes/Hospital/hospital.js';
// import adminRoutes from './routes/Hospital/admin.js';
// import departmentRoutes from "./routes/Hospital/department.routes.js";
// import fileRoutes from './routes/Hospital/fileRoute.js'
// import locations from './routes/Hospital/location.js'
// import hospitalStaff from './routes/Hospital/hospitalStaff.js'
// import hospitalDoctor from './routes/Hospital/hospitalDoctor.js'
// import hospitalPatient from './routes/Hospital/hospitalPatient.js'
// import bed from './routes/Hospital/bed.js'
// import hospitalPrescription from './routes/Hospital/prescription.js'

import authRoutes from "./routes/Hospital/auth.js";
import hospitalRoutes from "./routes/Hospital/hospital.js";
import adminRoutes from "./routes/Hospital/admin.js";
import departmentRoutes from "./routes/Hospital/department.routes.js";
import messageRoutes from "./routes/Hospital/chat.routes.js";
import './seed/seedLocation.js'
import http from 'http'
import { Server } from 'socket.io'
import Message from './models/Hospital/Message.js'
import User from './models/Hospital/User.js'
import CallLog from './models/Hospital/CallLog.js'

import Conversation from './models/Hospital/Conversation.js'
import jwt from 'jsonwebtoken';
dotenv.config()
const app = express()
app.use(cors())
connectDB()
app.use(express.json())

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Serve uploads folder
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

const server = http.createServer(app);

// 🔹 SOCKET.IO INIT
const io = new Server(server, {
    cors: {
        origin: "*",
        methods: ["GET", "POST"]
    }
});


// 🔐 SOCKET JWT AUTH MIDDLEWARE
io.use((socket, next) => {
    const token = socket.handshake.auth?.token;

    if (!token) return next(new Error("Unauthorized"));

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        console.log("decoded", decoded)
        socket.userId = decoded.id || decoded.user;

        console.log("🔐 Socket Auth:", decoded.user);
        next();
    } catch (err) {
        return next(new Error("Invalid token"));
    }
});


// ================= SOCKET LOGIC =================
const onlineUsers = new Map(); // userId -> socketId
const activeCalls = new Set(); // userIds

io.on("connection", (socket) => {
    console.log("🔌 Socket connected:", socket.id);
    onlineUsers.set(socket.userId, socket.id);

    io.emit("online-users", Array.from(onlineUsers.keys()));


    // ================= CHAT =================
    socket.on("send-message", async ({ toUserId, message = "", file = null }) => {
        try {
            if (!socket.userId || socket.userId === toUserId) return;
            const senderId = socket.userId;

            // Find or create conversation
            let conversation = await Conversation.findOne({
                participants: { $all: [senderId, toUserId] }
            });

            if (!conversation) {
                conversation = await Conversation.create({
                    participants: [senderId, toUserId]
                });
            }

            // Save message
            const msg = await Message.create({
                conversationId: conversation._id,
                sender: senderId,
                message: message || "",
                file: file || null
            });

            // Update conversation
            conversation.lastMessage = message
                ? message
                : file
                    ? "📎 Attachment"
                    : "";
            conversation.lastMessageAt = new Date();
            await conversation.save();

            // Emit to receiver
            const receiverSocket = onlineUsers.get(toUserId);
            if (receiverSocket) {
                io.to(receiverSocket).emit("receive-message", {
                    conversationId: conversation._id,
                    sender: { _id: senderId },
                    message: msg.message,
                    file: msg.file,
                    createdAt: msg.createdAt
                });
            }

        } catch (err) {
            console.error("Chat error:", err);
        }
    });


    // ================= CALL SIGNALING =================
    socket.on("call-user", async ({ toUserId, callType, offer }) => {

        if (activeCalls.has(toUserId)) {
            io.to(socket.id).emit("call-busy", {
                toUserId,
                message: "User is busy on another call"
            });
            return;
        }

        // ❌ CALLER BUSY (extra safety)
        if (activeCalls.has(socket.userId)) {
            return;
        }
        // ✅ mark both as busy
        activeCalls.add(socket.userId);
        activeCalls.add(toUserId);
        socket.callStartTime = new Date();
        socket.callLog = await CallLog.create({
            caller: socket.userId,
            receiver: toUserId,
            callType,
            startTime: socket.callStartTime
        });

        const receiverSocket = onlineUsers.get(toUserId);
        if (receiverSocket) {
            const user = await User.findById(socket.userId)
            console.log("recivre",socket.userId)
            io.to(receiverSocket).emit("incoming-call", {
                fromUserId: socket.userId,
                offer,
                callType, name: user.name
            });
        }
    });
    socket.on("set-availability", async (status) => {
        await User.findByIdAndUpdate(socket.userId, {
            isAvailable: status
        });
        io.emit("doctor-status-update", {
            doctorId: socket.userId,
            status
        });
    });
    socket.on("start-paid-chat", async ({ doctorId }) => {
        socket.chatSession = await ChatSession.create({
            doctor: doctorId,
            patient: socket.userId,
            startTime: new Date(),
            perMinuteCharge: 20,
            status: "active"
        });
    });
    socket.on("end-paid-chat", async () => {
        if (!socket.chatSession) return;

        const endTime = new Date();
        const minutes = Math.max(
            1,
            Math.ceil((endTime - socket.chatSession.startTime) / 60000)
        );

        socket.chatSession.endTime = endTime;
        socket.chatSession.totalAmount =
            minutes * socket.chatSession.perMinuteCharge;
        socket.chatSession.status = "ended";

        await socket.chatSession.save();
    });
    socket.on("typing", ({ toUserId }) => {
        const receiverSocket = onlineUsers.get(toUserId);
        if (receiverSocket) {
            io.to(receiverSocket).emit("user-typing", {
                fromUserId: socket.userId
            });
        }
    });
    socket.on("stop-typing", ({ toUserId }) => {
        const receiverSocket = onlineUsers.get(toUserId);
        if (receiverSocket) {
            io.to(receiverSocket).emit("user-stop-typing", {
                fromUserId: socket.userId
            });
        }
    });
    socket.on("end-call", async ({ toUserId }) => {

        activeCalls.delete(socket.userId);
        activeCalls.delete(toUserId);

        // 🧾 Call log update
        if (socket.callLog) {
            socket.callLog.endTime = new Date();
            socket.callLog.duration =
                (socket.callLog.endTime - socket.callLog.startTime) / 1000;

            socket.callLog.status =
                socket.callLog.duration < 2 ? "missed" : "completed";

            await socket.callLog.save();
            socket.callLog = null;
        }

        const receiverSocket = onlineUsers.get(toUserId);
        const callerSocket = onlineUsers.get(socket.userId);

        // 📤 notify OTHER user
        if (receiverSocket) {
            io.to(receiverSocket).emit("call-ended");
        }

        // 📤 ALSO notify CALLER (important for sync)
        if (callerSocket) {
            io.to(callerSocket).emit("call-ended");
        }
    });

    socket.on("answer-call", ({ toUserId, answer }) => {
        const receiverSocket = onlineUsers.get(toUserId);
        if (receiverSocket) {
            io.to(receiverSocket).emit("call-answered", {
                answer
            });
        }
    });



    socket.on("ice-candidate", ({ toUserId, candidate }) => {
        const receiverSocket = onlineUsers.get(toUserId);
        if (receiverSocket) {
            io.to(receiverSocket).emit("ice-candidate", candidate);
        }
    });


    // socket.on("reject-call", async ({ toUserId }) => {
    //     const receiverSocket = onlineUsers.get(toUserId);

    //     if (socket.callLog) {
    //         socket.callLog.endTime = new Date();
    //         socket.callLog.status = "rejected";
    //         await socket.callLog.save();
    //     }

    //     if (receiverSocket) {
    //         io.to(receiverSocket).emit("call-rejected");
    //     }
    // });
    socket.on("reject-call", async ({ toUserId }) => {
        const callerSocketId = onlineUsers.get(toUserId);
        activeCalls.delete(socket.userId);
        activeCalls.delete(toUserId);

        // 🧾 update call log
        if (socket.callLog) {
            socket.callLog.endTime = new Date();
            socket.callLog.status = "rejected";
            await socket.callLog.save();
        }

        // 📤 notify CALLER
        if (callerSocketId) {
            io.to(callerSocketId).emit("call-rejected", {
                fromUserId: socket.userId,
                reason: "rejected"
            });
        }
    });



    socket.on("disconnect", async () => {
        activeCalls.delete(socket.userId);
        if (socket.userId) {
            onlineUsers.delete(socket.userId);

            await User.findByIdAndUpdate(socket.userId, {
                isOnline: false,
                isAvailable: false,
                lastSeen: new Date()
            });

            io.emit("online-users", Array.from(onlineUsers.keys()));
        }

        console.log("❌ Socket disconnected:", socket.id);
    });

});

app.use('/patient', patient)
app.use('/doctor', doctor)
app.use('/appointment', appointment)
app.use('/lab', lab)
app.use('/pharmacy', pharmacy)
app.use('/user/:id', async (req, res) => {
    const userId = req.params.id
    try {
        let user;
        if (userId < 24) {
            user = await User.findOne({ unique_id: userId }).select('-password').lean();
        } else {
            user = await User.findOne({ _id: userId }).select('-password').lean();
        }
        if (!user) {
            return res.status(404).json({ success: false, message: 'User not found' });
        }
        // const ptDemographic=await PatientDemographic.findOne({userId:user._id}).sort({createdAt:-1})
        res.status(200).json({
            success: true,
            data: user
        });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
})







const fileRoute = (await import("./routes/Hospital/fileRoute.js")).default;
const locationRoutes = (await import("./routes/Hospital/location.routes.js")).default;
const staffRoutes = (await import("./routes/Hospital/hospitalStaff.routes.js")).default;
const doctorRoutes = (await import("./routes/Hospital/hospitalDoctor.routes.js")).default;
const patientRoutes = (await import("./routes/Hospital/hospitalPatient.routes.js")).default;
const bedRoutes = (await import("./routes/Hospital/bed.routes.js")).default;
const prescriptionRoutes = (await import("./routes/Hospital/prescription.routes.js")).default;
const commanRoutes = (await import("./routes/Hospital/comman.routes.js")).default;

app.use("/api", fileRoute);
app.use("/api/chat", messageRoutes);
app.use("/api/auth", authRoutes);
app.use("/api/hospital", hospitalRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/location", locationRoutes);
app.use("/api/hospital-staff", staffRoutes);
app.use("/api/hospital-doctor", doctorRoutes);
app.use("/api/patients", patientRoutes);
app.use("/api/hospital/departments", departmentRoutes);
app.use("/api/bed", bedRoutes);
app.use("/api/prescription", prescriptionRoutes);
app.use("/api/comman", commanRoutes);



server.listen(process.env.PORT, () => {
    console.log("Start")
})
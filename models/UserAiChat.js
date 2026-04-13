import mongoose from "mongoose";

const UserAiChatSchema = new mongoose.Schema(
    {
        // Unique ID like: PAT-CHR-0001
        customId: {
            type: String,
        },
        audience: {
            type: String,
            enum: ["patient", "doctor", "admin"],
            default: "patient"
        },
        question: {
            type: String,
        },
        file: String,
        audio: String,
        responseId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "HealthKnowledge",
        },
        doctorResponseId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "DoctorAiChat",
        },
        pharResponseId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "PharAiChat",
        },
        labResponseId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "LabAiChat",
        },
        userId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true
        },

        // patient / doctor / admin (future use)
        audience: {
            type: String,
            enum: ["patient", "doctor", "admin","pharmacy","lab"],
            default: "patient",
            index: true,
        },
        chatSessionId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "ChatSession",
            required: true
        }



    },
    {
        timestamps: true, // createdAt, updatedAt
    }
);
UserAiChatSchema.pre("save", async function (next) {
    if (this.customId) return next();

    try {
        while (true) {
            const id = Math.floor(100000 + Math.random() * 900000).toString();
            const exists = await this.constructor.findOne({ customId: id });
            if (!exists) {
                this.customId = id;
                break;
            }
        }
        next();
    } catch (err) {
        next(err);
    }
});
const UserAiChat = mongoose.model("UserAiChat", UserAiChatSchema);
export default UserAiChat

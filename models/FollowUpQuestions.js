import mongoose from "mongoose";

const questionSchema = new mongoose.Schema(
    {
        // Unique ID like: PAT-CHR-0001
        customId: {
            type: String,
        },
        question: {
            type: String,
        },
        summary: {
            type: String,
        },

        follow_up_questions: [String],
        userId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true
        },
        // patient / doctor / admin (future use)
        audience: {
            type: String,
            enum: ["patient", "doctor", "admin"],
            default: "patient",
            index: true,
        },

    },
    {
        timestamps: true, // createdAt, updatedAt
    }
);
questionSchema.pre("save", async function (next) {
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
const FollowUpQuestion = mongoose.model("followUpQuestion", questionSchema);
export default FollowUpQuestion

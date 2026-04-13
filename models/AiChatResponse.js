import mongoose from "mongoose";

const HealthKnowledgeSchema = new mongoose.Schema(
    {
        customId: {
            type: String,
        },

        defination: {
            type: String,
        },
        // All possible patient queries
        commonCauses: [String],
        seriousCauses: [String],
        whenToSeekHelp: [String],
        generalNextSteps: [String],
        medicalBoundaryNote: String,
        openai_raw_response: {
            type: Object,
            default: null,
        },
        followUpQuestions: [String],
        summary: String,
        generatedFor: {
            type: String,
            enum: ['detailAnswer', 'followUp'], default: 'followUp'
        }

    },
    {
        timestamps: true, // createdAt, updatedAt
    }
);
HealthKnowledgeSchema.pre("save", async function (next) {
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
const HealthKnowledge = mongoose.model("HealthKnowledge", HealthKnowledgeSchema);
export default HealthKnowledge

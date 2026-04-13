import mongoose from "mongoose";

const aiSchema = new mongoose.Schema(
    {
        // Unique ID like: PAT-CHR-0001
        customId: {
            type: String,
        },
        clinicalSummary: {
            type: String,
        },
        redFlags:[String],

        recommendedInvestigations:[String],
        possibleTreatmentClasses:[String],
        specialistReferral:String,    
        openai_raw_response: {
            type: Object,
            default: null,
        },
        followUpQuestions: [String],
        summary:String,
        generatedFor:{
            type:String,
            enum:['detailAnswer','followUp'],default:'followUp'
        }
       
    },
    {
        timestamps: true, // createdAt, updatedAt
    }
);
aiSchema.pre("save", async function (next) {
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
const DoctorAiChat = mongoose.model("DoctorAiChat", aiSchema);
export default DoctorAiChat

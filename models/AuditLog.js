
import mongoose, { Schema } from "mongoose";

const auditLogSchema = new Schema({
    // ── Actor (who did it) ────────────────────────────────────────────
    actorId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },

    // ── Organization context ─────────────────────────────────────────
    orgId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
    panel: { type: String, enum: ["hospital", "pharmacy", "lab", "doctor"], required: true },

    method: { type: String, enum: ["POST", "GET", "PUT", "DELETE"] },

    shortDesc: { type: String },
    description: { type: String },
    customId: String

}, { timestamps: true });

auditLogSchema.pre("save", async function (next) {
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
const AuditLog = mongoose.model("AuditLog", auditLogSchema);
export default AuditLog


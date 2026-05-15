import mongoose, { Schema } from "mongoose";

const labSchema = new Schema({
    customId: String,
    appointmentId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'lab-appointment',
        required: true
    },
    patientId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User', required: true
    },
    labId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User', required: true
    },
    testId: {
        type: mongoose.Schema.Types.ObjectId,
<<<<<<< HEAD
        ref: 'Test', required: true
=======
        ref: 'Test', 
>>>>>>> b713c835766befb4237882bf56579e2ed72947be
    },
    forTestId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'SubTestCat', required: true
    },
    sampleContainer:{
        type:String,
        required:true
    },
    condition:String,
    resultExpected:String,
    storageDetail:String,
}, { timestamps: true })
labSchema.pre("save", async function (next) {
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

const LabSample = mongoose.model('lab-sample', labSchema)
export default LabSample
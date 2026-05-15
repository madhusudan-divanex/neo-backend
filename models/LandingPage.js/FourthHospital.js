import mongoose, { Schema } from "mongoose";

const firstLabSchema = new Schema({
    security:{

        title: String,
        description: String,
        btnLink: { first: String, second: String },
        feature: [{ title: String, subTitle: String, detail: String }],
    },
    interoperability: {
        title: String,
        description: String,
        feature: [{ title: String, subTitle: String, detail: String }],
        migrationDesc:String,
        btnLink:String
    },
    deployment: {
        title: String,
        description: String,
        feature: [{ title: String, subTitle: String, detail: String }],
    }
}, { timestamps: true })
const FourthHospital = mongoose.model('fourth-hospital-page', firstLabSchema)
export default FourthHospital;
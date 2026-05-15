import mongoose, { Schema } from "mongoose";

const fourthLabSchema = new Schema({
    compliance: {
        title: String,
        description: String,
        feature: [{
            name: String,
            description: String
        }]

    },
    readiness: {
        title: String,
        description: String,
        btnLink:{first:String,second:String},
        feature: [String]
    }

}, { timestamps: true })
const FourthMain = mongoose.model('fourth-main-page', fourthLabSchema)
export default FourthMain;
import mongoose, { Schema } from "mongoose";

const certSchema=new Schema({
    patientId:{
        type: Schema.Types.ObjectId,
        ref: "User",
        required: true
    },
    doctorId:{
        type: Schema.Types.ObjectId,
        ref: "User",
        required: true
    },
    hospitalId:{
        type: Schema.Types.ObjectId,
        ref: "User"
    },
    age: Number,
    gender: String,
    examinDate: Date,
    effectiveDate: Date,
    followUpdate: Date,
    customId:String,
    condition: String,
    status:{
        type: String,
        enum: ["active", "expired"],
        default: "active"
    }
},{timestamps:true})
certSchema.pre("save", async function (next) {
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
const FitnessCertificate=mongoose.model("FitnessCertificate",certSchema)
export default FitnessCertificate;
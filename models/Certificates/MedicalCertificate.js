import mongoose, { Schema } from "mongoose";
import { generateCustomId } from "../../controller/certificateController.js";

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
    admitDate: Date,
    dischargeDate: Date,
    rest:{
        from: Date,
        to: Date
    },
    diagnosis: String,
    customId:String,
    type:{
      type:String,
      enum:['doctor','hospital']
    },
    status:{
        type: String,
        enum: ["active", "expired"],
        default: "active"
    }
},{timestamps:true})
certSchema.pre("save", async function (next) {
  if (this.customId) return next();

  try {
    this.customId = await generateCustomId("medical");
    next();
  } catch (err) {
    next(err);
  }
});
const MedicalCertificate=mongoose.model("MedicalCertificate",certSchema)
export default MedicalCertificate;
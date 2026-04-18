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
    admitDate: Date,
    dischargeDate: Date,
    rest:{
        from: Date,
        to: Date
    },
    diagnosis: String,
    customId:String,
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
const MedicalCertificate=mongoose.model("MedicalCertificate",certSchema)
export default MedicalCertificate;
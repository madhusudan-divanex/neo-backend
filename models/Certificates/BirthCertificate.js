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
        ref: "User",
    },
    childName: {type: String, required: true},
    deliveryType: {type:String,enum:['normal','cesarean'],required:true},
    birthWeight: {type:String,required:true},
    dateOfBirth: {type: Date, required: true},
    fatherName: {type:String,required:true},
    motherName: {type:String,required:true},
    attendingDoctor: {type:String,required:true},
    gender: {type:String,required:true},
},{timestamps:true})
certSchema.pre("save", async function (next) {
  if (this.customId) return next();

  try {
    this.customId = await generateCustomId("birth");
    next();
  } catch (err) {
    next(err);
  }
});
const BirthCertificate=mongoose.model("BirthCertificate",certSchema)
export default BirthCertificate;
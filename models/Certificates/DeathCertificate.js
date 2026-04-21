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
    fullName: {type: String, required: true},
    gender: {type: String, required: true},
    ageAtDeath: {type: Number, required: true},
    placeOfDeath: {type: String, required: true},
    nextOfKin: {name:String,relation:String},
    dateOfDeath: {type: Date, required: true},
    causeOfDeath: {type: String, required: true},
    attendingDoctor: {type: String, required: true},
},{timestamps:true})
certSchema.pre("save", async function (next) {
  if (this.customId) return next();

  try {
    this.customId = await generateCustomId("death");
    next();
  } catch (err) {
    next(err);
  }
});
const DeathCertificate=mongoose.model("DeathCertificate",certSchema)
export default DeathCertificate;
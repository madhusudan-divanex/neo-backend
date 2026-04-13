import mongoose, { Schema } from "mongoose";

const socialSchema = new Schema({
  facebook: { type: String, default: "" },
  instagram: { type: String, default: "" },
  youtube: { type: String, default: "" },
  twitter: { type: String, default: "" }, // X
  linkedin: { type: String, default: "" },
  email:String,
  address:String,
  contactNumber:String
});

const SocialLinks = mongoose.model("social-links", socialSchema);

export default SocialLinks;
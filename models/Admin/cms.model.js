import mongoose from "mongoose";

const cmsSchema = new mongoose.Schema({
  slug: {
    type: String,
    required: true,
  },
  panel:{type:String,enum:['website','pharmacy','patient','doctor','hospital','lab'],default:'website'},
  title: String,
  content: String
}, { timestamps: true });

export default mongoose.model("CMS", cmsSchema);

import mongoose, { Schema } from "mongoose";

const blogSchema = new Schema({
  title:       { type: String, required: true, trim: true },
  slug:        { type: String, unique: true, sparse: true },
  description: { type: String, required: true },
  content:     { type: String },
  image:       { type: String },
  category:    { type: String, default: "Health" },
  tags:        [String],
  author:      { type: String, default: "NeoHealth" },
  authorId:    { type: mongoose.Schema.Types.ObjectId, ref: "Admin" },
  status:      { type: String, enum: ["draft", "published"], default: "published" },
  views:       { type: Number, default: 0 }
}, { timestamps: true });

// Auto-generate slug
blogSchema.pre("save", function (next) {
  if (!this.slug && this.title) {
    this.slug = this.title.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
  }
  next();
});

export default mongoose.model("Blog", blogSchema);

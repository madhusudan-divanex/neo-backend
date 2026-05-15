import mongoose from "mongoose";

const StatSchema = new mongoose.Schema({
  label: String,
  value: String
}, { _id: false });

const CardSchema = new mongoose.Schema({
  title: String,
  description: String,
  points: [String],
  icon: String
}, { _id: false });

const HeroSchema = new mongoose.Schema({
  title: String,
  subtitle: String,
  description: String,
  ctaText: String,
  ctaLink: String,
  image: String,
  stats: [StatSchema]
}, { _id: false });

const CTASchema = new mongoose.Schema({
  title: String,
  subtitle: String,
  buttonText: String,
  buttonLink: String
}, { _id: false });

const FooterLinkSchema = new mongoose.Schema({
  label: String,
  url: String
}, { _id: false });

const FooterColumnSchema = new mongoose.Schema({
  title: String,
  links: [FooterLinkSchema]
}, { _id: false });

const LandingPageSchema = new mongoose.Schema({

  // doctor / hospital / lab / pharmacy
  type: {
    type: String,
    enum: ["doctor", "hospital", "lab", "pharmacy"],
    required: true,
    unique: true
  },

  hero: HeroSchema,

  capabilities: [CardSchema],

  modules: [CardSchema],

  trustFeatures: [CardSchema],

  cta: CTASchema,

  footer: [FooterColumnSchema],

  isActive: {
    type: Boolean,
    default: true
  }

}, { timestamps: true });

export default mongoose.model("LandingPage", LandingPageSchema);
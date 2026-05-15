import mongoose from "mongoose";

const CountrySchema = new mongoose.Schema({
  name: String,
  isoCode: { type: String, index: true },
  phonecode: String,
  currency: String,
  latitude: String,
  longitude: String
});

export default mongoose.model("Country", CountrySchema);

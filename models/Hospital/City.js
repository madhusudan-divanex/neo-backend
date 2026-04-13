import mongoose from "mongoose";

const CitySchema = new mongoose.Schema({
  name: String,
  stateCode: { type: String, index: true },
  countryCode: { type: String, index: true },
  latitude: String,
  longitude: String
});

export default mongoose.model("City", CitySchema);

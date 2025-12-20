import mongoose from 'mongoose';

const StateSchema = new mongoose.Schema({
  name: String,
  isoCode: { type: String, index: true },
  countryCode: { type: String, index: true },
  latitude: String,
  longitude: String
});

const State = mongoose.model("State", StateSchema);
export default State

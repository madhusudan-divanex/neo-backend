import Country from "../../models/Hospital/Country.js";
import State from "../../models/Hospital/State.js";
import City from "../../models/Hospital/City.js";

// Get all countries
const getCountries = async (req, res) => {
  try {
    const countries = await Country.find().sort({ name: 1 });
    res.json(countries);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Get states by countryCode
const getStates = async (req, res) => {
  try {
    const { countryCode } = req.params;
    const states = await State.find({ countryCode }).sort({ name: 1 });
    res.json(states);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Get cities by stateCode
const getCities = async (req, res) => {
  try {
    const { stateCode } = req.params;
    const cities = await City.find({ stateCode }).sort({ name: 1 });
    res.json(cities);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

export {getCountries,getStates,getCities}
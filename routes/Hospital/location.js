import express from "express";
const locations = express.Router();
import {
  getCountries,
  getStates,
  getCities
} from "../../controller/Hospital/location.controller.js";

locations.get("/countries", getCountries);
locations.get("/states/:countryCode", getStates);
locations.get("/cities/:stateCode", getCities);

export default locations;

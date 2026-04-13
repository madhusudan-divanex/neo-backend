import express from "express";

import {
  getCountries,
  getStates,
  getCities
} from "../../controller/Hospital/location.controller.js";

const router = express.Router();

router.get("/countries", getCountries);
router.get("/states/:countryCode", getStates);
router.get("/cities/:stateCode", getCities);

export default router;

import express from "express";
import {
  getCountries,
  addCountry,
  updateCountry,
  deleteCountry,

  getStates,
  addState,
  updateState,
  deleteState,

  getCities,
  addCity,
  updateCity,
  deleteCity,
} from "../../controller/Admin/location.controller.js";

const router = express.Router();

/* ===== COUNTRY ===== */

router.get("/countries", getCountries);
router.post("/countries", addCountry);
router.put("/countries/:id", updateCountry);
router.delete("/countries/:id", deleteCountry);

/* ===== STATE ===== */

router.get("/states", getStates);
router.post("/states", addState);
router.put("/states/:id", updateState);
router.delete("/states/:id", deleteState);

/* ===== CITY ===== */

router.get("/cities", getCities);
router.post("/cities", addCity);
router.put("/cities/:id", updateCity);
router.delete("/cities/:id", deleteCity);

export default router;
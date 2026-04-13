import "../config/dbConfig.js";

import { Country, State, City } from "country-state-city";
// import StateModal from "../models/Hospital/State.js";
// import CountryModal from "../models/Hospital/Country.js";
// import CityModal from "../models/Hospital/City.js";

async function seed() {
  try {
    console.log("Seeding started...");

    // Clean old data
    // await Country.deleteMany({});
    // await State.deleteMany({});
    // await City.deleteMany({});

    // Seed Countries
    const countries = Country.getAllCountries();
    await CountryModal.insertMany(countries);
    console.log("Countries inserted:", countries.length);

    // Seed States
    const states = State.getAllStates();
    await StateModal.insertMany(states);
    console.log("States inserted:", states.length);

    // Seed Cities
    const cities = City.getAllCities();
    await CityModal.insertMany(cities);
    console.log("Cities inserted:", cities.length);

    console.log("✅ Seeding completed");
    process.exit();
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
}

// seed();

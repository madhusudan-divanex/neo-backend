import Country from "../../models/Hospital/Country.js";
import State from "../../models/Hospital/State.js";
import City from "../../models/Hospital/City.js";

/* =========================================
   COMMON PAGINATION UTILITY
========================================= */

const getPagination = (req) => {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 10;
  const skip = (page - 1) * limit;

  return { page, limit, skip };
};

/* =========================================
   COUNTRY
========================================= */

/* GET COUNTRIES */
export const getCountries = async (req, res) => {
  try {
    const { page, limit, skip } = getPagination(req);
    const search = req.query.search || "";

    const filter = {};

    if (search) {
      filter.name = { $regex: search, $options: "i" };
    }

    const [data, total] = await Promise.all([
      Country.find(filter).sort({ name: 1 }).skip(skip).limit(limit),
      Country.countDocuments(filter),
    ]);

    res.json({
      success: true,
      data,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    });

  } catch {
    res.status(500).json({ success: false, message: "Failed to load countries" });
  }
};

/* ADD COUNTRY */
export const addCountry = async (req, res) => {
  try {
    const data = await Country.create(req.body);

    res.json({ success: true, message: "Country added", data });

  } catch {
    res.status(500).json({ success: false, message: "Failed to add country" });
  }
};

/* UPDATE COUNTRY */
export const updateCountry = async (req, res) => {
  try {
    const data = await Country.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true }
    );

    res.json({ success: true, message: "Country updated", data });

  } catch {
    res.status(500).json({ success: false, message: "Update failed" });
  }
};

/* DELETE COUNTRY */
export const deleteCountry = async (req, res) => {
  try {
    await Country.findByIdAndDelete(req.params.id);

    res.json({ success: true, message: "Country deleted" });

  } catch {
    res.status(500).json({ success: false, message: "Delete failed" });
  }
};

/* =========================================
   STATE
========================================= */

/* GET STATES */
export const getStates = async (req, res) => {
  try {
    const { page, limit, skip } = getPagination(req);

    const search = req.query.search || "";
    const countryCode = req.query.countryCode;

    const filter = {};

    if (countryCode) filter.countryCode = countryCode;

    if (search) filter.name = { $regex: search, $options: "i" };

    const [data, total] = await Promise.all([
      State.find(filter).sort({ name: 1 }).skip(skip).limit(limit),
      State.countDocuments(filter),
    ]);

    res.json({
      success: true,
      data,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    });

  } catch {
    res.status(500).json({ success: false, message: "Failed to load states" });
  }
};

/* ADD STATE */
export const addState = async (req, res) => {
  try {
    const data = await State.create(req.body);

    res.json({ success: true, message: "State added", data });

  } catch {
    res.status(500).json({ success: false, message: "Failed to add state" });
  }
};

/* UPDATE STATE */
export const updateState = async (req, res) => {
  try {
    const data = await State.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true }
    );

    res.json({ success: true, message: "State updated", data });

  } catch {
    res.status(500).json({ success: false, message: "Update failed" });
  }
};

/* DELETE STATE */
export const deleteState = async (req, res) => {
  try {
    await State.findByIdAndDelete(req.params.id);

    res.json({ success: true, message: "State deleted" });

  } catch {
    res.status(500).json({ success: false, message: "Delete failed" });
  }
};

/* =========================================
   CITY
========================================= */

/* GET CITIES */
export const getCities = async (req, res) => {
  try {
    const { page, limit, skip } = getPagination(req);

    const search = req.query.search || "";
    const stateCode = req.query.stateCode;
    const countryCode = req.query.countryCode;

    const filter = {};

    if (stateCode) filter.stateCode = stateCode;
    if (countryCode) filter.countryCode = countryCode;
    if (search) filter.name = { $regex: search, $options: "i" };

    const [data, total] = await Promise.all([
      City.find(filter).sort({ name: 1 }).skip(skip).limit(limit),
      City.countDocuments(filter),
    ]);

    res.json({
      success: true,
      data,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    });

  } catch {
    res.status(500).json({ success: false, message: "Failed to load cities" });
  }
};

/* ADD CITY */
export const addCity = async (req, res) => {
  try {
    const data = await City.create(req.body);

    res.json({ success: true, message: "City added", data });

  } catch {
    res.status(500).json({ success: false, message: "Failed to add city" });
  }
};

/* UPDATE CITY */
export const updateCity = async (req, res) => {
  try {
    const data = await City.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true }
    );

    res.json({ success: true, message: "City updated", data });

  } catch {
    res.status(500).json({ success: false, message: "Update failed" });
  }
};

/* DELETE CITY */
export const deleteCity = async (req, res) => {
  try {
    await City.findByIdAndDelete(req.params.id);

    res.json({ success: true, message: "City deleted" });

  } catch {
    res.status(500).json({ success: false, message: "Delete failed" });
  }
};
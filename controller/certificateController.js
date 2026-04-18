import BirthCertificate from "../models/Certificates/BirthCertificate.js";
import DeathCertificate from "../models/Certificates/DeathCertificate.js";
import FitnessCertificate from "../models/Certificates/FitnessCertificate.js";
import MedicalCertificate from "../models/Certificates/MedicalCertificate.js";
import { validateUsers } from "../utils/globalFunction.js";


export const createDeathCertificate = async (req, res) => {
  try {
    const {
      patientId,
      doctorId,
      hospitalId,
      fullName,
      gender,
      ageAtDeath,
      placeOfDeath,
      nextOfKin,
      dateOfDeath,
      causeOfDeath,
      attendingDoctor
    } = req.body;

    // Basic validation
    if (!patientId || !doctorId || !fullName || !gender || !ageAtDeath || !placeOfDeath || !dateOfDeath || !causeOfDeath || !attendingDoctor) {
      return res.status(400).json({ message: "All required fields must be provided" });
    }

    await validateUsers(patientId, doctorId, hospitalId);

    const cert = await DeathCertificate.create(req.body);

    res.status(201).json(cert);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
export const getAllDeathCertificates = async (req, res) => {
  try {
    const data = await DeathCertificate.find()
      .populate("patientId doctorId hospitalId");

    res.status(200).json(data);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

export const createBirthCertificate = async (req, res) => {
  try {
    const {
      patientId,
      doctorId,
      hospitalId,
      childName,
      deliveryType,
      birthWeight,
      dateOfBirth,
      fatherName,
      motherName,
      attendingDoctor,
      gender
    } = req.body;

    if (!patientId || !doctorId || !childName || !deliveryType || !birthWeight || !dateOfBirth || !fatherName || !motherName || !attendingDoctor || !gender) {
      return res.status(400).json({ message: "All required fields must be provided" });
    }

    await validateUsers(patientId, doctorId, hospitalId);

    const cert = await BirthCertificate.create(req.body);

    res.status(201).json(cert);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
export const getAllBirthCertificates = async (req, res) => {
  try {
    const data = await BirthCertificate.find()
      .populate("patientId doctorId hospitalId");

    res.status(200).json(data);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

export const createFitnessCertificate = async (req, res) => {
  try {
    const { patientId, doctorId, hospitalId } = req.body;

    if (!patientId || !doctorId) {
      return res.status(400).json({ message: "Patient and Doctor are required" });
    }

    await validateUsers(patientId, doctorId, hospitalId);

    const cert = await FitnessCertificate.create(req.body);

    res.status(201).json(cert);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
export const getAllFitnessCertificates = async (req, res) => {
  try {
    const data = await FitnessCertificate.find()
      .populate("patientId doctorId hospitalId");

    res.status(200).json(data);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

export const createMedicalCertificate = async (req, res) => {
  try {
    const { patientId, doctorId, hospitalId } = req.body;

    if (!patientId || !doctorId) {
      return res.status(400).json({ message: "Patient and Doctor are required" });
    }

    await validateUsers(patientId, doctorId, hospitalId);

    const cert = await MedicalCertificate.create(req.body);

    res.status(201).json(cert);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};  
export const getAllMedicalCertificates = async (req, res) => {
  try {
    const data = await MedicalCertificate.find()
      .populate("patientId doctorId hospitalId");

    res.status(200).json(data);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
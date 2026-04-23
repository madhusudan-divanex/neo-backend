import BirthCertificate from "../models/Certificates/BirthCertificate.js";
import CertCounter from "../models/Certificates/CertCounter.js";
import DeathCertificate from "../models/Certificates/DeathCertificate.js";
import FitnessCertificate from "../models/Certificates/FitnessCertificate.js";
import MedicalCertificate from "../models/Certificates/MedicalCertificate.js";
import DoctorAbout from "../models/Doctor/addressAbout.model.js";
import Doctor from "../models/Doctor/doctor.model.js";
import MedicalLicense from "../models/Doctor/medicalLicense.model.js";
import HospitalAddress from "../models/Hospital/HospitalAddress.js";
import HospitalBasic from "../models/Hospital/HospitalBasic.js";
import HospitalCertificate from "../models/Hospital/HospitalCertificate.js";
import User from "../models/Hospital/User.js";
import StaffEmployement from "../models/Staff/StaffEmployement.js";
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
      timeOfDeath,
      type
    } = req.body;

    // Basic validation
    if (!timeOfDeath || !doctorId || !fullName || !gender || !ageAtDeath || !placeOfDeath || !dateOfDeath || !causeOfDeath || !doctorId) {
      return res.status(400).json({ message: "All required fields must be provided" });
    }
    ['patientId'].forEach(field => {
      if (!req.body[field]) delete req.body[field];
    });

    if (type == "hospital") {
      const doctor = await User.findOne({ nh12: doctorId, role: 'doctor' });
      if (!doctor) throw new Error("Doctor not found");
      const staffEmp = await StaffEmployement.findOne({ userId: doctor?.id, organizationId: req.user.userId, status: 'active' })
      if (!staffEmp) {
        return res.status(404).json({ message: "Doctor is not staff of hospital", success: false })
      }
      let data = { ...req.body, doctorId: doctor?._id, hospitalId: req.user.userId }
      if (req.body.patientId) {
        const isPatient = await User.findOne({ nh12: req.body.patientId, role: "patient" })
        if (!isPatient) {
          return res.status(404).json({ message: "Death Person id not found", success: false })
        }
        data.patientId = isPatient?._id
      }
      const cert = await DeathCertificate.create(data);

      res.status(201).json({ cert, success: true });
    } else if (type == "doctor") {
      let data = { ...req.body, doctorId: req.user.userId }
      if (req.body.patientId) {
        const isPatient = await User.findOne({ nh12: req.body.patientId, role: "patient" })
        if (!isPatient) {
          return res.status(404).json({ message: "Death Person id not found", success: false })
        }
        data.patientId = isPatient?._id
      }
      const cert=await DeathCertificate.create(data)
      res.status(201).json({ cert, success: true });
    }
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
export const getAllDeathCertificates = async (req, res) => {
  const userId = req.user.id || req.user.userId;
  const { type, limit = 10, page = 1, search, date } = req.query;

  try {
    const user = await User.findById(userId);

    const pageNumber = parseInt(page);
    const pageSize = parseInt(limit);
    const skip = (pageNumber - 1) * pageSize;

    // 🔹 Build filter
    let filter = {};
    if (user.role === "hospital") {
      filter.hospitalId = userId;
    } else {
      filter.doctorId = userId;
    }

    if (search) {
      filter.customId = search
    }
    if (date) {
      filter.dateOfDeath = date
    }
    // optional type filter
    if (type) {
      filter.type = type;
    }

    // 🔹 Query
    let query = DeathCertificate.find(filter).sort({ createdAt: -1 }).lean();
    if (user.role === "hospital") {
      query = query.populate(
        "doctorId",
        "name email nh12 contactNumber"
      );
    }

    // 🔹 Count with SAME filter
    const total = await DeathCertificate.countDocuments(filter);

    const data = await query.skip(skip).limit(pageSize);

    res.status(200).json({
      success: true,
      pagination: {
        total: 0,
        page: Number(pageNumber),
        limit: Number(limit),
        totalPages: Math.ceil(total / pageSize)
      },
      data,
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
export const getDeathCertificatesData = async (req, res) => {
  const id = req.params.id;
  try {
    const data = await DeathCertificate.findById(id).populate('doctorId patientId', 'name nh12').lean()
    if (!data) {
      return res.status(404).json({ message: "Certificate not found", success: false })
    }
    let dataToSend = { ...data }
    if (data.type == "hospital") {
      const hospital = await User.findById(data.hospitalId).select('name nh12 hospitalId email contactNumber').lean()
      const hospitalBasic = await HospitalBasic.findById(hospital.hospitalId).lean()
      const hospitalAddress = await HospitalAddress.findOne({ hospitalId: hospital?.hospitalId }).populate('country state city', 'name').lean()
      const staffEmp = await DoctorAbout.findOne({ userId: data.doctorId }).select('specialty').populate('specialty', 'name')
      dataToSend.organization = hospital
      dataToSend.nh12 = hospital.nh12;
      dataToSend.address = hospitalAddress
      dataToSend.license = hospitalBasic?.licenseId
      dataToSend.specialty = staffEmp?.specialty?.name
      return res.status(200).json({ data: dataToSend, success: true });
    }
    if (data.type == "doctor") {
      const doctor = await User.findById(data.doctorId?._id).select('name nh12 email contactNumber').lean()
      const doctorAddress = await DoctorAbout.findOne({ userId: doctor?._id }).populate('countryId stateId cityId', 'name').lean()
      dataToSend.organization = doctor
      dataToSend.nh12 = doctor.nh12;
      dataToSend.address = doctorAddress
      return res.status(200).json({ data: dataToSend, success: true });
    }

  } catch (err) {
    console.log(err)
    return res.status(500).json({ message: err.message });
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
      weight,
      dateOfBirth,
      fatherName,
      motherName, timeOfBirth,
      gender, type
    } = req.body;
    if (!doctorId || !childName || !deliveryType || !weight || !dateOfBirth || !timeOfBirth || !fatherName || !motherName || !gender) {
      return res.status(400).json({ message: "All required fields must be provided" });
    }
    ['fatherId', 'motherId', 'childId'].forEach(field => {
      if (!req.body[field]) delete req.body[field];
    });
    if (type == "hospital") {
      const doctor = await User.findOne({ nh12: doctorId, role: 'doctor' });
      if (!doctor) throw new Error("Doctor not found");
      const staffEmp = await StaffEmployement.findOne({ userId: doctor?.id, organizationId: req.user.userId, status: 'active' })
      if (!staffEmp) {
        return res.status(404).json({ message: "Doctor is not staff of hospital", success: false })
      }
      let data = { ...req.body, doctorId: doctor?._id, hospitalId: req.user.userId }
      if (req.body.fatherId) {
        const isFather = await User.findOne({ nh12: req.body.fatherId, role: "patient" })
        if (!isFather) {
          return res.status(404).json({ message: "Father id not found", success: false })
        }
        data.fatherId = isFather?._id
      }
      if (req.body.motherId) {
        const isMother = await User.findOne({ nh12: req.body.motherId, role: "patient" })
        if (!isMother) {
          return res.status(404).json({ message: "Mother id not found", success: false })
        }
        data.motherId = isMother?._id
      }
      if (req.body.childId) {
        const isChild = await User.findOne({ nh12: req.body.childId, role: "patient" })
        if (!isChild) {
          return res.status(404).json({ message: "Child id not found", success: false })
        }
        data.childId = isChild?._id
      }
      const cert = await BirthCertificate.create(data);

      res.status(201).json({ cert, success: true });
    } else if (type == "doctor") {
      let data = { ...req.body, doctorId: req.user.userId }
      if (req.body.fatherId) {
        const isFather = await User.findOne({ nh12: req.body.fatherId, role: "patient" })
        if (!isFather) {
          return res.status(404).json({ message: "Father id not found", success: false })
        }
        data.fatherId = isFather?._id
      }
      if (req.body.motherId) {
        const isMother = await User.findOne({ nh12: req.body.motherId, role: "patient" })
        if (!isMother) {
          return res.status(404).json({ message: "Mother id not found", success: false })
        }
        data.motherId = isMother?._id
      }
      if (req.body.childId) {
        const isChild = await User.findOne({ nh12: req.body.childId, role: "patient" })
        if (!isChild) {
          return res.status(404).json({ message: "Child id not found", success: false })
        }
        data.childId = isChild?._id
      }
      const cert=await BirthCertificate.create(data)
      res.status(201).json({ cert, success: true });
    }

  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
export const getAllBirthCertificates = async (req, res) => {
  const userId = req.user.id || req.user.userId;
  const { type, limit = 10, page = 1, search, date } = req.query;

  try {
    const user = await User.findById(userId);

    const pageNumber = parseInt(page);
    const pageSize = parseInt(limit);
    const skip = (pageNumber - 1) * pageSize;

    // 🔹 Build filter
    let filter = {};
    if (user.role === "hospital") {
      filter.hospitalId = userId;
    } else {
      filter.doctorId = userId;
    }
    if (search) {
      filter.customId = search
    }
    if (date) {
      filter.dateOfBirth = date
    }

    // optional type filter
    if (type) {
      filter.type = type;
    }

    // 🔹 Query
    let query = BirthCertificate.find(filter).sort({ createdAt: -1 }).lean();
    if (user.role === "hospital") {
      query = query.populate(
        "doctorId",
        "name email nh12 contactNumber"
      );
    }

    // 🔹 Count with SAME filter
    const total = await BirthCertificate.countDocuments(filter);

    const data = await query.skip(skip).limit(pageSize);

    res.status(200).json({
      success: true,
      pagination: {
        total: 0,
        page: Number(pageNumber),
        limit: Number(limit),
        totalPages: Math.ceil(total / pageSize)
      },
      data,
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
export const getBirthCertificatesData = async (req, res) => {
  const id = req.params.id;
  try {
    const data = await BirthCertificate.findById(id).populate('doctorId fatherId motherId childId', 'name nh12').lean()
    if (!data) {
      return res.status(404).json({ message: "Certificate not found", success: false })
    }
    let dataToSend = { ...data }
    if (data.type == "hospital") {
      const hospital = await User.findById(data.hospitalId).select('name nh12 hospitalId email contactNumber').lean()
      const hospitalBasic = await HospitalBasic.findById(hospital.hospitalId).lean()
      const hospitalAddress = await HospitalAddress.findOne({ hospitalId: hospital?.hospitalId }).populate('country state city', 'name').lean()
      const staffEmp = await DoctorAbout.findOne({ userId: data.doctorId }).select('specialty').populate('specialty', 'name')
      dataToSend.organization = hospital
      dataToSend.nh12 = hospital.nh12;
      dataToSend.address = hospitalAddress
      dataToSend.license = hospitalBasic?.licenseId
      dataToSend.specialty = staffEmp?.specialty?.name
      return res.status(200).json({ data: dataToSend, success: true });
    }
    if (data.type == "doctor") {
      const doctor = await User.findById(data.doctorId?._id).select('name nh12 email contactNumber').lean()
      const doctorAddress = await DoctorAbout.findOne({ userId: doctor?._id }).populate('countryId stateId cityId', 'name').lean()    
      dataToSend.organization = doctor
      dataToSend.nh12 = doctor.nh12;
      dataToSend.address = doctorAddress
      return res.status(200).json({ data: dataToSend, success: true });
    }

  } catch (err) {
    console.log(err)
    return res.status(500).json({ message: err.message });
  }
};

export const createFitnessCertificate = async (req, res) => {
  try {
    const { patientId, type, doctorId } = req.body;

    if (!patientId || !doctorId) {
      return res.status(400).json({ message: "Patient and Doctor are required" });
    }

    const patient = await User.findOne({ nh12: patientId, role: "patient" });
    if (!patient) throw new Error("Patient not found");

    if (type == "hospital") {
      const doctor = await User.findOne({ nh12: doctorId, role: 'doctor' });
      if (!doctor) throw new Error("Doctor not found");
      const staffEmp = await StaffEmployement.findOne({ userId: doctor?.id, organizationId: req.user.userId, status: 'active' })
      if (!staffEmp) {
        return res.status(404).json({ message: "Doctor is not staff of hospital", success: false })
      }
      const cert = await FitnessCertificate.create({ ...req.body, patientId: patient?._id, doctorId: doctor?._id, hospitalId: req.user.userId });

      res.status(201).json({ cert, success: true });
    } else if (type == "doctor") {
      const cert=await FitnessCertificate.create({ ...req.body, doctorId: req.user.userId, patientId: patient?._id })
      res.status(201).json({ cert, success: true });
    }
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
export const getAllFitnessCertificates = async (req, res) => {
  const userId = req.user.id || req.user.userId;
  const { type, limit = 10, page = 1, search } = req.query;

  try {
    const user = await User.findById(userId);

    const pageNumber = parseInt(page);
    const pageSize = parseInt(limit);
    const skip = (pageNumber - 1) * pageSize;

    // 🔹 Build filter
    let filter = {};
    if (user.role === "hospital") {
      filter.hospitalId = userId;
    } else {
      filter.doctorId = userId;
    }
    if (search) {
      filter.customId = search
    }

    // optional type filter
    if (type) {
      filter.type = type;
    }

    // 🔹 Query
    let query = FitnessCertificate.find(filter).sort({ createdAt: -1 }).lean();
    if (user.role === "hospital") {
      query = query.populate(
        "patientId doctorId",
        "name email nh12 contactNumber"
      );
    } else {
      query = query.populate(
        "patientId",
        "name email nh12 contactNumber"
      );
    }

    // 🔹 Count with SAME filter
    const total = await FitnessCertificate.countDocuments(filter);

    const data = await query.skip(skip).limit(pageSize);

    res.status(200).json({
      success: true,
      pagination: {
        total: 0,
        page: Number(pageNumber),
        limit: Number(limit),
        totalPages: Math.ceil(total / pageSize)
      },
      data,
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
export const getFitnessCertificatesData = async (req, res) => {
  const id = req.params.id;
  try {
    const data = await FitnessCertificate.findById(id).populate('patientId doctorId', 'name nh12').lean()
    if (!data) {
      return res.status(404).json({ message: "Certificate not found", success: false })
    }
    let dataToSend = { ...data }
    if (data.type == "hospital") {
      const hospital = await User.findById(data.hospitalId).select('name nh12 hospitalId email contactNumber').lean()
      const hospitalBasic = await HospitalBasic.findById(hospital.hospitalId).lean()
      const hospitalAddress = await HospitalAddress.findOne({ hospitalId: hospital?.hospitalId }).populate('country state city', 'name').lean()
      const staffEmp = await DoctorAbout.findOne({ userId: data.doctorId }).select('specialty').populate('specialty', 'name')
      dataToSend.organization = hospital
      dataToSend.nh12 = hospital.nh12;
      dataToSend.address = hospitalAddress
      dataToSend.license = hospitalBasic?.licenseId
      dataToSend.logo = `api/file/${hospitalBasic?.logoFileId}`
      dataToSend.specialty = staffEmp?.specialty?.name
      return res.status(200).json({ data: dataToSend, success: true });
    }
    if (data.type == "doctor") {
      const doctor = await User.findById(data.doctorId?._id).select('name nh12 email contactNumber').lean()
      const doct=await Doctor.findById(doctor?.doctorId).select('profileImage')
      const doctorAddress = await DoctorAbout.findOne({ userId: doctor?._id }).populate('countryId stateId cityId', 'name').lean()
      dataToSend.organization = doctor
      dataToSend.nh12 = doctor.nh12;
      dataToSend.logo = doct.profileImage
      dataToSend.address = doctorAddress
      return res.status(200).json({ data: dataToSend, success: true });
    }

  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
export const createMedicalCertificate = async (req, res) => {
  try {
    const { patientId, doctorId, hospitalId, type } = req.body;

    if (!patientId || !doctorId) {
      return res.status(400).json({ message: "Patient and Doctor are required" });
    }

    const patient = await User.findOne({ nh12: patientId, role: "patient" });
    if (!patient) throw new Error("Patient not found");

    if (type == "hospital") {
      const doctor = await User.findOne({ nh12: doctorId, role: 'doctor' });
      if (!doctor) throw new Error("Doctor not found");
      const staffEmp = await StaffEmployement.findOne({ userId: doctor?.id, organizationId: req.user.userId, status: 'active' })
      if (!staffEmp) {
        return res.status(404).json({ message: "Doctor is not staff of hospital", success: false })
      }
      const cert = await MedicalCertificate.create({ ...req.body, patientId: patient?._id, doctorId: doctor?._id, hospitalId: req.user.userId });

      res.status(201).json({ cert, success: true });
    } else if (type == "doctor") {
      const cert=await MedicalCertificate.create({ ...req.body, doctorId: req.user.userId, patientId: patient?._id })
      res.status(201).json({ cert, success: true });
    }

  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
export const getAllMedicalCertificates = async (req, res) => {
  const userId = req.user.id || req.user.userId;
  const { type, limit = 10, page = 1, search } = req.query;

  try {
    const user = await User.findById(userId);

    const pageNumber = parseInt(page);
    const pageSize = parseInt(limit);
    const skip = (pageNumber - 1) * pageSize;

    // 🔹 Build filter
    let filter = {};
    if (user.role === "hospital") {
      filter.hospitalId = userId;
    } else {
      filter.doctorId = userId;
    }
    if (search) {
      filter.customId = search
    }

    // optional type filter
    if (type) {
      filter.type = type;
    }

    // 🔹 Query
    let query = MedicalCertificate.find(filter).sort({ createdAt: -1 }).lean();
    if (user.role === "hospital") {
      query = query.populate(
        "patientId doctorId",
        "name email nh12 contactNumber"
      );
    } else {
      query = query.populate(
        "patientId",
        "name email nh12 contactNumber"
      );
    }

    // 🔹 Count with SAME filter
    const total = await MedicalCertificate.countDocuments(filter);

    const data = await query.skip(skip).limit(pageSize);

    res.status(200).json({
      success: true,
      pagination: {
        total: 0,
        page: Number(pageNumber),
        limit: Number(limit),
        totalPages: Math.ceil(total / pageSize)
      },
      data,
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
export const getMedicalCertificatesData = async (req, res) => {
  const id = req.params.id;
  try {
    const data = await MedicalCertificate.findById(id).populate('patientId doctorId', 'name nh12').lean()
    if (!data) {
      return res.status(404).json({ message: "Certificate not found", success: false })
    }
    let dataToSend = { ...data }
    if (data.type == "hospital") {
      const hospital = await User.findById(data.hospitalId).select('name nh12 hospitalId email contactNumber').lean()
      const hospitalBasic = await HospitalBasic.findById(hospital.hospitalId).lean()
      const hospitalAddress = await HospitalAddress.findOne({ hospitalId: hospital?.hospitalId }).populate('country state city', 'name').lean()
      const staffEmp = await DoctorAbout.findOne({ userId: data.doctorId }).select('specialty').populate('specialty', 'name')
      dataToSend.organization = hospital
      dataToSend.nh12 = hospital.nh12;
      dataToSend.address = hospitalAddress
      dataToSend.license = hospitalBasic?.licenseId
      dataToSend.specialty = staffEmp?.specialty?.name
      return res.status(200).json({ data: dataToSend, success: true });
    }
    if (data.type == "doctor") {
      const doctor = await User.findById(data.doctorId?._id).select('name nh12 email contactNumber').lean()
      const doctorAddress = await DoctorAbout.findOne({ userId: doctor?._id }).populate('countryId stateId cityId', 'name').lean()
      dataToSend.organization = doctor
      dataToSend.nh12 = doctor.nh12;
      dataToSend.address = doctorAddress
      return res.status(200).json({ data: dataToSend, success: true });
    }

  } catch (err) {
    console.log(err)
    return res.status(500).json({ message: err.message });
  }
};
export const getCertificateDataByCertId = async (req, res) => {
  const customId = req.params.id
  try {
    let type;
    const isFitness = await FitnessCertificate.findOne({ customId }).populate('patientId doctorId', 'name nh12').lean()
    if (isFitness) {
      type = "fitness"
      let dataToSend = { ...isFitness }
      const data=isFitness
      if (data.type == "hospital") {
        const hospital = await User.findById(data.hospitalId).select('name nh12 hospitalId email contactNumber').lean()
        const hospitalBasic = await HospitalBasic.findById(hospital.hospitalId).lean()
        const hospitalAddress = await HospitalAddress.findOne({ hospitalId: hospital?.hospitalId }).populate('country state city', 'name').lean()
        const staffEmp = await DoctorAbout.findOne({ userId: data.doctorId }).select('specialty').populate('specialty', 'name')
        dataToSend.organization = {...hospital,logo:hospitalBasic?.logoFileId?`api/file/${hospitalBasic?.logoFileId}`:null}
        dataToSend.nh12 = hospital.nh12;
        dataToSend.address = hospitalAddress
        dataToSend.license = hospitalBasic?.licenseId
        dataToSend.specialty = staffEmp?.specialty?.name
        return res.status(200).json({ data: dataToSend, type, success: true });
      }
      else if (data.type == "doctor") {
        const hospital = await User.findById(data.doctorId).select('name nh12  email contactNumber').lean()
        const staffEmp = await DoctorAbout.findOne({ userId: data.doctorId }).select('countryId stateId cityId specialty').populate('countryId stateId cityId specialty', 'name')
        dataToSend.organization = hospital
        dataToSend.nh12 = hospital.nh12;
        dataToSend.address = {country:staffEmp?.countryId?.name,state:staffEmp?.stateId?.name,
        city:staffEmp?.cityId?.name,pinCode:staffEmp?.pinCode,fullAddress:staffEmp?.fullAddress}
        dataToSend.specialty = staffEmp?.specialty?.name
        return res.status(200).json({ data: dataToSend, type, success: true });
      }
    }
    const isMedical = await MedicalCertificate.findOne({ customId }).populate('patientId doctorId', 'name nh12').lean()
    if (isMedical) {
      type = "medical"
      let dataToSend = { ...isMedical }
      const data=isMedical
      if (data.type == "hospital") {
        const hospital = await User.findById(data.hospitalId).select('name nh12 hospitalId email contactNumber').lean()
        const hospitalBasic = await HospitalBasic.findById(hospital.hospitalId).lean()
        const hospitalAddress = await HospitalAddress.findOne({ hospitalId: hospital?.hospitalId }).populate('country state city', 'name').lean()
        const staffEmp = await DoctorAbout.findOne({ userId: data.doctorId }).select('specialty').populate('specialty', 'name')
        dataToSend.organization = {...hospital,logo:hospitalBasic?.logoFileId?`api/file/${hospitalBasic?.logoFileId}`:null}
        dataToSend.nh12 = hospital.nh12;
        dataToSend.address = hospitalAddress
        dataToSend.license = hospitalBasic?.licenseId
        dataToSend.specialty = staffEmp?.specialty?.name
        return res.status(200).json({ data: dataToSend, type, success: true });
      }
      else if (data.type == "doctor") {
        const hospital = await User.findById(data.doctorId).select('name nh12  email contactNumber').lean()
        const staffEmp = await DoctorAbout.findOne({ userId: data.doctorId }).select('countryId stateId cityId specialty').populate('countryId stateId cityIdspecialty', 'name')
        dataToSend.organization = hospital
        dataToSend.nh12 = hospital.nh12;
        dataToSend.address = {country:staffEmp?.countryId?.name,state:staffEmp?.stateId?.name,
        city:staffEmp?.cityId?.name,pinCode:staffEmp?.pinCode,fullAddress:staffEmp?.fullAddress}
        dataToSend.specialty = staffEmp?.specialty?.name
        return res.status(200).json({ data: dataToSend, type, success: true });
      }
    }
    const isBirth = await BirthCertificate.findOne({ customId }).populate('doctorId fatherId motherId childId', 'name nh12').lean()
    if (isBirth) {
      type = "birth"
      let dataToSend = { ...isBirth }
      const data=isBirth
      if (data.type == "hospital") {
        const hospital = await User.findById(data.hospitalId).select('name nh12 hospitalId email contactNumber').lean()
        const hospitalBasic = await HospitalBasic.findById(hospital.hospitalId).lean()
        const hospitalAddress = await HospitalAddress.findOne({ hospitalId: hospital?.hospitalId }).populate('country state city', 'name').lean()
        const staffEmp = await DoctorAbout.findOne({ userId: data.doctorId }).select('specialty').populate('specialty', 'name')
        dataToSend.organization = {...hospital,logo:hospitalBasic?.logoFileId?`api/file/${hospitalBasic?.logoFileId}`:null}
        dataToSend.nh12 = hospital.nh12;
        dataToSend.address = hospitalAddress
        dataToSend.license = hospitalBasic?.licenseId
        dataToSend.specialty = staffEmp?.specialty?.name
        return res.status(200).json({ data: dataToSend, type, success: true });
      }
      else if (data.type == "doctor") {
        const hospital = await User.findById(data.doctorId).select('name nh12 email contactNumber').lean()
        const staffEmp = await DoctorAbout.findOne({ userId: data.doctorId }).select('countryId stateId cityId specialty').populate('countryId stateId cityId specialty', 'name')
        dataToSend.organization = hospital
        dataToSend.nh12 = hospital.nh12;
        dataToSend.address = {country:staffEmp?.countryId?.name,state:staffEmp?.stateId?.name,
        city:staffEmp?.cityId?.name,pinCode:staffEmp?.pinCode,fullAddress:staffEmp?.fullAddress}
        dataToSend.specialty = staffEmp?.specialty?.name
        return res.status(200).json({ data: dataToSend, type, success: true });
      }
    }
    const isDeath = await DeathCertificate.findOne({ customId }).populate('doctorId patientId', 'name nh12').lean()
    if (isDeath) {
      type = "death"
      let dataToSend = { ...isDeath }
      const data=isDeath
      if (data.type == "hospital") {
        const hospital = await User.findById(data.hospitalId).select('name nh12 hospitalId email contactNumber').lean()
        const hospitalBasic = await HospitalBasic.findById(hospital.hospitalId).lean()
        const hospitalAddress = await HospitalAddress.findOne({ hospitalId: hospital?.hospitalId }).populate('country state city', 'name').lean()
        const staffEmp = await DoctorAbout.findOne({ userId: data.doctorId }).select('specialty').populate('specialty', 'name')
        dataToSend.organization = {...hospital,logo:hospitalBasic?.logoFileId?`api/file/${hospitalBasic?.logoFileId}`:null}
        dataToSend.nh12 = hospital.nh12;
        dataToSend.address = hospitalAddress
        dataToSend.license = hospitalBasic?.licenseId
        dataToSend.specialty = staffEmp?.specialty?.name
        return res.status(200).json({ data: dataToSend, type, success: true });
      }
      else if (data.type == "doctor") {
        const hospital = await User.findById(data.doctorId).select('name nh12 email contactNumber').lean()
        const staffEmp = await DoctorAbout.findOne({ userId: data.doctorId }).select('countryId stateId cityId specialty').populate('countryId stateId cityId specialty', 'name')
        dataToSend.organization = hospital
        dataToSend.nh12 = hospital.nh12;
        dataToSend.address = {country:staffEmp?.countryId?.name,state:staffEmp?.stateId?.name,
        city:staffEmp?.cityId?.name,pinCode:staffEmp?.pinCode,fullAddress:staffEmp?.fullAddress}
        dataToSend.specialty = staffEmp?.specialty?.name
        return res.status(200).json({ data: dataToSend, type, success: true });
      }
    }
  } catch (error) {
    console.log(error)
    return res.status(500).json({ message: error?.message, success: false })
  }
}

const getPrefix = (type) => {
  switch (type) {
    case "fitness": return "FIT";
    case "medical": return "MC";
    case "birth": return "BIRTH";
    case "death": return "DEATH";
    default: return "GEN";
  }
};

export const generateCustomId = async (type) => {
  const now = new Date();

  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");

  const datePart = `${year}-${month}${day}`; // 2026-0420
  const prefix = getPrefix(type);

  const key = `${prefix}-${datePart}`;

  const counter = await CertCounter.findOneAndUpdate(
    { key },
    { $inc: { seq: 1 } },
    { new: true, upsert: true }
  );

  const sequence = String(counter.seq).padStart(5, "0");

  return `NHC-${prefix}-${datePart}-${sequence}`;
};
import PatientBanner from "../../models/Admin/PatientBanner.js"
import DoctorAbout from "../../models/Doctor/addressAbout.model.js"
import Speciality from "../../models/Speciality.js"
import TestCategory from "../../models/TestCategory.js"
import safeUnlink from "../../utils/globalFunction.js"
import CMS from '../../models/Admin/cms.model.js'
import BlockUser from "../../models/BlockUser.js"
import User from "../../models/Hospital/User.js"
import Patient from "../../models/Patient/patient.model.js"
import PatientDemographic from "../../models/Patient/demographic.model.js"
import Doctor from "../../models/Doctor/doctor.model.js"
import Pharmacy from "../../models/Pharmacy/pharmacy.model.js"
import PharAddress from "../../models/Pharmacy/pharmacyAddress.model.js"
import Laboratory from "../../models/Laboratory/laboratory.model.js"
import LabAddress from "../../models/Laboratory/labAddress.model.js"
import bcrypt from "bcryptjs"
import HospitalBasic from "../../models/Hospital/HospitalBasic.js"
import HospitalAddress from "../../models/Hospital/HospitalAddress.js"
import Country from "../../models/Hospital/Country.js"
import { assignNH12 } from "../../utils/nh12.js"
import HospitalCategory from "../../models/HospitalCategory.js"
import PharmacyCategory from "../../models/PharmacyCategory.js"
import PatientService from "../../models/LandingPage.js/PatientService.js"
import ScheduleMedicines from "../../models/Admin/ScheduleMedicines.js"
import Queries from "../../models/Admin/Queries.js"
import CardGenerate from "../../models/Admin/CardGenerate.js"
import SubTestCat from "../../models/SubTestCategory.js"
export const addSpecialty = async (req, res) => {
    const icon = req?.file?.path
    const { name } = req.body
    try {
        const isExist = await Speciality.findOne({ name })
        if (isExist) {
            safeUnlink(icon)
            return res.status(200).json({ message: "Name already exists", success: false })
        }
        const data = await Speciality.create({ name, icon })
        if (data) {
            return res.status(200).json({ message: "Speciality created", success: true })
        }
        return res.status(200).json({ message: "Speciality not created", success: false })
    } catch (error) {
        return res.status(200).json({ message: "Server Error", success: false })
    }
}
export const getServices = async (req, res) => {
    try {
        const isExist = await PatientService.find()
        return res.status(200).json({ message: "Service fetched", data: isExist, success: true })

    } catch (error) {
        return res.status(200).json({ message: "Server Error", success: false })
    }
}
export const getSpecialty = async (req, res) => {
    try {
        const isExist = await Speciality.find()
        return res.status(200).json({ message: "Speciality fetched", data: isExist, success: true })

    } catch (error) {
        return res.status(200).json({ message: "Server Error", success: false })
    }
}
export const updateSpecialty = async (req, res) => {
    const icon = req?.file?.path
    const { name, spId } = req.body
    try {
        const isExist = await Speciality.findOne({ name, _id: { $ne: spId } })
        if (isExist) {
            safeUnlink(icon)
            return res.status(200).json({ message: "Name already exists", success: false })
        }
        if (isExist?.icon && icon) {
            safeUnlink(isExist?.icon)
        }
        const data = await Speciality.findByIdAndUpdate(spId, { name, icon }, { new: true })
        if (data) {
            return res.status(200).json({ message: "Speciality updated", success: true })
        }
        return res.status(200).json({ message: "Speciality not updated", success: false })
    } catch (error) {
        console.log(error)
        return res.status(200).json({ message: "Server Error", success: false })
    }
}
export const deleteSpecialty = async (req, res) => {
    const { id } = req.params
    try {
        const isExist = await Speciality.findById(id)
        if (!isExist) {
            return res.status(200).json({ message: "Specialty not exists", success: false })
        }
        await DoctorAbout.updateMany(
            {
                $or: [
                    { specialty: id },
                    { treatmentAreas: id }
                ]
            },
            {
                $set: { specialty: null },
                $pull: { treatmentAreas: id }
            }
        );
        const data = await Speciality.findByIdAndDelete(id)
        if (data) {
            safeUnlink(isExist.icon)
            return res.status(200).json({ message: "Speciality deleted", success: true })
        }
        return res.status(200).json({ message: "Speciality not deleted", success: false })
    } catch (error) {
        return res.status(200).json({ message: "Server Error", success: false })
    }
}

export const addTestCategory = async (req, res) => {
    const icon = req?.file?.path
    const { name, } = req.body
    const subCat=JSON.parse(req.body.subCat)
    try {
        const isExist = await TestCategory.findOne({ name })
        if (isExist) {
            safeUnlink(icon)
            return res.status(200).json({ message: "Name already exists", success: false })
        }
        const data = await TestCategory.create({ name, icon ,subCat})
        if (data) {
            return res.status(200).json({ message: "Test category created", success: true })
        }
        return res.status(200).json({ message: "Test category not created", success: false })
    } catch (error) {
        console.log(error)
        return res.status(200).json({ message: "Server Error", success: false })
    }
}
export const getTestCategory = async (req, res) => {
    try {
        const isExist = await TestCategory.find()
        return res.status(200).json({ message: "Test category fetched", data: isExist, success: true })

    } catch (error) {
        return res.status(200).json({ message: "Server Error", success: false })
    }
}
export const updateTestCategory = async (req, res) => {
    const icon = req?.file?.path
    const { name, spId } = req.body
    const subCat=JSON.parse(req.body.subCat)
    try {
        const isExist = await TestCategory.findOne({ name, _id: { $ne: spId } })
        if (isExist) {
            safeUnlink(icon)
            return res.status(200).json({ message: "Name already exists", success: false })
        }
        if (isExist?.icon && icon) {
            safeUnlink(isExist?.icon)
        }
        const data = await TestCategory.findByIdAndUpdate(spId, { name, icon,subCat }, { new: true })
        if (data) {
            return res.status(200).json({ message: "Test category updated", success: true })
        }
        return res.status(200).json({ message: "Test category not updated", success: false })
    } catch (error) {
        console.log(error)
        return res.status(200).json({ message: "Server Error", success: false })
    }
}
export const deleteTestCategory = async (req, res) => {
    const { id } = req.params
    try {
        const isExist = await TestCategory.findById(id)
        if (!isExist) {
            return res.status(200).json({ message: "Test Category not exists", success: false })
        }

        const data = await TestCategory.findByIdAndDelete(id)
        if (data) {
            safeUnlink(isExist.icon)
            return res.status(200).json({ message: "Test category deleted", success: true })
        }
        return res.status(200).json({ message: "Test category not deleted", success: false })
    } catch (error) {
        return res.status(200).json({ message: "Server Error", success: false })
    }
}
export const addHospitalCategory = async (req, res) => {
    const icon = req?.file?.path
    const { name } = req.body
    try {
        const isExist = await HospitalCategory.findOne({ name })
        if (isExist) {
            safeUnlink(icon)
            return res.status(200).json({ message: "Name already exists", success: false })
        }
        const data = await HospitalCategory.create({ name, icon })
        if (data) {
            return res.status(200).json({ message: "Hospital category created", success: true })
        }
        return res.status(200).json({ message: "Hospital category not created", success: false })
    } catch (error) {
        console.log(error)
        return res.status(200).json({ message: "Server Error", success: false })
    }
}
export const getHospitalCategory = async (req, res) => {
    try {
        const isExist = await HospitalCategory.find()
        return res.status(200).json({ message: "Hospital category fetched", data: isExist, success: true })

    } catch (error) {
        return res.status(200).json({ message: "Server Error", success: false })
    }
}
export const updateHospitalCategory = async (req, res) => {
    const icon = req?.file?.path
    const { name, spId } = req.body
    try {
        const isExist = await HospitalCategory.findOne({ name, _id: { $ne: spId } })
        if (isExist) {
            safeUnlink(icon)
            return res.status(200).json({ message: "Name already exists", success: false })
        }
        if (isExist?.icon && icon) {
            safeUnlink(isExist?.icon)
        }
        const data = await HospitalCategory.findByIdAndUpdate(spId, { name, icon }, { new: true })
        if (data) {
            return res.status(200).json({ message: "Hospital category updated", success: true })
        }
        return res.status(200).json({ message: "Hospital category not updated", success: false })
    } catch (error) {
        console.log(error)
        return res.status(200).json({ message: "Server Error", success: false })
    }
}
export const deleteHospitalCategory = async (req, res) => {
    const { id } = req.params
    try {
        const isExist = await HospitalCategory.findById(id)
        if (!isExist) {
            return res.status(200).json({ message: "Test Category not exists", success: false })
        }

        const data = await HospitalCategory.findByIdAndDelete(id)
        if (data) {
            safeUnlink(isExist.icon)
            return res.status(200).json({ message: "Test category deleted", success: true })
        }
        return res.status(200).json({ message: "Test category not deleted", success: false })
    } catch (error) {
        return res.status(200).json({ message: "Server Error", success: false })
    }
}
export const addPharmacyCategory = async (req, res) => {
    const icon = req?.file?.path
    const { name } = req.body
    try {
        const isExist = await PharmacyCategory.findOne({ name })
        if (isExist) {
            safeUnlink(icon)
            return res.status(200).json({ message: "Name already exists", success: false })
        }
        const data = await PharmacyCategory.create({ name, icon })
        if (data) {
            return res.status(200).json({ message: "Pharmacy category created", success: true })
        }
        return res.status(200).json({ message: "Pharmacy category not created", success: false })
    } catch (error) {
        console.log(error)
        return res.status(200).json({ message: "Server Error", success: false })
    }
}
export const getPharmacyCategory = async (req, res) => {
    try {
        const isExist = await PharmacyCategory.find()
        return res.status(200).json({ message: "Pharmacy category fetched", data: isExist, success: true })

    } catch (error) {
        return res.status(200).json({ message: "Server Error", success: false })
    }
}
export const updatePharmacyCategory = async (req, res) => {
    const icon = req?.file?.path
    const { name, spId } = req.body
    try {
        const isExist = await PharmacyCategory.findOne({ name, _id: { $ne: spId } })
        if (isExist) {
            safeUnlink(icon)
            return res.status(200).json({ message: "Name already exists", success: false })
        }
        if (isExist?.icon && icon) {
            safeUnlink(isExist?.icon)
        }
        const data = await PharmacyCategory.findByIdAndUpdate(spId, { name, icon }, { new: true })
        if (data) {
            return res.status(200).json({ message: "Pharmacy category updated", success: true })
        }
        return res.status(200).json({ message: "Pharmacy category not updated", success: false })
    } catch (error) {
        console.log(error)
        return res.status(200).json({ message: "Server Error", success: false })
    }
}
export const deletePharmacyCategory = async (req, res) => {
    const { id } = req.params
    try {
        const isExist = await PharmacyCategory.findById(id)
        if (!isExist) {
            return res.status(200).json({ message: "Pharmacy Category not exists", success: false })
        }

        const data = await PharmacyCategory.findByIdAndDelete(id)
        if (data) {
            safeUnlink(isExist.icon)
            return res.status(200).json({ message: "Pharmacy category deleted", success: true })
        }
        return res.status(200).json({ message: "Pharmacy category not deleted", success: false })
    } catch (error) {
        return res.status(200).json({ message: "Server Error", success: false })
    }
}

export const addPatientBanner = async (req, res) => {
    const image = req?.file?.path
    try {

        const data = await PatientBanner.create({ image })
        if (data) {
            return res.status(200).json({ message: "Patient Banner created", success: true })
        }
        return res.status(200).json({ message: "Patient Banner not created", success: false })
    } catch (error) {
        console.log(error)
        return res.status(200).json({ message: "Server Error", success: false })
    }
}
export const getPatientBanner = async (req, res) => {
    try {
        const isExist = await PatientBanner.find()
        return res.status(200).json({ message: "Patient Banner fetched", data: isExist, success: true })

    } catch (error) {
        return res.status(200).json({ message: "Server Error", success: false })
    }
}
export const updatePatientBanner = async (req, res) => {
    const image = req?.file?.path
    const { spId } = req.body
    try {
        const isExist = await PatientBanner.findById(spId)

        if (isExist?.image && image) {
            safeUnlink(isExist?.image)
        }
        const data = await PatientBanner.findByIdAndUpdate(spId, { image }, { new: true })
        if (data) {
            return res.status(200).json({ message: "Patient Banner updated", success: true })
        }
        return res.status(200).json({ message: "Patient Banner not updated", success: false })
    } catch (error) {
        console.log(error)
        return res.status(200).json({ message: "Server Error", success: false })
    }
}
export const deletePatientBanner = async (req, res) => {
    const { id } = req.params
    try {
        const isExist = await PatientBanner.findById(id)
        if (!isExist) {
            return res.status(200).json({ message: "Patient Banner not exists", success: false })
        }

        const data = await PatientBanner.findByIdAndDelete(id)
        if (data) {
            safeUnlink(isExist.image)
            return res.status(200).json({ message: "Patient Banner deleted", success: true })
        }
        return res.status(200).json({ message: "Patient Banner not deleted", success: false })
    } catch (error) {
        return res.status(200).json({ message: "Server Error", success: false })
    }
}
export const getCmsData = async (req, res) => {
    try {
        const filter = {}
        if (req.query.slug) {
            filter.slug = req.query.slug
        }
        if (req.query.panel) {
            filter.panel = req.query.panel || 'website'
        }
        const data = await CMS.find(filter)
        return res.status(200).json({ message: "Cms Data fetched", success: true, data })
    } catch (error) {
        return res.status(200).json({ message: "Server Error" })
    }
}
export const blockUserController = async (req, res) => {
    const { contactNumber, type } = req.body
    try {
        const isExist = await BlockUser.findOne({ contactNumber })
        if (isExist) {
            return res.status(200).json({ message: "Already blocked", success: false })
        }
        const blockUser = await BlockUser.create({ contactNumber, type })
        return res.status(200).json({ message: "User blocked", success: true })
    } catch (error) {
        return res.status(200).json({ message: "Server Error" })
    }
}
export const addPatientByAdmin = async (req, res) => {
    const { name, dob, gender, contactNumber, email, address, countryId, stateId, cityId, pinCode, status, contact } = req.body

    try {
        if (!name || !dob || !gender || !contactNumber) {
            return res.status(400).json({
                success: false,
                message: "Required fields missing"
            });
        }
        const isExist = await User.findOne({ contactNumber }) || await User.findOne({ email })
        if (isExist) {
            return res.status(200).json({ message: "User already exists", success: false })
        }

        // ✅ CREATE PATIENT
        const patient = await Patient.create({ name, gender, contactNumber, email });
        if (patient) {
            const rawPassword = contactNumber.slice(-4) + "@123";
            const passwordHash = await bcrypt.hash(rawPassword, 10);
            const pt = await User.create({ name, patientId: patient._id, contactNumber, email, role: 'patient', created_by: "admin", passwordHash })
            await PatientDemographic.create({ userId: pt._id, dob, contact, address, pinCode, countryId, stateId, cityId })
            await Patient.findByIdAndUpdate(patient._id, { userId: pt._id }, { new: true })
            const countryData = await Country.findById(countryId)
            await assignNH12(pt._id, countryData?.phonecode)
        }
        res.status(200).json({
            success: true,
            message: "Patient added successfully",
            data: patient
        });

    } catch (err) {
        console.log(err)
        res.status(500).json({
            success: false,
            message: err.message
        });
    }
};
export const addDoctorByAdmin = async (req, res) => {
    const { name, dob, gender, contactNumber, email, fullAddress, countryId, stateId, cityId, pinCode, status, contact } = req.body

    try {
        const isExist = await User.findOne({ contactNumber }) || await User.findOne({ email })
        if (isExist) {
            return res.status(200).json({ message: "User already exists", success: false })
        }
        if (!name || !dob || !gender || !contactNumber) {
            return res.status(400).json({
                success: false,
                message: "Required fields missing"
            });
        }

        // ✅ CREATE PATIENT
        const doctor = await Doctor.create({ name, gender, dob, contactNumber, email });
        if (doctor) {
            const rawPassword = contactNumber.slice(-4) + "@123";
            const passwordHash = await bcrypt.hash(rawPassword, 10);
            const pt = await User.create({ name, doctorId: doctor._id, contactNumber, email, role: 'doctor', created_by: "admin", passwordHash })
            await DoctorAbout.create({ userId: pt._id, dob, contact, fullAddress, pinCode, countryId, stateId, cityId })
            await Doctor.findByIdAndUpdate(doctor._id, { userId: pt._id }, { new: true })
            const countryData = await Country.findById(countryId)
            await assignNH12(pt._id, countryData?.phonecode)
        }
        res.status(200).json({
            success: true,
            message: "doctor added successfully",
            data: doctor
        });

    } catch (err) {
        console.log(err)
        res.status(500).json({
            success: false,
            message: err.message
        });
    }
};
export const addPharmacyByAdmin = async (req, res) => {
    const { name, gstNumber, contactNumber, about, email, fullAddress, countryId, stateId, cityId, pinCode, status, contact } = req.body

    try {
        const isExist = await User.findOne({ contactNumber }) || await User.findOne({ email })
        if (isExist) {
            return res.status(200).json({ message: "User already exists", success: false })
        }
        if (!name || !gstNumber || !contactNumber) {
            return res.status(400).json({
                success: false,
                message: "Required fields missing"
            });
        }

        // ✅ CREATE PATIENT
        const pharmacy = await Pharmacy.create({ name, gstNumber, about, contactNumber, email });
        if (pharmacy) {
            const rawPassword = contactNumber.slice(-4) + "@123";
            const passwordHash = await bcrypt.hash(rawPassword, 10);
            const pt = await User.create({ name, pharId: pharmacy._id, contactNumber, email, role: 'pharmacy', created_by: "admin", passwordHash })
            await PharAddress.create({ userId: pt._id, contact, fullAddress, pinCode, countryId, stateId, cityId })
            await Pharmacy.findByIdAndUpdate(pharmacy._id, { userId: pt._id }, { new: true })
            const countryData = await Country.findById(countryId)
            await assignNH12(pt._id, countryData?.phonecode)
        }
        res.status(200).json({
            success: true,
            message: "Pharmacy added successfully",
            data: pharmacy
        });

    } catch (err) {
        console.log(err)
        res.status(500).json({
            success: false,
            message: err.message
        });
    }
};
export const addLabByAdmin = async (req, res) => {
    const { name, gstNumber, contactNumber, about, email, fullAddress, countryId, stateId, cityId, pinCode, status, contact } = req.body

    try {
        const isExist = await User.findOne({ contactNumber }) || await User.findOne({ email })
        if (isExist) {
            return res.status(200).json({ message: "User already exists", success: false })
        }
        if (!name || !gstNumber || !contactNumber) {
            return res.status(400).json({
                success: false,
                message: "Required fields missing"
            });
        }

        // ✅ CREATE PATIENT
        const laboratory = await Laboratory.create({ name, gstNumber, about, contactNumber, email });
        if (laboratory) {
            const rawPassword = contactNumber.slice(-4) + "@123";
            const passwordHash = await bcrypt.hash(rawPassword, 10);
            const pt = await User.create({ name, labId: laboratory._id, contactNumber, email, role: 'lab', created_by: "admin", passwordHash })
            await LabAddress.create({ userId: pt._id, contact, fullAddress, pinCode, countryId, stateId, cityId })
            await Laboratory.findByIdAndUpdate(laboratory._id, { userId: pt._id }, { new: true })
            const countryData = await Country.findById(countryId)
            await assignNH12(pt._id, countryData?.phonecode)
        }
        res.status(200).json({
            success: true,
            message: "Laboratory added successfully",
            data: laboratory
        });

    } catch (err) {
        console.log(err)
        res.status(500).json({
            success: false,
            message: err.message
        });
    }
};
export const addHospitalByAdmin = async (req, res) => {
    const { name, gstNumber, contactNumber, about, email, licenseId, establishedYear,category, fullAddress, country, state, city, pinCode, status, contact } = req.body

    try {
        const isExist = await User.findOne({ contactNumber }) || await User.findOne({ email })
        if (isExist) {
            return res.status(200).json({ message: "User already exists", success: false })
        }
        if (!name || !gstNumber || !contactNumber) {
            return res.status(400).json({
                success: false,
                message: "Required fields missing"
            });
        }

        // ✅ CREATE PATIENT
        const hospital = await HospitalBasic.create({ hospitalName: name,category, licenseId, establishedYear, gstNumber, about, mobileNo: contactNumber, email });
        if (hospital) {
            const rawPassword = contactNumber.slice(-4) + "@123";
            const passwordHash = await bcrypt.hash(rawPassword, 10);
            const pt = await User.create({ name, pharId: hospital._id, contactNumber, email, role: 'hospital',
                 created_by: "admin",created_by_id:hospital?._id, passwordHash ,hospitalId:hospital?._id})
            await HospitalAddress.create({ hospitalId: hospital._id, contact, fullAddress, pinCode, country, state, city })
            await HospitalBasic.findByIdAndUpdate(hospital._id, { userId: pt._id }, { new: true })
            const countryData = await Country.findById(country)
            await assignNH12(pt._id, countryData?.phonecode)
        }
        res.status(200).json({
            success: true,
            message: "Hospital added successfully",
            data: hospital
        });

    } catch (err) {
        console.log(err)
        res.status(500).json({
            success: false,
            message: err.message
        });
    }
};
export const addScheduleMedicines = async (req, res) => {
    const { name } = req.body
    try {
        const isExist = await ScheduleMedicines.findOne({ name })
        if (isExist) {
            return res.status(200).json({ message: "Name already exists", success: false })
        }
        const data = await ScheduleMedicines.create({ name })
        if (data) {
            return res.status(200).json({ message: "Schedule Medicine created", success: true })
        }
        return res.status(200).json({ message: "Schedule Medicine not created", success: false })
    } catch (error) {
        console.log(error)
        return res.status(200).json({ message: "Server Error", success: false })
    }
}
export const getScheduleMedicines = async (req, res) => {
    const { name } = req.query
    try {
        let filter = {}
        if (name) {
            filter.name = { $regex: name, $options: "i" }
        }
        const isExist = await ScheduleMedicines.find(filter) || []
        return res.status(200).json({ message: "Schedule Medicine fetched", data: isExist, success: true })

    } catch (error) {
        return res.status(200).json({ message: "Server Error", success: false })
    }
}
export const updateScheduleMedicines = async (req, res) => {
    const { name, spId } = req.body
    try {
        const isExist = await ScheduleMedicines.findOne({ name, _id: { $ne: spId } })
        if (isExist) {
            return res.status(200).json({ message: "Name already exists", success: false })
        }
        const data = await ScheduleMedicines.findByIdAndUpdate(spId, { name }, { new: true })
        if (data) {
            return res.status(200).json({ message: "Schedule Medicine updated", success: true })
        }
        return res.status(200).json({ message: "Schedule Medicine not updated", success: false })
    } catch (error) {
        console.log(error)
        return res.status(200).json({ message: "Server Error", success: false })
    }
}
export const getContactQuery = async (req, res) => {
    const { panel, page = 1, limit = 10 } = req.query;

    try {
        let filter = {};

        if (panel) {
            filter.panel = panel;
        }

        const pageNumber = parseInt(page);
        const limitNumber = parseInt(limit);
        const skip = (pageNumber - 1) * limitNumber;

        const total = await Queries.countDocuments(filter);

        const data = await Queries.find(filter)
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limitNumber);

        return res.status(200).json({
            message: "Queries fetched",
            data,
            success: true,
            pagination: {
                total,
                page: pageNumber,
                limit: limitNumber,
                totalPages: Math.ceil(total / limitNumber)
            }
        });

    } catch (error) {
        return res.status(500).json({ message: "Server Error", success: false });
    }
};
export const deleteContactQuery = async (req, res) => {
    try {
        const data = await Queries.findByIdAndDelete(req.params.id)
        if (data) {
            return res.status(200).json({ message: "Query deleted", success: true })
        }
        return res.status(404).json({ message: "Query not found", success: false })
    } catch (error) {
        return res.status(200).json({ message: error?.message, success: false })
    }
}
export const generateCard = async (req, res) => {
    try {
        const data = await CardGenerate.create(req.body)
        if (data) {
            return res.status(200).json({ message: "Card generated", success: true })
        }
        return res.status(404).json({ message: "Card not generated", success: false })
    } catch (error) {
        return res.status(200).json({ message: error?.message, success: false })
    }
}
export const getUsers = async (req, res) => {
    const { search } = req.query
    try {
        let filter = { role: { $ne: "staff" } };

        if (search) {
            filter.$or = [
                { name: { $regex: search, $options: "i" } },
                { email: { $regex: search, $options: "i" } },
                { contactNumber: { $regex: search, $options: "i" } },
            ];
        }
        const data = await User.findOne(filter).select("name email contactNumber role nh12 labId pateintId doctorId hospitalId pharmacyId")
            .populate("patientId", "profileImage")
            .populate("doctorId", "profileImage")
            .populate("pharId", "profileImage")
            .populate("labId", "profileImage")
            .populate("hospitalId", "logoFileId")
        if (data) {
            return res.status(200).json({ message: "User found", success: true, data })
        }
        return res.status(404).json({ message: "User not found", success: false })
    } catch (error) {
        return res.status(200).json({ message: error?.message, success: false })
    }
}
export const getSubTestCategory = async (req, res) => {
    try {
        // Get page & limit from query params (with defaults)
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;

        const skip = (page - 1) * limit;

        // Fetch paginated data
        const subTestCat = await SubTestCat.find()
            .skip(skip)
            .limit(limit);

        // Optional: total count for frontend pagination
        const total = await SubTestCat.countDocuments();

        return res.status(200).json({
            success: true,
            data: subTestCat,
            pagination: {
                total,
                page,
                limit,
                totalPages: Math.ceil(total / limit)
            }
        });

    } catch (error) {
        return res.status(500).json({
            message: error?.message,
            success: false
        });
    }
};
export const addSubTestCategory= async(req,res)=>{
    const {name}=req.body
    try {
        const isExist=await SubTestCat.findOne({name})
        if(isExist){
            return res.status(200).json({ message: "This category name already exists", success: true })
        }
        await SubTestCat.create({name})
        return res.status(200).json({ message: "Sub category created", success: true })
    } catch (error) {
        return res.status(200).json({ message: error?.message, success: false })
    }
}
export const updateSubTestCategory= async(req,res)=>{
    const {name,subCatId}=req.body
    try {
        const isExist=await SubTestCat.findOne({name,_id:{$ne:subCatId}})
        if(isExist){
            return res.status(200).json({ message: "This category name already exists", success: true })
        }
        const isUpdate=await SubTestCat.findByIdAndUpdate(subCatId,{name},{new:true})
        if(isUpdate){
            return res.status(200).json({ message: "Sub category updated", success: true })
        }else{
            return res.status(200).json({ message: "Sub category not updated created", success: false })
        }
    } catch (error) {
        return res.status(200).json({ message: error?.message, success: false })
    }
}
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
import StaffEmployement from "../../models/Staff/StaffEmployement.js"
import DoctorAppointment from "../../models/DoctorAppointment.js"
import LabAppointment from "../../models/LabAppointment.js"
import DoctorAptPayment from "../../models/DoctoAptPayment.js"
import LabPayment from "../../models/LabPayment.js"
import PatientPrescriptions from "../../models/Patient/prescription.model.js"
import MedicalHistory from "../../models/Patient/medicalHistory.model.js"
import PatientKyc from "../../models/Patient/kyc.model.js"
import FitnessCertificate from "../../models/Certificates/FitnessCertificate.js"
import MedicalCertificate from "../../models/Certificates/MedicalCertificate.js"
import HospitalTransfer from "../../models/Hospital/HospitalTransfer.js"
import DepartmentTransfer from "../../models/Hospital/DepartmentTransfer.js"
import BedAllotment from "../../models/Hospital/BedAllotment.js"
import PatientDepartment from "../../models/Hospital/PatientDepartment.js"
import Prescriptions from "../../models/Prescriptions.js"
import LabSample from "../../models/LabSample.js"
import TestReport from "../../models/testReport.js"
import Favorite from "../../models/Patient/favorite.model.js"
import Conversation from "../../models/Hospital/Conversation.js"
import Message from "../../models/Hospital/Message.js"
import DischargePatient from "../../models/Hospital/DischargePatient.js"
import IPDAssessment from "../../models/Hospital/IPD Daily Notes/Assessment.js"
import IPDHeader from "../../models/Hospital/IPD Daily Notes/Header.js"
import IPDLabImaging from "../../models/Hospital/IPD Daily Notes/LabsImaging.js"
import IPDObjective from "../../models/Hospital/IPD Daily Notes/Objective.js"
import IPDSubjective from "../../models/Hospital/IPD Daily Notes/Subjective.js"
import EditRequest from "../../models/EditRequest.js"
import HospitalPayment from "../../models/Hospital/HospitalPayment.js"
import DoctorEduWork from "../../models/Doctor/eduWork.js"
import DoctorKyc from "../../models/Doctor/kyc.model.js"
import MedicalLicense from "../../models/Doctor/medicalLicense.model.js"
import Sell from "../../models/Pharmacy/sell.model.js"
import TimeSlot from "../../models/TimeSlot.js"
import AuditLog from "../../models/AuditLog.js"
import PaymentInfo from "../../models/PaymentInfo.js"
import HospitalContact from "../../models/Hospital/HospitalContact.js"
import Department from "../../models/Department.js"
import BirthCertificate from "../../models/Certificates/BirthCertificate.js"
import DeathCertificate from "../../models/Certificates/DeathCertificate.js"
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
        return res.status(200).json({ message: error?.message, success: false })
    }
}
export const getServices = async (req, res) => {
    try {
        const isExist = await PatientService.find()
        return res.status(200).json({ message: "Service fetched", data: isExist, success: true })

    } catch (error) {
        return res.status(200).json({ message: error?.message, success: false })
    }
}
export const getSpecialty = async (req, res) => {
    try {
        const isExist = await Speciality.find()
        return res.status(200).json({ message: "Speciality fetched", data: isExist, success: true })

    } catch (error) {
        return res.status(200).json({ message: error?.message, success: false })
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
        return res.status(200).json({ message: error?.message, success: false })
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
        return res.status(200).json({ message: error?.message, success: false })
    }
}

export const addTestCategory = async (req, res) => {
    const icon = req?.file?.path
    const { name, } = req.body
    // const subCat = JSON.parse(req.body.subCat)
    try {
        const isExist = await TestCategory.findOne({ name })
        if (isExist) {
            safeUnlink(icon)
            return res.status(200).json({ message: "Name already exists", success: false })
        }
        const data = await TestCategory.create({ name, icon, })
        if (data) {
            return res.status(200).json({ message: "Test category created", success: true })
        }
        return res.status(200).json({ message: "Test category not created", success: false })
    } catch (error) {
        console.log(error)
        return res.status(200).json({ message: error?.message, success: false })
    }
}
export const getTestCategory = async (req, res) => {
    try {
        const isExist = await TestCategory.find()
        return res.status(200).json({ message: "Test category fetched", data: isExist, success: true })

    } catch (error) {
        return res.status(200).json({ message: error?.message, success: false })
    }
}
export const updateTestCategory = async (req, res) => {
    const icon = req?.file?.path
    const { name, spId } = req.body
    // const subCat = JSON.parse(req.body.subCat)
    try {
        const isExist = await TestCategory.findOne({ name, _id: { $ne: spId } })
        if (isExist) {
            safeUnlink(icon)
            return res.status(200).json({ message: "Name already exists", success: false })
        }
        if (isExist?.icon && icon) {
            safeUnlink(isExist?.icon)
        }
        const data = await TestCategory.findByIdAndUpdate(spId, { name, icon, }, { new: true })
        if (data) {
            return res.status(200).json({ message: "Test category updated", success: true })
        }
        return res.status(200).json({ message: "Test category not updated", success: false })
    } catch (error) {
        console.log(error)
        return res.status(200).json({ message: error?.message, success: false })
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
        return res.status(200).json({ message: error?.message, success: false })
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
        return res.status(200).json({ message: error?.message, success: false })
    }
}
export const getHospitalCategory = async (req, res) => {
    try {
        const isExist = await HospitalCategory.find()
        return res.status(200).json({ message: "Hospital category fetched", data: isExist, success: true })

    } catch (error) {
        return res.status(200).json({ message: error?.message, success: false })
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
        return res.status(200).json({ message: error?.message, success: false })
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
        return res.status(200).json({ message: error?.message, success: false })
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
        return res.status(200).json({ message: error?.message, success: false })
    }
}
export const getPharmacyCategory = async (req, res) => {
    try {
        const isExist = await PharmacyCategory.find()
        return res.status(200).json({ message: "Pharmacy category fetched", data: isExist, success: true })

    } catch (error) {
        return res.status(200).json({ message: error?.message, success: false })
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
        return res.status(200).json({ message: error?.message, success: false })
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
        return res.status(200).json({ message: error?.message, success: false })
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
        return res.status(200).json({ message: error?.message, success: false })
    }
}
export const getPatientBanner = async (req, res) => {
    try {
        const isExist = await PatientBanner.find()
        return res.status(200).json({ message: "Patient Banner fetched", data: isExist, success: true })

    } catch (error) {
        return res.status(200).json({ message: error?.message, success: false })
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
        return res.status(200).json({ message: error?.message, success: false })
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
        return res.status(200).json({ message: error?.message, success: false })
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
        return res.status(200).json({ message: error?.message })
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
        return res.status(200).json({ message: error?.message })
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
    const { name, gstNumber, contactNumber, about, email, licenseId, establishedYear, category, fullAddress, country, state, city, pinCode, status, contact } = req.body

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
        const hospital = await HospitalBasic.create({ hospitalName: name, category, licenseId, establishedYear, gstNumber, about, mobileNo: contactNumber, email });
        if (hospital) {
            const rawPassword = contactNumber.slice(-4) + "@123";
            const passwordHash = await bcrypt.hash(rawPassword, 10);
            const pt = await User.create({
                name, pharId: hospital._id, contactNumber, email, role: 'hospital',
                created_by: "admin", created_by_id: hospital?._id, passwordHash, hospitalId: hospital?._id
            })
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
        return res.status(200).json({ message: error?.message, success: false })
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
        return res.status(200).json({ message: error?.message, success: false })
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
        return res.status(200).json({ message: error?.message, success: false })
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
                { nh12: { $regex: search, $options: "i" } },
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
        const subTestCat = await SubTestCat.find().populate('category', 'name')
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
export const addSubTestCategory = async (req, res) => {
    const {
        code,
        shortName,
        category, subCategory,
        sample,
        component,
        packageType, testType, specialApproval, fastingRequired,
        testProcessing,
    } = req.body;
    try {
        // const isExist = await SubTestCat.findOne({ subCategory })
        // if (isExist) {
        //     return res.status(200).json({ message: "This category name already exists", success: false })
        // }
        await SubTestCat.create({
            code,
            shortName,
            category, subCategory,
            sample,
            component,
            packageType, testType, specialApproval, fastingRequired,
            testProcessing,
        })
        return res.status(200).json({ message: "Sub category created", success: true })
    } catch (error) {
        return res.status(200).json({ message: error?.message, success: false })
    }
}
export const updateSubTestCategory = async (req, res) => {
    const { subCatId, code,
        shortName,
        category, subCategory,
        sample,
        component,
        packageType, testType, specialApproval, fastingRequired,
        testProcessing,
        type, } = req.body
    try {
        const isExist = await SubTestCat.findOne({ subCategory, _id: { $ne: subCatId } })
        if (isExist) {
            return res.status(200).json({ message: "This category name already exists", success: true })
        }
        const isUpdate = await SubTestCat.findByIdAndUpdate(subCatId, {
            code,
            shortName,
            category, subCategory,
            sample,
            component,
            packageType, testType, specialApproval, fastingRequired,
            testProcessing,
            type,
        }, { new: true })
        if (isUpdate) {
            return res.status(200).json({ message: "Sub category updated", success: true })
        } else {
            return res.status(200).json({ message: "Sub category not updated created", success: false })
        }
    } catch (error) {
        return res.status(200).json({ message: error?.message, success: false })
    }
}
export const getPanelStaff = async (req, res) => {
    try {
        const { id } = req.params;
        const page = Number(req.query.page) || 1;
        const limit = Number(req.query.limit) || 10;
        const skip = (page - 1) * limit;


        const panelStaff = await StaffEmployement.find({ organizationId: id, userRole: "staff" })
            .populate({ path: "userId", select: "name email nh12 contactNumber staffId", populate: [{ path: "staffId", select: "profileImage" }] }).skip(skip).limit(limit)

        const total = await StaffEmployement.countDocuments({ organizationId: id, userRole: "staff" })
        res.json({
            success: true,
            data: panelStaff,
            totalPages: Math.ceil(total / limit),
            currentPage: page
        });

    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};
export const getBirthCertificates = async (req, res) => {
    try {
        const { page, limit, search } = req.query;
        const skip = (page - 1) * limit;
        let filter = {}
        if (search) {
            filter.customId = search
        }
        const data = await BirthCertificate.find(filter)
            .populate({ path: "fatherId", select: "name email nh12 contactNumber patientId", populate: [{ path: "patientId", select: "profileImage" }] })
            .populate({ path: "motherId", select: "name email nh12 contactNumber patientId", populate: [{ path: "patientId", select: "profileImage" }] })
            .populate({ path: "doctorId", select: "name email nh12 contactNumber doctorId", populate: [{ path: "doctorId", select: "profileImage" }] })
            .sort({ createdAt: -1 }).skip(skip).limit(limit);
        const total = await BirthCertificate.countDocuments();
        return res.status(200).json({ message: "Birth certificates", data, totalPages: Math.ceil(total / limit), currentPage: page, success: true })
    } catch (error) {
        return res.status(200).json({ message: error?.message, success: false })
    }
}
export const getFitnessCertificates = async (req, res) => {
    try {
        const { page, limit, search } = req.query;
        const skip = (page - 1) * limit;
        let filter = {}
        if (search) {
            filter.customId = search
        }
        const data = await FitnessCertificate.find(filter)
            .populate({ path: "patientId", select: "name email nh12 contactNumber patientId", populate: [{ path: "patientId", select: "profileImage" }] })
            .populate({ path: "doctorId", select: "name email nh12 contactNumber doctorId", populate: [{ path: "doctorId", select: "profileImage" }] })
            .sort({ createdAt: -1 }).skip(skip).limit(limit);
        const total = await FitnessCertificate.countDocuments(filter);
        return res.status(200).json({ message: "Birth certificates", data, totalPages: Math.ceil(total / limit), currentPage: page, success: true })
    } catch (error) {
        return res.status(200).json({ message: error?.message, success: false })
    }
}
export const getMedicalCertificates = async (req, res) => {
    try {
        const { page, limit, search } = req.query;
        const skip = (page - 1) * limit;
        let filter = {}
        if (search) {
            filter.customId = search
        }
        const data = await MedicalCertificate.find(filter)
            .populate({ path: "patientId", select: "name email nh12 contactNumber patientId", populate: [{ path: "patientId", select: "profileImage" }] })
            .populate({ path: "doctorId", select: "name email nh12 contactNumber doctorId", populate: [{ path: "doctorId", select: "profileImage" }] })
            .sort({ createdAt: -1 }).skip(skip).limit(limit);
        const total = await MedicalCertificate.countDocuments(filter);
        return res.status(200).json({ message: "Birth certificates", data, totalPages: Math.ceil(total / limit), currentPage: page, success: true })
    } catch (error) {
        return res.status(200).json({ message: error?.message, success: false })
    }
}
export const getDeathCertificates = async (req, res) => {
    try {
        const { page, limit, search } = req.query;
        const skip = (page - 1) * limit;
        let filter = {}
        if (search) {
            filter.customId = search
        }
        const data = await DeathCertificate.find(filter)
            .populate({ path: "patientId", select: "name email nh12 contactNumber patientId", populate: [{ path: "patientId", select: "profileImage" }] })
            .populate({ path: "doctorId", select: "name email nh12 contactNumber doctorId", populate: [{ path: "doctorId", select: "profileImage" }] })
            .sort({ createdAt: -1 }).skip(skip).limit(limit);
        const total = await DeathCertificate.countDocuments();
        return res.status(200).json({ message: "Birth certificates", data, totalPages: Math.ceil(total / limit), currentPage: page, success: true })
    } catch (error) {
        return res.status(200).json({ message: error?.message, success: false })
    }
}
export const deleteUser = async (req, res) => {
    try {
        const { id, role } = req.params
        const data = await User.findById(id)
        if (!data) {
            return res.status(200).json({ message: "User not found", success: false })
        }
        if (role == "patient") {
            await Patient.findOneAndDelete({ userId: id })
            await DoctorAppointment.deleteMany({ patientId: id })
            await LabAppointment.deleteMany({ patientId: id })
            await DoctorAptPayment.deleteMany({ patientId: id })
            await LabPayment.deleteMany({ patientId: id })
            await PatientPrescriptions.findOneAndDelete({ userId: id })
            await MedicalHistory.findOneAndDelete({ userId: id })
            await PatientKyc.findOneAndDelete({ userId: id })
            await PatientDemographic.findOneAndDelete({ userId: id })
            await FitnessCertificate.deleteMany({ patientId: id })
            await MedicalCertificate.deleteMany({ patientId: id })
            await HospitalTransfer.deleteMany({ patientId: id })
            await DepartmentTransfer.deleteMany({ patientId: id })
            await BedAllotment.deleteMany({ patientId: id })
            await PatientDepartment.deleteMany({ patientId: id })
            await Prescriptions.deleteMany({ patientId: id })
            await LabSample.deleteMany({ patientId: id })
            await TestReport.deleteMany({ patientId: id })
            await Favorite.deleteMany({ userId: id })
            await Conversation.deleteMany({ participants: { $in: [id] } })
            await Message.deleteMany({ sender: id })
            await Notification.deleteMany({ userId: id })
            await DischargePatient.deleteMany({ userId: id })
            await HospitalPayment.deleteMany({ patientId: id })

            await IPDHeader.deleteMany({ patientId: id })
            await IPDLabImaging.deleteMany({ patientId: id })
            await IPDObjective.deleteMany({ patientId: id })
            await IPDSubjective.deleteMany({ patientId: id })
            await IPDAssessment.deleteMany({ patientId: id })
            await IPDSignOff.deleteMany({ patientId: id })
            await EditRequest.deleteMany({ userId: id })
            await Sell.deleteMany({ patientId: id })

            await User.findByIdAndDelete(id)


        }
        if (role == "doctor") {
            await Doctor.findOneAndDelete({ userId: id })
            await DoctorAppointment.deleteMany({ doctorId: id })
            await LabAppointment.deleteMany({ doctorId: id })
            await DoctorAptPayment.deleteMany({ doctorId: id })
            await LabPayment.deleteMany({ doctorId: id })
            await DoctorEduWork.findOneAndDelete({ userId: id })
            await DoctorAbout.findOneAndDelete({ userId: id })
            await DoctorKyc.findOneAndDelete({ userId: id })
            await MedicalLicense.findOneAndDelete({ userId: id })
            await FitnessCertificate.deleteMany({ doctorId: id })
            await MedicalCertificate.deleteMany({ doctorId: id })
            await HospitalTransfer.deleteMany({ doctorId: id })
            await DepartmentTransfer.deleteMany({ doctorId: id })
            await BedAllotment.deleteMany({
                $or: [{ primaryDoctorId: id }, { "attendingStaff.staffId": id }]
            })

            await StaffEmployement.deleteMany({ userId: id })
            await Prescriptions.deleteMany({ doctorId: id })
            await LabSample.deleteMany({ doctorId: id })
            await TestReport.deleteMany({ doctorId: id })
            await Favorite.deleteMany({ userId: id })
            await Conversation.deleteMany({ participants: { $in: [id] } })
            await Message.deleteMany({ sender: id })
            await Notification.deleteMany({ userId: id })
            await DischargePatient.deleteMany({ doctorId: id })
            await HospitalPayment.deleteMany({ doctorId: id })

            await IPDHeader.deleteMany({ doctorId: id })
            await IPDLabImaging.deleteMany({ doctorId: id })
            await IPDObjective.deleteMany({ doctorId: id })
            await IPDSubjective.deleteMany({ doctorId: id })
            await IPDAssessment.deleteMany({ doctorId: id })
            await IPDSignOff.deleteMany({ doctorId: id })
            await EditRequest.deleteMany({ userId: id })

            await TimeSlot.deleteMany({ userId: id })
            await Sell.deleteMany({ doctorId: id })
            await AuditLog.deleteMany({ $or: [{ orgId: id }, { userId: id }] })
            await PaymentInfo.deleteMany({ userId: id })

            await User.findByIdAndDelete(id)

        }
        if (role == "staff") {
            await Staff.findByIdAndUpdate(data.staffId, { status: "inactive" })
        }
        if (role == "hospital") {
            await HospitalBasic.findOne({ hospitalId: data.hospitalId })
            await BedAllotment.deleteMany({ hospitalId: data.hospitalId })
            await HospitalPayment.deleteMany({ hospitalId: data.hospitalId })
            await IPDHeader.deleteMany({ hospitalId: data.hospitalId })
            await IPDLabImaging.deleteMany({ hospitalId: data.hospitalId })
            await IPDObjective.deleteMany({ hospitalId: data.hospitalId })
            await IPDSubjective.deleteMany({ hospitalId: data.hospitalId })
            await IPDAssessment.deleteMany({ hospitalId: data.hospitalId })
            await IPDSignOff.deleteMany({ hospitalId: data.hospitalId })
            await EditRequest.deleteMany({ userId: id })

            await HospitalContact.deleteMany({ hospitalId: data.hospitalId })
            await Department.deleteMany({ hospitalId: id })
            await HospitalAddress.deleteMany({ hospitalId: data.hospitalId })
            await HospitalPayment.deleteMany({ hospitalId: id })

            await User.findByIdAndDelete(id)
        }
        if (role == "lab") {
            await Lab.findByIdAndUpdate(data.labId, { status: "inactive" })
        }
        if (role == "pharmacy") {
            await Pharmacy.findByIdAndUpdate(data.pharmacyId, { status: "inactive" })
        }
        return res.status(200).json({ message: "User deleted", success: true })
    } catch (error) {
        return res.status(200).json({ message: error?.message, success: false })
    }
} 
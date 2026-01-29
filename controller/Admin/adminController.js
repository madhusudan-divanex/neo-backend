import PatientBanner from "../../models/Admin/PatientBanner.js"
import DoctorAbout from "../../models/Doctor/addressAbout.model.js"
import Speciality from "../../models/Speciality.js"
import TestCategory from "../../models/TestCategory.js"
import safeUnlink from "../../utils/globalFunction.js"

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
                $set: { specialty: null},      
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
    const { name } = req.body
    try {
        const isExist = await TestCategory.findOne({ name })
        if (isExist) {
            safeUnlink(icon)
            return res.status(200).json({ message: "Name already exists", success: false })
        }
        const data = await TestCategory.create({ name, icon })
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
    try {
        const isExist = await TestCategory.findOne({ name, _id: { $ne: spId } })
        if (isExist) {
            safeUnlink(icon)
            return res.status(200).json({ message: "Name already exists", success: false })
        }
        if (isExist?.icon && icon) {
            safeUnlink(isExist?.icon)
        }
        const data = await TestCategory.findByIdAndUpdate(spId, { name, icon }, { new: true })
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

export const addPatientBanner = async (req, res) => {
    const image = req?.file?.path
    try {
        
        const data = await PatientBanner.create({  image })
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
    const { name, spId } = req.body
    try {
        const isExist = await PatientBanner.findOne({ name, _id: { $ne: spId } })
        if (isExist) {
            safeUnlink(image)
            return res.status(200).json({ message: "Name already exists", success: false })
        }
        if (isExist?.image && image) {
            safeUnlink(isExist?.image)
        }
        const data = await PatientBanner.findByIdAndUpdate(spId, { name, image }, { new: true })
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
        
        const data = await PatientBanner .findByIdAndDelete(id)
        if (data) {
            safeUnlink(isExist.image)
            return res.status(200).json({ message: "Patient Banner deleted", success: true })
        }
        return res.status(200).json({ message: "Patient Banner not deleted", success: false })
    } catch (error) {
        return res.status(200).json({ message: "Server Error", success: false })
    }
}
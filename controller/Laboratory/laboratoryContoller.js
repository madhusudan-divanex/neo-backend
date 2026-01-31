import { error } from "console";
import EmpAccess from "../../models/Laboratory/empAccess.model.js";
import EmpEmployement from "../../models/Laboratory/employement.model.js";
import EmpProfesional from "../../models/Laboratory/empProffesional.js";
import LabStaff from "../../models/Laboratory/LabEmpPerson.model.js";
import Laboratory from "../../models/Laboratory/laboratory.model.js";
import fs from 'fs'
import Test from "../../models/Laboratory/test.model.js";
import safeUnlink, { capitalizeFirst } from "../../utils/globalFunction.js";
import TestReport from "../../models/testReport.js";
import User from "../../models/Hospital/User.js";
import mongoose from "mongoose";
import PatientDemographic from "../../models/Patient/demographic.model.js";
import Patient from "../../models/Patient/patient.model.js";
import bcrypt from "bcryptjs";
import Permission from "../../models/Permission.js";
import HospitalBasic from "../../models/Hospital/HospitalBasic.js";
import HospitalAddress from "../../models/Hospital/HospitalAddress.js";
import HospitalContact from "../../models/Hospital/HospitalContact.js";
import LabAddress from "../../models/Laboratory/labAddress.model.js";
import LabPerson from "../../models/Laboratory/contactPerson.model.js";
import LabImage from "../../models/Laboratory/labImages.model.js";
import LabLicense from "../../models/Laboratory/labLicense.model.js";
import HospitalCertificate from "../../models/Hospital/HospitalCertificate.js";
import HospitalImage from "../../models/Hospital/HospitalImage.js";
import LabAppointment from "../../models/LabAppointment.js";

const getAllLaboratory = async (req, res) => {
    const { page, limit } = req.query
    try {
        const laboratory = await User.find({ role: 'lab' }).sort({ createdAt: -1 })
            .skip((page - 1) * 10)
            .limit(limit)
        if (laboratory) {
            return res.status(200).json({ message: "Laboratory fetch successfully", data: laboratory, success: true })
        } else {
            return res.status(200).json({ message: "Laboratory not fount", success: false })
        }
    } catch (err) {
        return res.status(200).json({ message: 'Server Error' });
    }
}
const getAllPermission = async (req, res) => {
    const id = req.params.id;
    let { page = 1, limit = 10, name } = req.query;

    page = parseInt(page);
    limit = parseInt(limit);

    try {
        const filter = { labId: id };
        if (name && name !== 'null') {
            filter.name = { $regex: name, $options: "i" };
        }

        const laboratory = await User.findById(id);

        if (!laboratory) {
            return res.status(200).json({
                message: "Laboratory not found",
                success: false
            });
        }

        const total = await LabPermission.countDocuments(filter);

        const permissions = await LabPermission.find(filter)
            .skip((page - 1) * limit)
            .limit(limit);

        return res.status(200).json({
            message: "Laboratory permissions fetched successfully",
            data: permissions,
            pagination: {
                page,
                limit,
                total,
                totalPages: Math.ceil(total / limit)
            },
            success: true
        });

    } catch (err) {
        console.log(err);
        return res.status(500).json({
            message: 'Server Error',
            success: false
        });
    }
};

const addLabPermission = async (req, res) => {
    try {
        const { name, labId, ...permissions } = req.body;
        const isExist = await User.findById(labId);
        if (!isExist) return res.status(200).json({ message: "Laboratory not found", success: false })


        if (!name || !labId) {
            return res.status(400).json({
                success: false,
                message: "name and labId are required"
            });
        }

        const existing = await LabPermission.findOne({ name, labId });

        if (existing) {
            const updated = await LabPermission.findByIdAndUpdate(
                existing._id,
                { ...permissions },
                { new: true }
            );

            return res.status(200).json({
                success: true,
                message: "Permission updated successfully",
                data: updated
            });
        }

        const created = await LabPermission.create({
            name,
            labId,
            ...permissions
        });

        return res.status(200).json({
            success: true,
            message: "Permission created successfully",
            data: created
        });

    } catch (error) {
        console.error(error);
        return res.status(500).json({
            success: false,
            message: "Internal server error"
        });
    }
};
const updateLabPermission = async (req, res) => {
    try {
        const { name, permissionId, labId, ...permissions } = req.body;
        const isExist = await User.findById(labId);
        if (!isExist) return res.status(200).json({ message: "Laboratory not found", success: false })
        const isPermExist = await LabPermission.findById(permissionId);
        if (!isPermExist) return res.status(200).json({ message: "Permission not found", success: false })

        if (!name || !labId) {
            return res.status(400).json({
                success: false,
                message: "name and labId are required"
            });
        }
        const updated = await LabPermission.findByIdAndUpdate(
            isPermExist._id,
            { ...permissions, name },
            { new: true }
        );

        return res.status(200).json({
            success: true,
            message: "Permission updated successfully",
            data: updated
        });


    } catch (error) {
        console.error(error);
        return res.status(500).json({
            success: false,
            message: "Internal server error"
        });
    }
};
const deleteLabPermission = async (req, res) => {
    const { permissionId, labId } = req.body;
    try {
        const isLabExist = await User.findById(labId);
        if (!isLabExist) return res.status(200).json({ message: "Laboratory not found", success: false })
        const isExist = await LabPermission.findById(permissionId);
        if (!isExist) return res.status(200).json({ message: "Laboratory permission not found", success: false })

        const delPerm = await LabPermission.findByIdAndDelete(permissionId);

        if (delPerm) {
            return res.status(200).json({
                success: true,
                message: "Permission deleted successfully",
            });
        }
        return res.status(200).json({
            success: false,
            message: "Permission not deleted"
        });

    } catch (error) {
        console.error(error);
        return res.status(500).json({
            success: false,
            message: "Internal server error"
        });
    }
}

const saveLabStaff = async (req, res) => {
    const { name, address, dob, state, city, pinCode, labId, empId, gender } = req.body
    const contactInformation = JSON.parse(req.body.contactInformation)
    const profileImage = req.files?.['profileImage']?.[0]?.path
    try {
        const isExist = await User.findById(labId);
        if (!isExist) return res.status(200).json({ message: "Laboratory  not found", success: false })

        const isStaff = await LabStaff.findById(empId);

        if (profileImage && isStaff) {
            safeUnlink(isStaff.profileImage)
        }
        if (isStaff) {
            await LabStaff.findByIdAndUpdate(empId, { name, address, dob, state, gender, city, pinCode, contactInformation, labId, profileImage: profileImage || isStaff.profileImage }, { new: true })
            return res.status(200).json({
                success: true,
                message: "Staff updated",
            });
        } else {
            const staf = await LabStaff.create({ name, address, dob, state, gender, city, pinCode, contactInformation, labId, profileImage });
            return res.status(200).json({
                success: true,
                message: "Staff created",
                empId: staf._id
            });
        }


    } catch (error) {
        if (profileImage && fs.existsSync(profileImage)) {
            safeUnlink(profileImage)
        }
        return res.status(500).json({ success: false, message: error.message });
    }
};
const saveEmpEmployement = async (req, res) => {
    const { id, empId, labId, position, joinDate, onLeaveDate, contractStart, contractEnd, salary, note } = req.body;

    try {
        // Check if employee exists
        const employee = await LabStaff.findById(empId);
        if (!employee) return res.status(200).json({ success: false, message: "Employee not found" });

        let data;
        if (id) {
            data = await EmpEmployement.findByIdAndUpdate(id, { empId, labId, position, joinDate, onLeaveDate, contractStart, contractEnd, salary, note }, { new: true });
            if (!data) return res.status(200).json({ success: false, message: "Employment record not found" });

            return res.status(200).json({
                success: true,
                message: "Employee employment updated",
                data
            });
        } else {
            // Create new
            data = await EmpEmployement.create({ empId, labId, position, joinDate, onLeaveDate, contractStart, contractEnd, salary, note });
            return res.status(200).json({
                success: true,
                message: "Employee employment created",
                data
            });
        }

    } catch (error) {
        return res.status(500).json({ success: false, message: error.message });
    }
};
const deleteSubEmpProffesional = async (req, res) => {
    const { id, empId, type } = req.body;

    try {
        // Check if employee exists
        const employee = await LabStaff.findById(empId);
        if (!employee) {
            return res.status(200).json({ success: false, message: "Employee not found" });
        }

        // Build pull query based on type
        let pullQuery = {};

        if (type === "education") {
            pullQuery = { $pull: { education: { _id: id } } };
        } else if (type === "cert") {
            const data = await EmpProfesional.findOne({ empId }).select('labCert')
            safeUnlink(data.labCert.certFile)
            pullQuery = { $pull: { labCert: { _id: id } } };
        } else {
            return res.status(400).json({ success: false, message: "Invalid type" });
        }

        const data = await EmpProfesional.findOneAndUpdate(
            { empId },
            pullQuery,
            { new: true }
        );

        return res.status(200).json({
            success: true,
            message: "Sub-document deleted successfully",
            data
        });

    } catch (error) {
        return res.status(500).json({ success: false, message: error.message });
    }
};
const saveEmpProfessional = async (req, res) => {
    const { id, empId, profession, specialization, totalExperience, professionalBio, education } = req.body;
    const certMeta = JSON.parse(req.body.labCert || "[]");
    try {
        const employee = await LabStaff.findById(empId);
        if (!employee) return res.status(200).json({ success: false, message: "Employee not found" });
        const uploadedFiles = req.files?.certFile || [];
        const labCert = certMeta.map((meta, idx) => ({
            certName: meta.certName,
            certFile: uploadedFiles[idx] ? uploadedFiles[idx].path : "",
        }));
        const isExist = await EmpProfesional.findOne({ empId })
        let data;
        if (isExist) {
            const existing = await EmpProfesional.findById(isExist._id);
            if (!existing) return res.status(200).json({ success: false, message: "Professional record not found" });

            if (labCert.length > 0 && existing.labCert?.length) {
                existing.labCert.forEach(cert => safeUnlink(cert.certFile));
            }

            data = await EmpProfesional.findByIdAndUpdate(
                isExist._id,
                {
                    profession,
                    specialization,
                    totalExperience,
                    professionalBio,
                    education: JSON.parse(education || "[]"), // assuming education comes as JSON string
                    labCert: labCert.length > 0 ? labCert : existing.labCert
                },
                { new: true }
            );

            return res.status(200).json({
                success: true,
                message: "Employee professional updated"
            });

        } else {
            // Create new record
            data = await EmpProfesional.create({
                empId,
                profession,
                specialization,
                totalExperience,
                professionalBio,
                education: JSON.parse(education || "[]"),
                labCert
            });

            return res.status(200).json({
                success: true,
                message: "Employee professional created"
            });
        }

    } catch (error) {
        // if (labCertFiles.length > 0) {
        //     labCertFiles.forEach(file => safeUnlink(file.path));
        // }
        return res.status(500).json({ success: false, message: error.message });
    }
};
const saveEmpAccess = async (req, res) => {
    const { id, empId, userName, email, password, permissionId } = req.body;
    try {
        const employee = await LabStaff.findById(empId);
        if (!employee) return res.status(200).json({ success: false, message: "Employee not found" });

        const permission = await Permission.findById(permissionId);
        if (!permission) return res.status(200).json({ success: false, message: "Permission not found" });

        const isExist = await EmpAccess.findOne({ empId: empId });
        let data;
        await LabStaff.findByIdAndUpdate(empId, { permissionId }, { new: true })
        if (isExist) {
            data = await EmpAccess.findOneAndUpdate({ empId: empId }, { userName, email, password, permissionId }, { new: true });
            if (!data) return res.status(200).json({ success: false, message: "Access record not found" });
            return res.status(200).json({
                success: true,
                message: "Employee access updated",
                data
            });
        } else {
            data = await EmpAccess.create(req.body);
            return res.status(200).json({
                success: true,
                message: "Employee access created",
                data
            });
        }

    } catch (error) {
        return res.status(500).json({ success: false, message: error.message });
    }
};
const labStaffData = async (req, res) => {
    const id = req.params.id
    try {
        const personal = await LabStaff.findById(id);
        if (!personal) return res.status(200).json({ message: "Employee  not found", success: false })

        const employment = await EmpEmployement.findOne({ empId: id })
        const professional = await EmpProfesional.findOne({ empId: id })
        const empAccess = await EmpAccess.findOne({ empId: id })?.populate('permissionId')

        return res.status(200).json({
            success: true,
            message: "Staff fetched",
            employee: personal, employment, professional, empAccess

        });

    } catch (error) {
        console.log(error)
        return res.status(500).json({ success: false, message: error.message });
    }
};
const labStaffAction = async (req, res) => {
    const { empId, status } = req.body
    try {
        const isExist = await LabStaff.findById(empId);
        if (!isExist) return res.status(200).json({ message: "Employee  not found", success: false })

        const employment = await LabStaff.findByIdAndUpdate(empId, { status }, { new: true })

        return res.status(200).json({
            success: true,
            message: "Staff status updated"

        });

    } catch (error) {
        return res.status(500).json({ success: false, message: error.message });
    }
};
const labStaff = async (req, res) => {
    const id = req.params.id;
    let { page, limit, name } = req.query;

    const pageNumber = parseInt(page) > 0 ? parseInt(page) : 1;
    const limitNumber = parseInt(limit) > 0 ? parseInt(limit) : 10;

    try {
        const isExist = await User.findById(id);
        if (!isExist) {
            return res.status(404).json({ message: "Laboratory not found", success: false });
        }

        const filter = { labId: id };
        if (name) {
            filter.name = { $regex: name, $options: "i" };
        }

        const total = await LabStaff.countDocuments(filter);
        const employee = await LabStaff.find(filter)
            .populate({ path: "permissionId", select: 'name' })
            .sort({ createdAt: -1 })
            .skip((pageNumber - 1) * limitNumber)
            .limit(limitNumber)
            .lean();

        return res.status(200).json({
            success: true,
            message: "Staff fetched",
            data: employee,
            pagination: {
                page: pageNumber,
                limit: limitNumber,
                total,
                totalPages: Math.ceil(total / limitNumber)
            },
        });

    } catch (error) {
        return res.status(500).json({ success: false, message: error.message });
    }
};
const deleteStaffData = async (req, res) => {
    const id = req.params.id;

    try {
        const employee = await LabStaff.findById(id);
        if (!employee) return res.status(200).json({ success: false, message: "Employee not found" });

        safeUnlink(employee.profileImage);

        // Find related professional data
        const professional = await EmpProfesional.findOne({ empId: id });
        if (professional?.labCert?.length) {
            professional.labCert.forEach(cert => safeUnlink(cert.certFile));
        }

        // Find employment and access records
        const employment = await EmpEmployement.findOne({ empId: id });
        const empAccess = await EmpAccess.findOne({ empId: id });

        await LabAppointment.updateMany(
            { labStaff: id },
            { $unset: { labStaff: '' } }
        )

        // Delete all related records
        await EmpProfesional.deleteMany({ empId: id });
        await EmpEmployement.deleteMany({ empId: id });
        await EmpAccess.deleteMany({ empId: id });
        await LabStaff.findByIdAndDelete(id);

        return res.status(200).json({
            success: true,
            message: "Employee and related data deleted successfully"
        });

    } catch (error) {
        return res.status(500).json({ success: false, message: error.message });
    }
};

const addTest = async (req, res) => {
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
        const {
            labId,
            precautions,
            shortName,
            testCategory,
            sampleType,
            price,
            component,
            type,
            hospitalId
        } = req.body;
        if (hospitalId) {
            // 🔹 Check hospital exists
            const hospital = await User.findById(hospitalId).session(session);
            if (!hospital) {
                await session.abortTransaction();
                return res.status(200).json({ success: false, message: "Hospital not found" });
            }

            // 🔹 Check lab already exists
            let lab = await Laboratory.findOne({ userId: hospitalId }).session(session);

            // =========================
            // CREATE LAB (FIRST TIME)
            // =========================
            if (!lab) {
                const basicId = hospital.hospitalId
                const basic = await HospitalBasic.findById(basicId).session(session);
                const address = await HospitalAddress.findOne({ hospitalId: basicId }).session(session);
                const contact = await HospitalContact.findOne({ hospitalId: basicId }).session(session);
                const images = await HospitalImage.find({ hospitalId: basicId }).session(session);
                const certificates = await HospitalCertificate.find({ hospitalId: basicId }).session(session);

                const baseUrl = `api/file/`;
                // 🔹 Laboratory
                lab = await Laboratory.create({
                    userId: hospitalId,
                    name: basic.hospitalName,
                    email: basic.email,
                    contactNumber: basic.mobileNo,
                    gstNumber: basic.gstNumber,
                    about: basic.about,
                    logo: baseUrl + basic.logoFieldId,
                    allowEdit: true,
                    status: basic.kycStatus
                }, { session });

                hospital.labId = lab._id;
                await hospital.save({ session })

                // 🔹 Address
                await LabAddress.create([{
                    userId: hospitalId,
                    fullAddress: address.fullAddress,
                    cityId: address.city,
                    stateId: address.state,
                    countryId: address.country,
                    pinCode: address.pinCode
                }], { session });

                // 🔹 Contact Person
                await LabPerson.create([{
                    userId: hospitalId,
                    name: contact.name,
                    email: contact.email,
                    contactNumber: contact.mobileNumber,
                    photo: baseUrl + contact.profilePhotoId,
                    gender: capitalizeFirst(contact.gender)
                }], { session });

                // 🔹 Certificates → LabLicense
                let labLicenseNumber = "";
                let licenseFile = "";
                const labCert = [];

                certificates.forEach(cert => {
                    if (cert.certificateType === "registration") {
                        labLicenseNumber = cert.licenseNumber;
                        licenseFile = cert.fileId;
                    } else {
                        labCert.push({
                            certName: cert.certificateType,
                            certFile: cert.fileId
                        });
                    }
                });

                if (labLicenseNumber && licenseFile) {
                    await LabLicense.create([{
                        userId: hospitalId,
                        labLicenseNumber,
                        licenseFile,
                        labCert
                    }], { session });
                }

                // 🔹 Images
                const thumbnail = images
                    .filter(i => i.type === "thumbnail")
                    .map(i => ({ ...i._doc, url: baseUrl + i.fileId }));

                const gallery = images
                    .filter(i => i.type === "gallery")
                    .map(i => baseUrl + i.fileId);
                await LabImage.create([{
                    userId: hospitalId,
                    thumbnail: thumbnail[0].url,
                    labImg: gallery
                }], { session });
            }

            // =========================
            // CREATE TEST
            // =========================
            await Test.create([{
                labId: hospitalId,
                hospitalId,
                precautions,
                shortName,
                testCategory,
                sampleType,
                price,
                component,
                type
            }], { session });

            // ✅ COMMIT
            await session.commitTransaction();
            session.endSession();

            return res.status(200).json({
                success: true,
                message: "Test added successfully"
            });
        } else {
            const lab = await User.findById(labId);
            if (!lab) {
                return res.status(200).json({ success: false, message: "Lab not found" });
            }
            await Test.create({
                labId,
                hospitalId,
                precautions,
                shortName,
                testCategory,
                sampleType,
                price,
                component,
                type
            });
            await session.commitTransaction();
            session.endSession();
            return res.status(200).json({
                success: true,
                message: "Test added successfully"
            });

        }

    } catch (error) {
        console.log(error)
        await session.abortTransaction();
        session.endSession();

        return res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

const updateTest = async (req, res) => {
    const { testId, precautions, shortName, testCategory, sampleType, price, component, type, hospitalId } = req.body
    try {
        const isExist = await Test.findById(testId);
        if (!isExist) return res.status(200).json({ message: "Test  not found", success: false })

        const update = await Test.findByIdAndUpdate(testId, { precautions, shortName, testCategory, sampleType, price, component, type }, { new: true });

        if (update) {
            return res.status(200).json({
                success: true,
                message: "Test updated"
            });
        } else {
            return res.status(200).json({
                success: true,
                message: "Test not updated"
            });
        }
    } catch (error) {
        return res.status(500).json({ success: false, message: error.message });
    }
};
const labTestAction = async (req, res) => {
    const { testId, status } = req.body
    try {
        const isExist = await Test.findById(testId);
        if (!isExist) return res.status(200).json({ message: "test  not found", success: false })

        const employment = await Test.findByIdAndUpdate(testId, { status }, { new: true })

        return res.status(200).json({
            success: true,
            message: "Staff status updated"

        });

    } catch (error) {
        return res.status(500).json({ success: false, message: error.message });
    }
};
const getTest = async (req, res) => {
    const ownerId = req.params.id
    const { page, limit = 10, type = 'lab', name } = req.query
    try {
        const user = await User.findById(ownerId);
        if (!user) {
            return res.status(200).json({
                success: false,
                message: "User not found"
            });
        }

        const filter = {};

        // Decide filter based on type
        if (type === 'hospital') {
            filter.hospitalId = new mongoose.Types.ObjectId(ownerId);
            filter.type = 'hospital';

        } else {
            // default → lab
            filter.labId = new mongoose.Types.ObjectId(ownerId);
            filter.type = 'lab';
        }
        if (name) {
            filter.name = name
        }


        const data = await Test.find(filter).sort({ createdAt: -1 }).skip((page - 1) * limit).limit(limit).lean();
        const totalTest = await Test.countDocuments(filter)
        return res.status(200).json({
            success: true,
            data,
            message: "Test Fetched",
            pagination: {
                page,
                limit,
                totalTest,
                totalPages: Math.ceil(totalTest / limit)
            },
        });

    } catch (error) {
        console.log(error)
        return res.status(500).json({ success: false, message: error.message });
    }
};
const getTestData = async (req, res) => {
    const testId = req.params.id
    try {
        const isExist = await Test.findById(testId);
        if (!isExist) return res.status(200).json({ message: "test  not found", success: false })
        return res.status(200).json({
            success: true,
            data: isExist,
            message: "Test Fetched"
        });

    } catch (error) {
        return res.status(500).json({ success: false, message: error.message });
    }
};
const deleteTest = async (req, res) => {
    const testId = req.params.id
    try {
        const isExist = await Test.findById(testId);
        if (!isExist) return res.status(200).json({ message: "Laboratory test not found", success: false })

        const data = await Test.findByIdAndDelete(testId);

        return res.status(200).json({
            success: true,
            data,
            message: "Test deleted"
        });

    } catch (error) {
        return res.status(500).json({ success: false, message: error.message });
    }
};
const saveReport = async (req, res) => {
    const report = req.file?.path
    try {
        const {
            labId,
            patientId,
            testId,
            appointmentId,
            manualComment, remark,
            manualName
        } = req.body;
        const component = JSON.parse(req.body.component)
        const isExist = await TestReport.findOne({ testId, appointmentId })
        if ((req.user.isOwner !== true || !req.user.permissionId) && req.user.type !=='hospital') {
            const permission = await Permission.findById(req.user.permissionId);
            const panelType = req.user.type;

            // 🔍 Check permission
            if (!isExist && !permission?.lab?.addReport) {
                return res.status(200).json({ message: "Permission denied" });
            }
            if (isExist && !permission?.lab?.editReport) {
                return res.status(200).json({ message: "Permission denied" });
            }
        }
        if (isExist) {
            if (report) {
                safeUnlink(isExist.upload.report)
            }
            await TestReport.findByIdAndUpdate(isExist._id, {
                labId,
                patientId,
                testId,
                appointmentId,
                component, remark,status:"deliver-report"
                // upload:{report,name:manual.name,comment:manual.comment}
            }, { new: true })
            return res.status(201).json({
                success: true,
                message: "Test report saved successfully"
            });
        }
        else {
            const newReport = new TestReport({
                labId,
                patientId,
                testId,
                appointmentId, remark,status:"deliver-report",
                upload: { report, name: manualName, comment: manualComment },
                component
            });

            await newReport.save();

            return res.status(201).json({
                success: true,
                message: "Test report saved successfully",
                data: newReport
            });
        }
    } catch (error) {
        console.error("Report Errr", error);
        if (fs.existsSync(report)) {
            safeUnlink(report)
        }
        res.status(500).json({ success: false, message: "Error saving report" });
    }
};
const getTestReport = async (req, res) => {
    try {
        const {
            testId,
            appointmentId,
        } = req.body;
        const isExist = await TestReport.findOne({ testId, appointmentId }).populate('testId')
            .populate({ path: 'labId', select: '-passwordHash', populate: "labId" }).populate('appointmentId')
        if (isExist) {
            return res.status(201).json({
                success: true,
                message: "Test report saved successfully",
                data: isExist
            });
        }
        else {
            return res.status(201).json({
                success: false,
                message: "Test report not found"
            });
        }
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: "Error saving report" });
    }
};
export const addPatient = async (req, res) => {
    const { name, dob, gender, contactNumber, email, address, countryId, stateId, cityId, pinCode, contact } = req.body

    try {
        const labId = req.user._id;
        const data = req.body;
        if (!name || !dob || !gender || !contactNumber) {
            return res.status(400).json({
                success: false,
                message: "Required fields missing"
            });
        }

        // ✅ CREATE PATIENT
        const patient = await Patient.create({ name, gender, contactNumber, email });
        if (patient) {
            const rawPassword = contactNumber.slice(-4) + "@123";
            const passwordHash = await bcrypt.hash(rawPassword, 10);
            const pt = await User.create({ name, patientId: patient._id, email, role: 'patient', created_by: "lab", created_by_id: labId, passwordHash })
            await PatientDemographic.create({ userId: pt._id, dob, contact, address, pinCode, countryId, stateId, cityId })
            await Patient.findByIdAndUpdate(patient._id, { userId: pt._id }, { new: true })
            return res.status(200).json({
                success: true,
                message: "Patient added successfully",
                data: pt
            });
        }
        return res.status(200).json({
            success: false,
            message: "Patient not added ",
        });

    } catch (err) {
        console.log(err)
        res.status(500).json({
            success: false,
            message: err.message
        });
    }
};
export {
    getAllLaboratory, getAllPermission, addLabPermission, deleteLabPermission, saveEmpAccess, saveEmpEmployement, saveEmpProfessional, saveLabStaff,
    labStaffData, deleteStaffData, labStaff, updateLabPermission, addTest, getTest, deleteTest, labStaffAction, deleteSubEmpProffesional,
    getTestData, updateTest, labTestAction, saveReport, getTestReport
}
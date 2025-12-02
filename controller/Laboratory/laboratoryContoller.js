import { error } from "console";
import EmpAccess from "../../models/Laboratory/empAccess.model.js";
import EmpEmployement from "../../models/Laboratory/employement.model.js";
import EmpProfesional from "../../models/Laboratory/empProffesional.js";
import LabStaff from "../../models/Laboratory/LabEmpPerson.model.js";
import Laboratory from "../../models/Laboratory/laboratory.model.js";
import LabPermission from "../../models/Laboratory/LabPermission.model.js";
import fs from 'fs'
import Test from "../../models/Laboratory/test.model.js";
import safeUnlink from "../../utils/globalFunction.js";

const getAllLaboratory = async (req, res) => {
    const { page, limit } = req.query
    try {
        const laboratory = await Laboratory.find().sort({ createdAt: -1 })
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

        const laboratory = await Laboratory.findById(id);

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
        const isExist = await Laboratory.findById(labId);
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
        const isExist = await Laboratory.findById(labId);
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
        const isLabExist = await Laboratory.findById(labId);
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
        const isExist = await Laboratory.findById(labId);
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

        const permission = await LabPermission.findById(permissionId);
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
        const isExist = await LabStaff.findById(id);
        if (!isExist) return res.status(200).json({ message: "Employee  not found", success: false })

        const employment = await EmpEmployement.findOne({ empId: id })
        const professional = await EmpProfesional.findOne({ empId: id })
        const empAccess = await EmpAccess.findOne({ empId: id })?.populate({ path: 'permissionId', select: 'name' })

        return res.status(200).json({
            success: true,
            message: "Staff fetched",
            employee: isExist, employment, professional, empAccess

        });

    } catch (error) {
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
    const id = req.params.id
    const { page, limit, name } = req.query
    try {
        const filter = { labId: id }
        const isExist = await Laboratory.findById(id);
        if (!isExist) return res.status(200).json({ message: "Laboratory  not found", success: false })

        if (name) {
            filter.name = { $regex: name, $options: "i" }
        }
        const total = await LabStaff.countDocuments(filter);
        const employee = await LabStaff.find(filter).populate({path:"permissionId",select:'name'}).sort({ createdAt: -1 }).skip((page - 1) * limit).limit(limit)
        return res.status(200).json({
            success: true,
            message: "Staff fetched",
            data: employee,
            pagination: {
                page,
                limit,
                total,
                totalPages: Math.ceil(total / limit)
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
    const { labId, title,  precautions, shortName, testCategory, sampleType, price, component } = req.body
    try {
        const isExist = await Laboratory.findById(labId);
        if (!isExist) return res.status(200).json({ message: "Laboratory  not found", success: false })

        const isStaff = await Test.create({ labId, title,  precautions, shortName, testCategory, sampleType, price, component });

        if (isStaff) {
            return res.status(200).json({
                success: true,
                message: "Test created"
            });
        } else {
            return res.status(200).json({
                success: true,
                message: "Test not created"
            });
        }
    } catch (error) {
        return res.status(500).json({ success: false, message: error.message });
    }
};
const updateTest = async (req, res) => {
    const {testId,  title,  precautions, shortName, testCategory, sampleType, price, component } = req.body
    try {
        const isExist = await Test.findById(testId);
        if (!isExist) return res.status(200).json({ message: "Test  not found", success: false })

        const update = await Test.findByIdAndUpdate(testId,{  title,  precautions, shortName, testCategory, sampleType, price, component },{new:true});

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
    const labId = req.params.id
    const {page,limit=10}=req.query
    try {
        const filter={labId}
        if(req.query.name){
            filter.shortName=req.query.name
        }
        const isExist = await Laboratory.findById(labId);
        if (!isExist) return res.status(200).json({ message: "Laboratory  not found", success: false })

        const data = await Test.find(filter).sort({createdAt:-1}).skip((page-1)*limit).limit(limit);
        const totalTest= await Test.countDocuments(filter)
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
            data:isExist,
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
export {
    getAllLaboratory, getAllPermission, addLabPermission, deleteLabPermission, saveEmpAccess, saveEmpEmployement, saveEmpProfessional, saveLabStaff,
    labStaffData, deleteStaffData, labStaff, updateLabPermission, addTest, getTest, deleteTest, labStaffAction, deleteSubEmpProffesional,
    getTestData,updateTest,labTestAction
}
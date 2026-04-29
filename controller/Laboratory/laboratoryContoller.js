
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
import LabPayment from "../../models/LabPayment.js";
import PaymentInfo from "../../models/PaymentInfo.js";
import HospitalAudit from "../../models/Hospital/HospitalAudit.js";
import Country from "../../models/Hospital/Country.js";
import { assignNH12 } from "../../utils/nh12.js";
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




const addTest = async (req, res) => {
    const session = await mongoose.startSession();

    try {
        await session.withTransaction(async () => {

            const {
                labId,
                category,
                type, totalAmount,
                hospitalId
            } = req.body;
            const subCatData = JSON.parse(req.body.subCatData)

            const baseUrl = `api/file/`;

            // ===============================
            // CASE 1 : HOSPITAL ADDING TEST
            // ===============================
            if (hospitalId) {

                const hospital = await User.findById(hospitalId).session(session);
                if (!hospital) {
                    throw new Error("Hospital not found");
                }

                let lab = await Laboratory.findOne({ userId: hospitalId }).session(session);

                // ====================================
                // CREATE LAB IF NOT EXISTS
                // ====================================
                if (!lab) {

                    const basicId = hospital.hospitalId;

                    const basic = await HospitalBasic.findById(basicId).session(session);
                    const address = await HospitalAddress.findOne({ hospitalId: basicId }).session(session);
                    const contact = await HospitalContact.findOne({ hospitalId: basicId }).session(session);
                    const images = await HospitalImage.find({ hospitalId: basicId }).session(session);
                    const certificates = await HospitalCertificate.find({ hospitalId: basicId }).session(session);

                    if (!basic || !address || !contact) {
                        throw new Error("Please Complete your profile first!");
                    }

                    // =========================
                    // CREATE LAB
                    // =========================
                    const labData = await Laboratory.create([{
                        userId: hospitalId,
                        name: basic.hospitalName,
                        email: hospital.email,
                        contactNumber: hospital.contactNumber,
                        gstNumber: basic.gstNumber,
                        about: basic.about,
                        logo: basic.logoFieldId ? baseUrl + basic.logoFieldId : '',
                        allowEdit: true,
                        status: basic.kycStatus
                    }], { session });

                    lab = labData[0];

                    hospital.labId = lab._id;
                    await hospital.save({ session });

                    // =========================
                    // ADDRESS
                    // =========================
                    await LabAddress.create([{
                        userId: hospitalId,
                        fullAddress: address.fullAddress,
                        cityId: address.city,
                        stateId: address.state,
                        countryId: address.country,
                        pinCode: address.pinCode
                    }], { session });

                    // =========================
                    // CONTACT PERSON
                    // =========================
                    await LabPerson.create([{
                        userId: hospitalId,
                        name: contact.name,
                        email: contact.email,
                        contactNumber: contact.mobileNumber,
                        photo: contact.profilePhotoId ? baseUrl + contact.profilePhotoId : '',
                        gender: capitalizeFirst(contact.gender)
                    }], { session });

                    // =========================
                    // CERTIFICATES
                    // =========================
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

                    // =========================
                    // IMAGES
                    // =========================
                    const thumbnail = images.find(i => i.type === "thumbnail");
                    const gallery = images
                        .filter(i => i.type === "gallery")
                        .map(i => baseUrl + i.fileId);

                    await LabImage.create([{
                        userId: hospitalId,
                        thumbnail: thumbnail ? baseUrl + thumbnail.fileId : "",
                        labImg: gallery
                    }], { session });

                }

                // =========================
                // CREATE TEST
                // =========================
                await Test.create([{
                    labId: hospitalId,
                    hospitalId, totalAmount,
                    category, subCatData,
                    type,
                }], { session });
                if (req.user.id && req.user.type == "hospital") {
                    if (req?.user?.loginUser) {
                        await HospitalAudit.create({
                            hospitalId: req.user.id, actionUser: req?.user?.loginUser,
                            note: `An lab test was added.`
                        })
                    } else {
                        await HospitalAudit.create({
                            hospitalId: req.user.id, note: `An lab test  was added.`
                        })
                    }
                }
                return res.status(200).json({
                    success: true,
                    message: "Test added successfully"
                });


            }

            // ===============================
            // CASE 2 : LAB ADDING TEST
            // ===============================
            else {

                const lab = await User.findById(labId).session(session);

                if (!lab) {
                    throw new Error("Lab not found");
                }

                await Test.create([{
                    labId, totalAmount,
                    category, subCatData,
                    type,
                }], { session });

                return res.status(200).json({
                    success: true,
                    message: "Test added successfully"
                });

            }

        });

    } catch (error) {

        console.log(error);

        return res.status(500).json({
            success: false,
            message: error.message
        });

    } finally {

        session.endSession();

    }
};

const updateTest = async (req, res) => {
    const { testId, category, totalAmount,} = req.body
    const subCatData = JSON.parse(req.body.subCatData)

    try {
        const isExist = await Test.findById(testId);
        if (!isExist) return res.status(200).json({ message: "Test  not found", success: false })

        const update = await Test.findByIdAndUpdate(testId, {
            category,subCatData,totalAmount
        }, { new: true });

        if (update) {
            if (req.user.id && req.user.type == "hospital") {
                if (req?.user?.loginUser) {
                    await HospitalAudit.create({
                        hospitalId: req.user.id, actionUser: req?.user?.loginUser,
                        note: `An lab test  details was updated.`
                    })
                } else {
                    await HospitalAudit.create({
                        hospitalId: req.user.id, note: `An lab test  details was updated.`
                    })
                }

            }
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

        const testData = await Test.findByIdAndUpdate(testId, { status }, { new: true })
        if (testData) {
            if (req.user.id && req.user.type == "hospital") {
                if (req?.user?.loginUser) {
                    await HospitalAudit.create({
                        hospitalId: req.user.id, actionUser: req?.user?.loginUser,
                        note: `A lab test status was updated  .`
                    })
                } else {
                    await HospitalAudit.create({
                        hospitalId: req.user.id, note: `A lab test  status was updated.`
                    })
                }
            }
        }
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
    const { page = 1, limit = 10, type = 'lab', name, status } = req.query
    try {
        const user = await User.findById(ownerId);
        if (!user) {
            return res.status(200).json({
                success: false,
                message: "User not found"
            });
        }

        const filter = {};

        if (type === 'hospital') {
            filter.hospitalId = new mongoose.Types.ObjectId(ownerId);
        } else {
            filter.labId = new mongoose.Types.ObjectId(ownerId);
        }

        // ✅ Fix 1: Category name se search — pehle matching categories dhundho
        if (name) {
            const matchedCategories = await mongoose.model('test-category').find({
                name: { $regex: name, $options: 'i' }
            }).select('_id').lean();

            const categoryIds = matchedCategories.map(c => c._id);
            filter.category = { $in: categoryIds };
        }

        // ✅ Fix 2: Nested array field filter sahi syntax
        if (status) {
            filter['subCatData.status'] = status;
        }

        const data = await Test.find(filter)
            .populate('category', 'name')
            .populate('subCatData.subCat', 'subCategory')
            .sort({ createdAt: -1 })
            .skip((page - 1) * limit)
            .limit(Number(limit))
            .lean();

        const totalTest = await Test.countDocuments(filter);

        return res.status(200).json({
            success: true,
            data,
            message: "Test Fetched",
            pagination: {
                page: Number(page),
                limit: Number(limit),
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
        const isExist = await Test.findById(testId).populate('category', 'name');
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
    const id = req.user.id || req.user.userId
    try {
        const haveAppointment = await LabAppointment.findOne({ testId: testId })
        if (haveAppointment) {
            return res.status(200).json({ message: "A lab appointment have this test", success: false })
        }
        const isExist = await Test.findOne({ _id: testId, $or: [{ labId: id }, { hospitalId: id }] });
        if (!isExist) return res.status(200).json({ message: "Laboratory test not found", success: false })

        await isExist.deleteOne()

        return res.status(200).json({
            success: true,

            message: "Test deleted"
        });

    } catch (error) {
        return res.status(500).json({ success: false, message: error.message });
    }
};
const saveReport = async (req, res) => {
    const report = req.file?.path
    try {
        const labId = req.user.id || req.user.userId
        const {
            patientId,
            testId,subCatId,
            appointmentId,
            manualComment, remark,
            manualName
        } = req.body;
        const isAppointment = await LabAppointment.findOne({ labId, _id: appointmentId })
        if (!isAppointment) {
            return res.status(404).json({ message: "appointement not found", success: false })
        }
        if (!isAppointment.collectionDate) {
            return res.status(404).json({ message: "Please collect sample before saving the report", success: false })
        }
        const component = JSON.parse(req.body.component)
        const isExist = await TestReport.findOne({ subCatId, appointmentId })
        // if ((req.user.isOwner !== true || !req.user.permissionId) && req.user.type !== 'hospital') {
        //     const permission = await Permission.findById(req.user.permissionId);
        //     const panelType = req.user.type;

        //     // 🔍 Check permission
        //     if (!isExist && !permission?.lab?.addReport) {
        //         return res.status(200).json({ message: "Permission denied" });
        //     }
        //     if (isExist && !permission?.lab?.editReport) {
        //         return res.status(200).json({ message: "Permission denied" });
        //     }
        // }
        if (isExist) {
            // if (report) {
            //     safeUnlink(isExist.upload.report)
            // }
            console.log(component)
            await TestReport.findByIdAndUpdate(isExist._id, {
                labId,
                patientId,
                testId,subCatId,
                appointmentId,
                component, remark,
                // upload:{report,name:manual.name,comment:manual.comment}
            }, { new: true })
            isAppointment.status = "deliver-report"
            await isAppointment.save()
            if (req?.user?.loginUser && req.user.id && req.user.type == "hospital") {
                await HospitalAudit.create({
                    hospitalId: req.user.id, actionUser: req?.user?.loginUser,
                    note: `An lab report was add in appointment ${isAppointment?.customId} id.`
                })
            }
            return res.status(200).json({
                success: true,
                message: "Test report saved successfully"
            });
        }
        else {
            const newReport = new TestReport({
                labId,
                patientId,
                testId,subCatId,
                appointmentId, remark,
                upload: { report, name: manualName, comment: manualComment },
                component
            });

            await newReport.save();
            // if(req.user.type =='hospital')
            isAppointment.status = "deliver-report"
            await isAppointment.save()

            return res.status(201).json({
                success: true,
                message: "Test report created successfully",
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
            subCatId,
            appointmentId,
        } = req.body;
        const isExist = await TestReport.findOne({ subCatId, appointmentId }).populate('subCatId')
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
export const collectSample = async (req, res) => {
    const { appointmentId } = req.body
    try {
        const data = await LabAppointment.findByIdAndUpdate(appointmentId, { collectionDate: new Date(), status: "pending-report" }, { new: true })
        if (data) {
            return res.status(200).json({ message: "Collection updated", success: true })
        }
        return res.status(404).json({ message: "Appointment not found", success: false })

    } catch (error) {
        return res.status(500).json({ message: error?.message })
    }
}
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
        const isExist = await User.findOne({ email }) || await User.findOne({ contactNumber });
        if (isExist) {
            return res.status(200).json({
                success: false,
                message: "Patient already exists"
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
            const countryData = await Country.findById(countryId)
            const data = await assignNH12(pt?._id, countryData?.phonecode)
            if (data) {
                const patient = await User.findById(pt?._id)
                return res.status(200).json({
                    success: true,
                    message: "Patient added successfully",
                    data: patient
                });
            }
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
const saveLabInvoice = async (req, res) => {
    try {
        const labId = req.user.id || req.user.userId
        const { paymentType, subTotal, taxes, discount, total, patientId, appointmentId } = req.body;

        // Validate required fields
        if (!patientId || !labId || !appointmentId) {
            return res.status(400).json({ error: 'Missing required fields' });
        }
        const isApt = await LabAppointment.findById(appointmentId)
        if (!isApt) {
            return res.status(200).json({ message: "Appointment not found", success: false })
        }
        const paymentId = await PaymentInfo.findOne(({ userId: labId })).sort({ createdAt: -1 })
        if (!patientId && paymentType == "ONLINE") {
            return res.status(200).json({ message: "Please fill account details", success: false })
        }
        // Save to database (example with MongoDB)
        const invoice = new LabPayment({
            paymentType,
            paymentId,
            taxes, subTotal, discount, total, appointmentId, labId, patientId

        });

        await invoice.save();
        isApt.invoiceId = invoice._id
        await isApt.save()

        res.status(201).json({
            message: 'Invoice saved successfully',
            invoice, success: true
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};
const getLabInvoice = async (req, res) => {
    try {
        const labId = req.user.id || req.user.userId
        const invoiceId = req.params.id


        const invoice = await LabPayment.findOne(({ labId, _id: invoiceId })).sort({ createdAt: -1 })
        if (!invoice) {
            return res.status(200).json({ message: "Invoice not found", success: false })
        }

        res.status(201).json({
            message: 'Invoice saved successfully',
            invoice
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};


export {
    getAllLaboratory, addTest, getTest, deleteTest,
    getTestData, updateTest, labTestAction, saveReport, getTestReport, saveLabInvoice, getLabInvoice
}


import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import sendEmail from '../../utils/sendMail.js'
import Otp from '../../models/Patient/otp.model.js';
import Patient from '../../models/Patient/patient.model.js';
import Login from '../../models/Patient/login.model.js';
import PatientKyc from '../../models/Patient/kyc.model.js';
import fs from 'fs'
import PatientDemographic from '../../models/Patient/demographic.model.js';
import MedicalHistory from '../../models/Patient/medicalHistory.model.js';
import EditRequest from '../../models/EditRequest.js';
import LabAppointment from '../../models/LabAppointment.js';
import safeUnlink from '../../utils/globalFunction.js';
import PatientPrescriptions from '../../models/Patient/prescription.model.js';
import User from '../../models/Hospital/User.js';

const signUpPatient = async (req, res) => {
    const { name, gender, email, contactNumber, password, created_by } = req.body;
    try {
        const isExist = await Patient.findOne({ email })
        if (isExist) {
            return res.status(200).json({ message: "Patient already exist", success: false })
        }
        const hashedPassword = await bcrypt.hash(password, 10);

        // Create user
        const isLast = await User.findOne()?.sort({ createdAt: -1 })
        const nextId = isLast
            ? String(Number(isLast.customId) + 1).padStart(4, '0')
            : '0001';
        const newPatient = await Patient.create({
            name,
            gender,
            email,
            contactNumber,
        });

        if (newPatient) {
            // const code = generateOTP()
            // const isOtpExist = await Otp.findOne({ userId: newPatient._id })
            // if (isOtpExist) {
            //     await Otp.findByIdAndDelete(isOtpExist._id)
            //     const otp = await Otp.create({ userId: newPatient._id, code })
            // } else {
            //     const otp = await Otp.create({ userId: newPatient._id, code })
            // }
            const user = await User.create(
                {
                    patientId: newPatient?._id,
                    email,
                    name,
                    role: 'patient',
                    created_by: 'self',
                    passwordHash: hashedPassword
                },
            )
            await Patient.findByIdAndUpdate(newPatient._id, { userId: user._id }, { new: true })
            return res.status(200).json({ success: true, userId: user._id });
        } else {
            return res.status(200).json({ success: false, message: "Patient not created" });
        }

    } catch (err) {
        console.error(err);
        return res.status(500).json({ message: 'Server Error' });
    }
}
const signInPatient = async (req, res) => {
    const { contactNumber, password } = req.body;
    try {
        const isExist = await Patient.findOne({ contactNumber }).populate('userId');
        if (!isExist) return res.status(200).json({ message: 'Patient not Found', success: false });
        const hashedPassword = isExist.userId?.passwordHash
        const isMatch = await bcrypt.compare(password, hashedPassword);
        if (!isMatch) return res.status(200).json({ message: 'Invalid email or password', success: false });
        const code = generateOTP()
        const isOtpExist = await Otp.findOne({ phone: isExist.contactNumber })
        if (isOtpExist) {
            await Otp.findByIdAndDelete(isOtpExist._id)
            const otp = await Otp.create({ phone: isExist.contactNumber, code })
        } else {
            const otp = await Otp.create({ phone: isExist.contactNumber, code })
        }

        const isLogin = await Login.findOne({ userId: isExist._id })
        if (isLogin) {
            await Login.findByIdAndUpdate(isLogin._id, {}, { new: true })
            return res.status(200).json({ message: "Email Sent", userId: isExist.userId._id, isNew: false, success: true })
        } else {
            await Login.create({ userId: isExist._id })
            return res.status(200).json({ message: "Email Sent", isNew: true, userId: isExist.userId._id, success: true })
        }
    } catch (err) {
        console.error(err);
        return res.status(500).json({ message: 'Server Error' });
    }
}
const verifyOtp = async (req, res) => {
    const { phone, code, name, gender, email, contactNumber, password, } = req.body
    try {
        const isOtp = await Otp.findOne({ phone })
        if (!isOtp) {
            return res.status(200).json({ message: "Patient not exist", success: false })
        }
        // const isOtp = await Otp.findOne({ code })
        // if (!isOtp) {
        //     return res.status(200).json({ message: "Code not exist", success: false })
        // }
        // const otpExpiryTime = new Date(isOtp.updatedAt);
        // otpExpiryTime.setMinutes(otpExpiryTime.getMinutes() + 10);

        // if (new Date() > otpExpiryTime) {
        //     return res.status(200).json({ message: "OTP Expired", success: false });
        // }
        // const isValid = code == (isOtp.code)
        if (name && gender && email && contactNumber && password) {
            const isValid = code == "1234"
            if (isValid) {
                const isExist = await Patient.findOne({ email })
                if (isExist) {
                    return res.status(200).json({ message: "Patient already exist", success: false })
                }
                const hashedPassword = await bcrypt.hash(password, 10);
                const newPatient = await Patient.create({
                    name,
                    gender,
                    email,
                    contactNumber,
                });

                if (newPatient) {
                    const user = await User.create(
                        {
                            patientId: newPatient?._id,
                            email,
                            name,
                            role: 'patient',
                            created_by: 'self',
                            passwordHash: hashedPassword
                        },
                    )
                    const token = jwt.sign(
                        { user: user._id },
                        process.env.JWT_SECRET,
                        // { expiresIn: isRemember ? "30d" : "1d" }
                    );
                    await Patient.findByIdAndUpdate(newPatient._id, { userId: user._id }, { new: true })
                    return res.status(200).json({ success: true, nextStep: '/kyc', token, userId: user._id });
                } else {
                    return res.status(200).json({ success: false, message: "Patient not created" });
                }

            } else {
                return res.status(200).json({ message: "Invalid otp", success: false })
            }
        } else {
            const patient = await Patient.findOne({ contactNumber: phone })
            const user = await User.findById(patient.userId)
            const userId = patient.userId
            const [
                kyc,
                personal,
                history,
                familyHistory,
                prescription
            ] = await Promise.all([
                PatientKyc.findOne({ userId }),
                PatientDemographic.findOne({ userId }),
                MedicalHistory.findOne({ userId }),
                MedicalHistory.findOne({
                    userId,
                    familyHistory: { $ne: null }
                }),
                PatientPrescriptions.findOne({ userId })
            ]);

            let nextStep = null;

            if (!kyc) {
                nextStep = "/kyc";
            } else if (!personal) {
                nextStep = "/personal-info";
            } else if (!history) {
                nextStep = "/medical-history";
            } else if (!familyHistory) {
                nextStep = "/family-medical-history";
            } else if (!prescription) {
                nextStep = "/prescriptions-reports";
            }
            const isValid = code == "1234"
            let isNew = true;
            const isLogin = await Login.findOne({ userId })
            if (isLogin) {
                isNew = false;
            }
            if (isValid) {
                const token = jwt.sign(
                    { user: user._id },
                    process.env.JWT_SECRET,
                    // { expiresIn: isRemember ? "30d" : "1d" }
                );
                return res.status(200).json({ message: "Verify Success", nextStep, token, patientId: user?.patientId, userId, user: user, success: true })
            } else {
                return res.status(200).json({ message: "Invalid credentials", success: false })
            }
        }
    } catch (err) {
        return res.status(400).json({ success: false, error: err.message });
    }
};
const resendOtp = async (req, res) => {
    const { phone } = req.params.id
    try {
        const isExist = await Patient.findOne({ phone });
        if (!isExist) {
            return res.status(404).json({ success: false, message: 'Patient not found' });
        }
        const code = generateOTP()
        const isOtpExist = await Otp.findOne({ phone: isExist.contactNumber })
        if (isOtpExist) {
            await Otp.findByIdAndDelete(isOtpExist.contactNumber)
            const otp = await Otp.create({ phone: isExist.contactNumber, code })
        } else {
            const otp = await Otp.create({ phone: isExist.contactNumber, code })
        }
        const emailHtml = `
            Hello ${isExist?.name}, 
            Your One-Time Password (OTP) for Neo Health is: ${code} 
            This OTP is valid for 10 minutes. Please do not share it with anyone.
            If you did not request this, please ignore this email.
            Thank you,
            The Neo Health Team`
        await sendEmail({
            to: isExist.email,
            subject: "Your Neo Health OTP Code!",
            html: emailHtml
        });
        res.status(200).json({
            success: true,
            message: "OTP sent!"
        });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};

const forgotEmail = async (req, res) => {
    const email = req.params.email
    try {
        const isExist = await User.findOne({ email, role: 'patient' });
        if (!isExist) {
            return res.status(404).json({ success: false, message: 'Patient not found' });
        }
        const code = generateOTP()
        const isOtpExist = await Otp.findOne({ userId: isExist._id })
        if (isOtpExist) {
            await Otp.findByIdAndDelete(isOtpExist._id)
            const otp = await Otp.create({ userId: isExist._id, code })
        } else {
            const otp = await Otp.create({ userId: isExist._id, code })
        }
        return res.status(200).json({
            success: true,
            message: "Mail sent!"
        });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};

const resetPassword = async (req, res) => {
    const { userId, password } = req.body;
    try {

        const isExist = await User.findById(userId);
        if (!isExist) return res.status(400).json({ message: 'Invalid user' });

        const hashedPassword = await bcrypt.hash(password, 10);
        const updatePass = await User.findByIdAndUpdate(userId, { password: hashedPassword }, { new: true })
        if (updatePass) {
            return res.status(200).json({ message: "Password reset", userId: isExist._id, success: true })
        } else {
            return res.status(200).json({ message: "Error occure in password reset", success: false })
        }
    } catch (err) {
        console.error(err.message);
        return res.status(500).json({ message: 'Server Error' });
    }
}
const changePassword = async (req, res) => {
    const { userId, newPassword, oldPassword } = req.body;
    try {

        const isExist = await User.findById(userId);
        if (!isExist) return res.status(200).json({ message: 'Invalid email' });
        const isMatch = await bcrypt.compare(oldPassword, isExist.passwordHash);
        if (!isMatch) return res.status(200).json({ message: 'Old password is incorrect', success: false });

        const hashedPassword = await bcrypt.hash(newPassword, 10);
        const updatePass = await User.findByIdAndUpdate(userId, { passwordHash: hashedPassword }, { new: true })
        if (updatePass) {
            return res.status(200).json({ message: "Password change successfully", userId: isExist._id, success: true })
        } else {
            return res.status(200).json({ message: "Error occure in password reset", success: false })
        }
    } catch (err) {
        console.error(err.message);
        return res.status(500).json({ message: 'Server Error' });
    }
}
const updatePatient = async (req, res) => {
    const { userId, email, contactNumber, name, gender } = req.body;
    const profileImage = req.files?.['profileImage']?.[0]?.path
    try {
        const isExist = await User.findById(userId);
        if (!isExist) return res.status(200).json({ message: 'Patient not exist' });
        const alreadyEmail = await Patient.countDocuments({ email })
        if (alreadyEmail > 1) {
            return res.status(200).json({ message: 'Email already exist' });
        }
        const userEmail = await User.countDocuments({ email })
        if (userEmail > 1) {
            return res.status(200).json({ message: 'Email already exist' });
        }
        if(profileImage && alreadyEmail.profileImage){
            safeUnlink(alreadyEmail.profileImage)
        }
        const updatePatient = await Patient.findByIdAndUpdate(isExist.patientId, { email, contactNumber, name, gender,profileImage }, { new: true })
        if (updatePatient) {
            await User.findOneAndUpdate({ patientId: userId }, { name, email }, { new: true })
            return res.status(200).json({ message: "Patient data change successfully", userId: isExist._id, success: true })
        } else {
            return res.status(200).json({ message: "Error occure in user data", success: false })
        }
    } catch (err) {
        if(fs.existsSync(profileImage)){
            safeUnlink(profileImage)
        }
        console.error(err.message);
        if (err.message.includes(' duplicate key error collection')) {
            return res.status(200).json({ message: "Email already exist " })
        } else {
            return res.status(200).json({ message: 'Server Error' });
        }
    }
}

function generateOTP() {
    return Math.floor(1000 + Math.random() * 9000).toString();
}

const getProfile = async (req, res) => {
    try {
        const user = await User.findById(req.user.user).select('-password');
        if (!user) {
            return res.status(404).json({ success: false, message: 'Patient not found' });
        }
        res.status(200).json({
            success: true,
            data: user
        });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};
const getCustomProfile = async (req, res) => {
    const userId = req.params.id
    try {
        let user;
        if (userId?.length < 24) {
            user = await User.findOne({ customId: userId }).select('-password').lean();
        } else {
            user = await User.findById(userId).select('-password').lean();
        }
        if (!user) {
            return res.status(200).json({ success: false, message: 'Patient not found' });
        }
        const patientData = await Patient.findById(user.patientId).lean()
        const ptDemographic = await PatientDemographic.findOne({ userId: user.patientId }).sort({ createdAt: -1 })
        res.status(200).json({
            success: true,
            data: { ...patientData, dob: ptDemographic?.dob }
        });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};
const getProfileDetail = async (req, res) => {
    try {
        const userId = req.params.id;

        // Determine if it's ObjectId or unique_id
        const isObjectId = userId?.length === 24;

        const user = await User
            .findOne(isObjectId ? { _id: userId } : { unique_id: userId })
            .select('-password')
            .lean();

        if (!user) {
            return res.status(404).json({ success: false, message: 'Patient not found' });
        }

        const fullId = user._id;

        // Run all queries in parallel
        const [
            patient,
            kyc,
            medicalHistory,
            demographic,
            prescription,
            labAppointment,isRequest,allowEdit
        ] = await Promise.all([
            Patient.findOne({ userId: fullId }).lean(),
            PatientKyc.findOne({ userId: fullId }).sort({ createdAt: -1 }).lean(),
            MedicalHistory.findOne({ userId: fullId }).sort({ createdAt: -1 }).lean(),
            PatientDemographic.findOne({ userId: fullId }).sort({ createdAt: -1 }).lean(),
            PatientPrescriptions.findOne({ userId: fullId }).sort({ createdAt: -1 }).lean(),
            LabAppointment.find({ patientId: fullId }).sort({ createdAt: -1 }).lean(),
            EditRequest.findOne({ patientId: fullId }),
            EditRequest.exists({patientId:fullId,status:'approved'}).then(Boolean)
        ]);

        return res.status(200).json({
            success: true,
            user: patient,
            kyc,customId:user.unique_id,role:user.role,
            labAppointment,
            demographic,
            prescription,
            medicalHistory,isRequest,allowEdit
        });

    } catch (err) {
        return res.status(500).json({ success: false, message: err.message });
    }
};
const getPatientProfile = async (req, res) => {
    try {
        const userId = req.params.id;

        // Determine if it's ObjectId or unique_id
        const isObjectId = userId?.length === 24;

        const user = await User
            .findOne(isObjectId ? { _id: userId } : { unique_id: userId })
            .select('-password')
            .lean();

        if (!user) {
            return res.status(404).json({ success: false, message: 'Patient not found' });
        }

        const fullId = user._id;

        // Run all queries in parallel
        const [
            patient,            
            medicalHistory,
            demographic,
            prescription,
        ] = await Promise.all([
            Patient.findOne({ userId: fullId }).lean(),
            MedicalHistory.findOne({ userId: fullId }).sort({ createdAt: -1 }).lean(),
            PatientDemographic.findOne({ userId: fullId }).sort({ createdAt: -1 }).lean(),
            PatientPrescriptions.findOne({ userId: fullId }).sort({ createdAt: -1 }).lean(),
        ]);

        return res.status(200).json({
            success: true,
            user: patient,
            customId:user.unique_id,role:user.role,
            demographic,
            prescription,
            medicalHistory,
        });

    } catch (err) {
        return res.status(500).json({ success: false, message: err.message });
    }
};

const deletePatient = async (req, res) => {
    const userId = req.user.user
    try {
        const user = await Patient.findById(userId)
        if (!user) {
            return res.status(404).json({ success: false, message: 'Patient not found' });
        }
        await Otp.deleteMany({ userId })
        await Login.deleteMany({ userId })
        await User.findOneAndDelete({ patientId: userId })
        await Patient.findByIdAndDelete(userId)
        return res.status(200).json({
            success: true,
        });
    } catch (err) {
        return res.status(500).json({ success: false, message: err.message });
    }
};

const patientKyc = async (req, res) => {
    const { userId, type } = req.body;
    const frontImage = req.files?.['frontImage']?.[0]?.path
    const backImage = req.files?.['backImage']?.[0]?.path
    try {
        const user = await User.findById(userId)
        if (!user) return res.status(200).json({ message: "User not found", success: false })
        const data = await PatientKyc.findOne({ userId });
        if (data) {
            if (frontImage && data.frontImage) {
                safeUnlink(data.frontImage)
            }
            if (backImage && data.backImage) {
                safeUnlink(data.backImage)
            }
            await PatientKyc.findByIdAndUpdate(data._id, { frontImage, backImage, type }, { new: true })

            return res.status(200).json({
                success: true,
                message: "Kyc update successfully",
            });
        } else {
            await PatientKyc.create({ frontImage, backImage, userId, type })

            return res.status(200).json({
                success: true,
                message: "Kyc saved successfully",
            });
        }
    } catch (error) {
        if (frontImage && fs.existsSync(frontImage)) {
            fs.unlinkSync(frontImage)
        }
        if (backImage && fs.existsSync(backImage)) {
            fs.unlinkSync(backImage)
        }
        console.error("Error saving profile image:", error);
        return res.status(500).json({
            success: false,
            message: "Internal Server Error",
        });
    }
};
const patientDemographic = async (req, res) => {
    const { userId, bloodGroup, height, weight, dob } = req.body;

    try {
        const user = await User.findById(userId)
        if (!user) return res.status(200).json({ message: "User not found", success: false })

        const data = await PatientDemographic.findOne({ userId });
        if (data) {
            await PatientDemographic.findByIdAndUpdate(data._id, { bloodGroup, height, weight, dob }, { new: true })

            return res.status(200).json({
                success: true,
                message: "Demographic update successfully",
            });
        } else {
            await PatientDemographic.create({ bloodGroup, height, weight, dob, userId })

            return res.status(200).json({
                success: true,
                message: "Demographic saved successfully",
            });
        }
    } catch (error) {
        console.log(error)
        return res.status(500).json({
            success: false,
            message: "Internal Server Error",
        });
    }
};
const getPatientDemographic = async (req, res) => {
    const userId = req.params.id;

    try {
        const user = await User.findById(userId)
        if (!user) return res.status(200).json({ message: "User not found", success: false })

        const data = await PatientDemographic.findOne({ userId });

        return res.status(200).json({
            success: true,
            data,
            message: "Demographic fetch successfully",
        });

    } catch (error) {
        return res.status(500).json({
            success: false,
            message: "Internal Server Error",
        });
    }
};
const getPatientKyc = async (req, res) => {
    const userId = req.params.id;

    try {
        const user = await User.findById(userId)
        if (!user) return res.status(200).json({ message: "User not found", success: false })

        const data = await PatientKyc.findOne({ userId });
        if (data) {
            return res.status(200).json({
                success: true,
                data,
                message: "Kyc fetch successfully",
            });
        }
        return res.status(200).json({
            success: false,
            message: "Kyc not found ",
        });

    } catch (error) {
        return res.status(500).json({
            success: false,
            message: "Internal Server Error",
        });
    }
};
const patientMedicalHistory = async (req, res) => {
    const { userId, alcohol, smoking, allergies, medicationDetail, onMedication, chronicCondition, familyHistory } = req.body;
    try {
        const user = await User.findById(userId)
        if (!user) return res.status(200).json({ message: "User not found", success: false })

        const data = await MedicalHistory.findOne({ userId });
        if (data) {
            await MedicalHistory.findByIdAndUpdate(data._id, { alcohol, smoking, allergies, medicationDetail, onMedication, chronicCondition, familyHistory }, { new: true })

            return res.status(200).json({
                success: true,
                message: "Medical History update successfully",
            });
        } else {
            await MedicalHistory.create({ alcohol, smoking, allergies, medicationDetail, onMedication, chronicCondition, familyHistory, userId })

            return res.status(200).json({
                success: true,
                message: "Medical History saved successfully",
            });
        }
    } catch (error) {
        return res.status(500).json({
            success: false,
            message: "Internal Server Error",
        });
    }
};
const getMedicalHistory = async (req, res) => {
    const userId = req.params.id;

    try {
        const user = await User.findById(userId)
        if (!user) return res.status(200).json({ message: "User not found", success: false })

        const data = await MedicalHistory.findOne({ userId });
        if (data) {
            return res.status(200).json({
                success: true,
                data,
                message: "Medical History fetch successfully",
            });
        }

        return res.status(200).json({
            success: false,
            message: "Medical History not found",
        });

    } catch (error) {
        return res.status(500).json({
            success: false,
            message: "Internal Server Error",
        });
    }
};
const familyMedicalHistory = async (req, res) => {
    const { userId, familyHistory } = req.body;
    try {
        const user = await User.findById(userId)
        if (!user) return res.status(200).json({ message: "User not found", success: false })

        const data = await MedicalHistory.findOne({ userId });
        if (data) {
            await MedicalHistory.findByIdAndUpdate(data._id, { familyHistory }, { new: true })

            return res.status(200).json({
                success: true,
                message: "Medical History update successfully",
            });
        }
    } catch (error) {
        return res.status(500).json({
            success: false,
            message: "Internal Server Error",
        });
    }
};
const addPrescriptions = async (req, res) => {
    try {
        const { userId } = req.body;
        const user = await User.findById(userId)
        if (!user) return res.status(200).json({ message: "User not found", success: false })
        let prescriptionsData = req.body.prescriptions;
        // If prescriptions data comes as JSON string (from multipart/form-data), parse it
        if (typeof prescriptionsData === "string") {
            try {
                prescriptionsData = JSON.parse(prescriptionsData);
            } catch (err) {
                return res.status(400).json({ success: false, error: "Invalid prescriptions data JSON" });
            }
        }

        // Ensure prescriptionsData is an array
        if (!Array.isArray(prescriptionsData)) {
            prescriptionsData = [prescriptionsData];
        }

        const files = req.files || [];

        // Find existing prescriptions document for the user
        let userPrescriptionsDoc = await PatientPrescriptions.findOne({ userId });

        if (!userPrescriptionsDoc) {
            // No existing doc, create new one
            // Attach uploaded file paths to prescriptions
            prescriptionsData.forEach((prescription, i) => {
                if (prescription && files[i]) {
                    prescription.fileUrl = files[i].path;
                }
            });
            console.log(prescriptionsData)
            const created = await PatientPrescriptions.create({
                userId,
                prescriptions: prescriptionsData,
            });

            return res.status(201).json({
                success: true,
                message: "Prescriptions created successfully",
                data: created,
            });
        }

        // If doc exists, update or add prescriptions
        prescriptionsData.forEach((newPresc, index) => {
            if (!newPresc) return; // skip if undefined

            const existingPresc = userPrescriptionsDoc.prescriptions.id(newPresc._id);

            if (existingPresc) {
                // Update existing prescription
                if (files[index]) {
                    safeUnlink(existingPresc.fileUrl);
                    existingPresc.fileUrl = files[index].path;
                }

                existingPresc.name = newPresc.name || existingPresc.name;
                existingPresc.diagnosticName = newPresc.diagnosticName || existingPresc.diagnosticName;
                // update other fields similarly if needed

            } else {
                // Add new prescription
                if (files[index]) {
                    newPresc.fileUrl = files[index].path;
                }
                userPrescriptionsDoc.prescriptions.push(newPresc);
            }
        });

        await userPrescriptionsDoc.save();

        return res.status(200).json({
            success: true,
            message: "Prescriptions updated successfully",
            data: userPrescriptionsDoc,
        });
    } catch (err) {
        console.error(err);
        return res.status(500).json({ success: false, error: err.message });
    }
};




const deletePrescription = async (req, res) => {
    try {
        const { id, itemId } = req.params;

        const record = await PatientPrescriptions.findById(id);
        const item = record.prescriptions.id(itemId);

        if (!item) return res.status(404).json({ success: false, message: "Not found" });

        safeUnlink(item.fileUrl);

        item.deleteOne();
        await record.save();

        return res.json({ success: true, message: "Prescription deleted" });

    } catch (err) {
        return res.status(500).json({ success: false, error: err.message });
    }
};
const updateImage = async (req, res) => {
    const { userId } = req.body;
    const image = req.files?.['profileImage']?.[0]?.path
    try {
        const user = await Patient.findById(userId)
        if (!user) return res.status(200).json({ message: "Patient not found", success: false })

        if (user.image) {
            safeUnlink(user.profileImage)
        }
        await Doctor.findByIdAndUpdate(user._id, { profileImage: image }, { new: true })

        return res.status(200).json({
            success: true,
            message: "Profile image saved successfully",
        });
    } catch (error) {
        return res.status(500).json({
            success: false,
            message: "Internal Server Error",
        });
    }
};
const editRequest = async (req, res) => {
    const { patientId, message } = req.body;
    try {
        const user = await User.findById(patientId)
        if (!user) return res.status(200).json({ message: "Patient not found", success: false })


        await EditRequest.create({ patientId, message, type: 'patient' })

        return res.status(200).json({
            success: true,
            message: "Request successfully send to admin",
        });
    } catch (error) {
        return res.status(500).json({
            success: false,
            message: "Internal Server Error",
        });
    }
};
const getNameProfile = async (req, res) => {
    const name = req.params.name;

    try {
        const users = await Patient.find({ name: { $regex: name, $options: "i" } })
            .select('-password')
            .sort({ createdAt: -1 })
            .limit(10)
            .lean();

        if (!users || users.length === 0) {
            return res.status(404).json({
                success: false,
                message: "No users found with that name"
            });
        }

        return res.status(200).json({
            success: true,
            data: users
        });

    } catch (err) {
        return res.status(500).json({
            success: false,
            message: err.message
        });
    }
};

export {
    signInPatient, updateImage, addPrescriptions, getProfileDetail, editRequest, deletePrescription, signUpPatient, resetPassword, patientKyc, patientDemographic, patientMedicalHistory, forgotEmail, verifyOtp, resendOtp, getProfile, updatePatient, changePassword, deletePatient,
    getPatientDemographic, getCustomProfile, getNameProfile, familyMedicalHistory, getPatientKyc, getMedicalHistory,getPatientProfile
}
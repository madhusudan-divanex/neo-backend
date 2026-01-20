

import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import sendEmail from '../../utils/sendMail.js'
import Otp from '../../models/Laboratory/otp.model.js';
import Login from '../../models/Laboratory/login.model.js';
import fs from 'fs'
import EditRequest from '../../models/EditRequest.js';
import LabAddress from '../../models/Laboratory/labAddress.model.js';
import Laboratory from '../../models/Laboratory/laboratory.model.js';
import LabPerson from '../../models/Laboratory/contactPerson.model.js';
import LabImage from '../../models/Laboratory/labImages.model.js';
import Rating from '../../models/Rating.js';
import LabLicense from '../../models/Laboratory/labLicense.model.js';
import mongoose from 'mongoose';
import safeUnlink from '../../utils/globalFunction.js';
import LabAppointment from '../../models/LabAppointment.js';
import TestReport from '../../models/testReport.js';
import Test from '../../models/Laboratory/test.model.js';
import Patient from '../../models/Patient/patient.model.js';
import { generateReportPDF } from '../../utils/pdfMaker.js';
import LabStaff from '../../models/Laboratory/LabEmpPerson.model.js';
import EmpAccess from '../../models/Laboratory/empAccess.model.js';
import User from '../../models/Hospital/User.js';
import { error } from 'console';
import path from 'path'

const signUpLab = async (req, res) => {
    const { name, gender, email, contactNumber, password, gstNumber, about, labId, created_by_id } = req.body;
    const logo = req.files?.['logo']?.[0]?.path
    try {
        if (labId) {
            const isExist = await Laboratory.findById(labId)
            if (!isExist) {
                return res.status(200).json({ message: "Lab not exist", success: false })
            }
            if (logo && isExist.logo) {
                safeUnlink(isExist.logo)
            }
            const isMax = await Laboratory.countDocuments({ email })
            if (isMax > 1) {
                return res.status(200).json({ message: "Email already exist", success: false })
            }
            // Create user
            const newLab = await Laboratory.findByIdAndUpdate(labId, {
                name,
                gender,
                email,
                contactNumber,
                gstNumber, about, logo
            }, { new: true });

            if (newLab) {
                await User.findOneAndUpdate(labId, { email, name, created_by_id, created_by: "self" }, { new: true })
                return res.status(200).json({ success: true, });
            } else {
                return res.status(200).json({ success: false, message: "Lab not updated" });
            }
        } else {
            const isExist = await Laboratory.findOne({ email })
            if (isExist) {
                return res.status(200).json({ message: "Lab already exist", success: false })
            }
            const isUser = await User.findOne({ email })
            if (isUser) {
                return res.status(200).json({ message: "User already exist", success: false })
            }
            const isLast = await User.findOne()?.sort({ createdAt: -1 })
            const nextId = isLast
                ? String(Number(isLast.customId) + 1).padStart(4, '0')
                : '0001';
            const hashedPassword = await bcrypt.hash(password, 10);
            // Create user
            const newLab = await Laboratory.create({
                name,
                gender,
                email,
                contactNumber,
                password: hashedPassword,
                gstNumber, about, logo,
                customId: nextId
            });

            if (newLab) {
                const userData = await User.create({ name, email, role: 'lab', passwordHash: hashedPassword, labId: newLab?._id, created_by: 'self' })
                newLab.userId = userData?._id
                await newLab.save()
                const token = jwt.sign(
                    { user: newLab._id },
                    process.env.JWT_SECRET,
                    // { expiresIn: isRemember ? "30d" : "1d" }
                );
                return res.status(200).json({ success: true, userId: userData?._id, token });
            } else {
                return res.status(200).json({ success: false, message: "Lab not created" });
            }
        }

    } catch (err) {
        console.error(err);
        if (logo && fs.existsSync(logo)) {
            fs.unlinkSync(logo)
        }
        return res.status(500).json({ message: 'Server Error' });
    }
}
const signInLab = async (req, res) => {
    const { email, password } = req.body;
    try {
        const labPerson = await EmpAccess.findOne({ email }).populate('permissionId')
        if (labPerson && labPerson.password == password) {
            const empData = await LabStaff.findById(labPerson.empId)
            const token = jwt.sign(
                { user: empData.labId },
                process.env.JWT_SECRET,
                // { expiresIn: isRemember ? "30d" : "1d" }
            );
            return res.status(200).json({ message: "Login success", user: labPerson, staffId: labPerson.empId, userId: empData.labId, isOwner: false, token, success: true })
        }
        const isExist = await User.findOne({ email });
        if (!isExist) return res.status(200).json({ message: 'Lab not Found', success: false });
        const hashedPassword = isExist.passwordHash
        const isMatch = await bcrypt.compare(password, hashedPassword);
        if (!isMatch) return res.status(200).json({ message: 'Invalid email or password', success: false });
        const token = jwt.sign(
            { user: isExist._id },
            process.env.JWT_SECRET,
            // { expiresIn: isRemember ? "30d" : "1d" }
        );
        const userData = await Laboratory.findById(isExist?.labId)
        const [
            image,
            address,
            person,
            license,
        ] = await Promise.all([
            LabImage.findOne({ userId: isExist._id }),
            LabAddress.findOne({ userId: isExist._id }),
            LabPerson.findOne({ userId: isExist._id }),
            LabLicense.findOne({
                userId: isExist._id,
            }),
        ]);

        let nextStep = null;

        if (!image) {
            nextStep = "/create-account-image";
        } else if (!address) {
            nextStep = "/create-account-address";
        } else if (!person) {
            nextStep = "/create-account-person";
        } else if (!license) {
            nextStep = "/create-account-upload";
        }
        const isLogin = await Login.findOne({ userId: isExist._id })
        if (isLogin) {
            await Login.findByIdAndUpdate(isLogin._id, {}, { new: true })
            return res.status(200).json({ message: "Login success", user: isExist, nextStep, isOwner: true, userId: isExist._id, token, isNew: false, success: true })
        } else {
            await Login.create({ userId: isExist._id })
            return res.status(200).json({ message: "Login success", user: isExist, nextStep, isNew: true, isOwner: true, token, userId: isExist._id, success: true })
        }
    } catch (err) {
        console.error(err);
        return res.status(500).json({ message: 'Server Error' });
    }
}
const verifyOtp = async (req, res) => {
    const { userId, code } = req.body
    try {
        const userData = await Laboratory.findById(userId)
        if (!isExist) {
            return res.status(200).json({ message: "Lab not exist", success: false })
        }
        const isOtp = await Otp.findOne({ code })
        if (!isOtp) {
            return res.status(200).json({ message: "Code not exist", success: false })
        }
        const otpExpiryTime = new Date(isOtp.updatedAt);
        otpExpiryTime.setMinutes(otpExpiryTime.getMinutes() + 10);

        if (new Date() > otpExpiryTime) {
            return res.status(200).json({ message: "OTP Expired", success: false });
        }
        const isValid = code == isOtp.code
        let isNew = true;
        const isLogin = await Login.findOne({ userId })
        if (isLogin) {
            isNew = false;
        }

        if (isValid) {
            const token = jwt.sign(
                { user: isExist._id },
                process.env.JWT_SECRET,
                // { expiresIn: isRemember ? "30d" : "1d" }
            );
            return res.status(200).json({ message: "Verify Success", token, userId: isExist._id, user: isExist, success: true })
        } else {
            return res.status(200).json({ message: "Invalid credentials", success: false })
        }
    } catch (err) {
        return res.status(400).json({ success: false, error: err.message });
    }
};
const resendOtp = async (req, res) => {
    const id = req.params.id
    try {
        const isExist = await Laboratory.findById(id);
        if (!isExist) {
            return res.status(404).json({ success: false, message: 'Lab not found' });
        }
        const code = generateOTP()
        const isOtpExist = await Otp.findOne({ userId: isExist._id })
        if (isOtpExist) {
            await Otp.findByIdAndDelete(isOtpExist._id)
            const otp = await Otp.create({ userId: isExist._id, code })
        } else {
            const otp = await Otp.create({ userId: isExist._id, code })
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
        return res.status(200).json({
            success: true,
            userId: isExist._id,
            message: "OTP sent!"
        });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};

const forgotEmail = async (req, res) => {
    const { email } = req.body
    try {
        const user = await User.findOne({ email });
        if (!user) {
            return res.status(404).json({ success: false, message: 'Lab not found' });
        }
        const code = generateOTP()
        const isOtpExist = await Otp.findOne({ userId: user._id })
        if (isOtpExist) {
            await Otp.findByIdAndDelete(isOtpExist._id)
            const otp = await Otp.create({ userId: user._id, code })
        } else {
            const otp = await Otp.create({ userId: user._id, code })
        }
        const emailHtml = `
            Hello ${user?.name}, 
            Your One-Time Password (OTP) for Neo Health is: ${code} 
            This OTP is valid for 10 minutes. Please do not share it with anyone.
            If you did not request this, please ignore this email.
            Thank you,
            The Neo Health Team
        `;
        await sendEmail({
            to: email,
            subject: "You password reset for Neo Health!",
            html: emailHtml
        });
        return res.status(200).json({
            success: true,
            message: "Mail sent!",
            userId: user._id
        });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};

const resetPassword = async (req, res) => {
    const { userId, password } = req.body;
    try {
        const isExist = await User.findById(userId);
        if (!isExist) return res.status(400).json({ message: 'Invalid email' });
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
        const updatePass = await User.findByIdAndUpdate(userId, { password: hashedPassword }, { new: true })
        if (updatePass) {
            return res.status(200).json({ message: "Password change successfully", userId: isExist._id, success: true })
        } else {
            return res.status(200).json({ message: "Error occure in password reset", success: false })
        }
    } catch (err) {
        console.error(err);
        return res.status(500).json({ message: 'Server Error' });
    }
}
const updateLab = async (req, res) => {
    const { userId, email, contactNumber, name, gender, gstNumber, about } = req.body;
    const logo = req.files?.['logo']?.[0]?.path
    try {
        const isExist = await Laboratory.findById(userId);
        if (!isExist) return res.status(200).json({ message: 'Lab not exist' });
        const alreadyEmail = await Laboratory.countDocuments({ email })
        if (alreadyEmail > 1) {
            return res.status(200).json({ message: 'Email already exist' });
        }
        if (logo && isExist.logo) {
            safeUnlink(isExist.logo)
        }
        const updateLab = await Laboratory.findByIdAndUpdate(userId, { email, contactNumber, name, gender, gstNumber, about, logo: logo || isExist.logo }, { new: true })
        if (updateLab) {
            return res.status(200).json({ message: "Lab data change successfully", userId: isExist._id, success: true })
        } else {
            return res.status(200).json({ message: "Error occure in user data", success: false })
        }
    } catch (err) {
        console.error(err.message);
        if (err.message.includes('duplicate key error collection')) {
            return res.status(200).json({ message: "Email already exist " })
        } else {
            return res.status(200).json({ message: 'Server Error' });
        }
    }
}

function generateOTP() {
    return Math.floor(1000 + Math.random() * 900000).toString();
}

const getProfile = async (req, res) => {
    const id = req.params.id
    try {
        const user = await User.findById(id)
        if (!user) {
            return res.status(404).json({ success: false, message: 'Lab not found' });
        }
        const labData = await Laboratory.findById(user.labId)
        return res.status(200).json({
            success: true,
            data: labData
        });
    } catch (err) {
        return res.status(500).json({ success: false, message: err.message });
    }
};
const getProfileDetail = async (req, res) => {
    const userId = req.params.id;

    try {
        // 1️⃣ Find user
        const user = await User.findById(userId)
        if (!user) {
            return res.status(404).json({
                success: false,
                message: "Lab not found"
            });
        }
        const labData = await Laboratory.findById(user.labId).select("-password");

        // 2️⃣ Fetch latest related documents
        const labPerson = await LabPerson.findOne({ userId }).sort({ createdAt: -1 });
        const labAddress = await LabAddress.findOne({ userId }).populate('countryId stateId cityId').sort({ createdAt: -1 });
        const labImg = await LabImage.findOne({ userId }).sort({ createdAt: -1 });
        const labLicense = await LabLicense.findOne({ userId }).sort({ createdAt: -1 });
        const isRequest = Boolean(await EditRequest.exists({ labId: user?._id }))
        const allowEdit = Boolean(await EditRequest.exists({ labId: user?._id, status: "approved" }))

        // 3️⃣ Fetch ratings
        const rating = await Rating.find({ labId: user?.labId })
            .populate("patientId")
            .sort({ createdAt: -1 });

        // 4️⃣ Calculate average rating
        const avgStats = await Rating.aggregate([
            { $match: { labId: new mongoose.Types.ObjectId(user?.labId) } },
            {
                $group: {
                    _id: null,
                    avgRating: { $avg: "$star" },
                    total: { $sum: 1 }
                }
            }
        ]);

        const avgRating = avgStats.length ? avgStats[0].avgRating : 0;

        // 5️⃣ Count star ratings
        const ratingStats = await Rating.aggregate([
            { $match: { labId: new mongoose.Types.ObjectId(userId) } },
            {
                $group: {
                    _id: "$star",
                    count: { $sum: 1 }
                }
            }
        ]);

        let ratingCounts = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
        ratingStats.forEach(r => {
            ratingCounts[r._id] = r.count;
        });

        // 6️⃣ Return final response
        return res.status(200).json({
            success: true,
            user: labData,
            labPerson,
            labAddress,
            labImg,
            labLicense, customId: user.unique_id,
            rating, allowEdit,
            avgRating,
            ratingCounts,
            isRequest
        });

    } catch (err) {
        return res.status(500).json({
            success: false,
            message: err.message
        });
    }
};

const deleteLab = async (req, res) => {
    const userId = req.user.user
    try {
        const user = await User.findById(userId)
        if (!user) {
            return res.status(404).json({ success: false, message: 'Lab not found' });
        }
        await User.deleteOne({ labId: userId })
        await Otp.deleteMany({ userId })
        await Login.deleteMany({ userId })
        await Laboratory.findByIdAndDelete(userId)
        return res.status(200).json({
            success: true,
        });
    } catch (err) {
        return res.status(500).json({ success: false, message: err.message });
    }
};
const labAddress = async (req, res) => {
    const { userId, fullAddress, countryId, stateId, cityId, pinCode } = req.body;
    try {
        const user = await User.findById(userId)
        if (!user) return res.status(200).json({ message: "User not found", success: false })

        const data = await LabAddress.findOne({ userId });
        if (data) {
            await LabAddress.findByIdAndUpdate(data._id, { fullAddress, countryId, stateId, cityId, pinCode, userId }, { new: true })
            return res.status(200).json({
                success: true,
                message: "Lab address update successfully",
            });
        } else {
            await LabAddress.create({ fullAddress, countryId, stateId, cityId, pinCode, userId })
            return res.status(200).json({
                success: true,
                message: "Lab address saved successfully",
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
const labPerson = async (req, res) => {
    const { userId, name, email, contactNumber, gender } = req.body;
    const photo = req.files?.['photo']?.[0]?.path
    try {
        const user = await User.findById(userId)
        if (!user) return res.status(200).json({ message: "User not found", success: false })

        const data = await LabPerson.findOne({ userId });
        if (data) {
            if (photo && data.photo) {
                safeUnlink(data.photo)
            }
            await LabPerson.findByIdAndUpdate(data._id, { name, email, contactNumber, gender, photo, userId }, { new: true })
            return res.status(200).json({
                success: true,
                message: "Lab person update successfully",
            });
        } else {
            await LabPerson.create({ name, email, contactNumber, gender, photo, userId })
            return res.status(200).json({
                success: true,
                message: "Lab person saved successfully",
            });
        }
    } catch (error) {
        if (fs.existsSync(photo)) {
            fs.unlinkSync(photo)
        }
        console.log(error)
        return res.status(500).json({
            success: false,
            message: "Internal Server Error",
        });
    }
};
const labLicense = async (req, res) => {
    try {
        const { userId, labLicenseNumber } = req.body;

        // Check user exists
        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({
                message: "User not found",
                success: false
            });
        }

        let certificateList = [];
        if (req.body.labCert) {
            certificateList = JSON.parse(req.body.labCert);
        }

        if (req.files?.certFiles) {
            let fileIdx = 0;
            certificateList.forEach((cert, idx) => {
                if (!cert.certFile && req.files.certFiles[fileIdx]) {
                    cert.certFile = req.files.certFiles[fileIdx].path;
                    fileIdx++;
                }
            });

            for (; fileIdx < req.files.certFiles.length; fileIdx++) {
                certificateList.push({
                    certName: "New Certificate", // fallback name, can be updated on frontend
                    certFile: req.files.certFiles[fileIdx].path
                });
            }
        }

        // Handle license file upload
        let licenseFilePath = null;
        if (req.files?.licenseFile && req.files.licenseFile[0]) {
            licenseFilePath = req.files.licenseFile[0].path;
        }

        // Fetch existing license
        const existing = await LabLicense.findOne({ userId });

        if (existing) {
            // Delete replaced certificate files
            existing.labCert.forEach((cert) => {
                const replaced = certificateList.find(c => c.certFile === cert.certFile);
                if (!replaced && cert.certFile && req.files?.certFiles) {
                    safeUnlink(cert.certFile);
                }
            });

            // Delete old license file if replaced
            if (licenseFilePath && existing.licenseFile) {
                safeUnlink(existing.licenseFile);
            }

            // Update license document
            const updated = await LabLicense.findByIdAndUpdate(
                existing._id,
                {
                    labCert: certificateList,
                    labLicenseNumber,
                    licenseFile: licenseFilePath || existing.licenseFile,
                },
                { new: true }
            );

            return res.status(200).json({
                success: true,
                message: "License updated successfully",
                data: updated,
            });
        }

        // Create new license if none exists
        const created = await LabLicense.create({
            userId,
            labCert: certificateList,
            labLicenseNumber,
            licenseFile: licenseFilePath,
        });

        return res.status(200).json({
            success: true,
            message: "License saved successfully",
            data: created,
        });

    } catch (error) {
        console.error("Error:", error);
        return res.status(500).json({
            success: false,
            message: "Internal Server Error",
        });
    }
};


const deleteLicense = async (req, res) => {
    try {
        const { id, itemId } = req.params;
        const record = await MedicalLicense.findById(id);
        const item = record.medicalLicense.id(itemId);
        if (!item) return res.status(404).json({ success: false, message: "Not found" });
        safeUnlink(item.certFile)
        item.remove();
        await record.save();

        return res.json({ success: true, message: "Education deleted" });

    } catch (err) {
        return res.status(500).json({ success: false, error: err.message });
    }
};
const updateImage = async (req, res) => {
    const { userId } = req.body;
    const logo = req.files?.['logo']?.[0]?.path
    try {
        const user = await Laboratory.findById(userId)
        if (!user) return res.status(200).json({ message: "Lab not found", success: false })

        if (logo && user.logo) {
            safeUnlink(user.logo)
        }
        await Laboratory.findByIdAndUpdate(user._id, { logo }, { new: true })
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
const labImage = async (req, res) => {
    const { userId } = req.body;

    const thumbnailFile = req.files?.['thumbnail']?.[0]?.path;
    const labImgFiles = req.files?.['labImg'] || [];
    try {
        const lab = await User.findById(userId);
        if (!lab) return res.status(200).json({ success: false, message: "Lab not found" });

        let labImageData = await LabImage.findOne({ userId });

        if (labImageData) {
            if (thumbnailFile && labImageData.thumbnail) {
                safeUnlink(labImageData.thumbnail);
            }
            if (labImgFiles.length > 0 && labImageData.labImg?.length) {
                labImageData.labImg.forEach(img => safeUnlink(img));
            }
            labImageData.thumbnail = thumbnailFile || labImageData.thumbnail;
            labImageData.labImg = labImgFiles.length > 0 ? labImgFiles.map(f => f.path) : labImageData.labImg;

            await labImageData.save();

            return res.status(200).json({
                success: true,
                message: "Lab images updated successfully",
                data: labImageData
            });
        } else {
            // Create new
            labImageData = await LabImage.create({
                userId,
                thumbnail: thumbnailFile,
                labImg: labImgFiles.map(f => f.path)
            });

            return res.status(200).json({
                success: true,
                message: "Lab images saved successfully",
                data: labImageData
            });
        }

    } catch (error) {
        // Clean up uploaded files if error
        if (thumbnailFile) safeUnlink(thumbnailFile);
        if (labImgFiles.length > 0) labImgFiles.forEach(f => safeUnlink(f.path));

        return res.status(500).json({
            success: false,
            message: error.message
        });
    }
};
const editRequest = async (req, res) => {
    const { labId, message } = req.body;
    try {
        const user = await User.findById(labId)
        if (!user) return res.status(200).json({ message: "Lab not found", success: false })
        await EditRequest.create({ labId, message, type: 'lab' })
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

const deleteLabImage = async (req, res) => {
    const { labId, path, type } = req.body;
    try {
        const user = await User.findById(labId)
        if (!user) return res.status(200).json({ message: "Lab not found", success: false })
        if (type == 'thumbnail') {
            await LabImage.findOneAndUpdate({ userId: labId }, { thumbnail: '' }, { new: true })
            safeUnlink(path)
            return res.status(200).json({
                success: true,
                message: "Image deleted",
            });
        } else {
            const imgDoc = await LabImage.findOne({ userId: labId });
            await LabImage.findOneAndUpdate({ userId: labId }, { $pull: { labImg: path }, }, { new: true })
            safeUnlink(path)
            return res.status(200).json({
                success: true,
                message: "Image deleted",
            });
        }
    } catch (error) {
        return res.status(500).json({
            success: false,
            message: "Internal Server Error",
        });
    }
};

const sendReport = async (req, res) => {
    const { type, appointmentId, email } = req.body;
    try {
        const appointment = await LabAppointment.findById(appointmentId)
        if (!appointment) return res.status(200).json({ message: "Appointment not found", success: false })
        const tests = await Test.find({
            _id: { $in: appointment.testId }
        });
        const ptData = await User.findById(appointment?.patientId)
        const labData = await Laboratory.findById(appointment?.labId)

        const testReports = await TestReport.find({ appointmentId })
        const pdfBuffer = await generateReportPDF(appointment, tests, testReports, ptData, labData);
        const attachments = [
            {
                filename: "lab-report.pdf",
                content: pdfBuffer,
                contentType: "application/pdf",
            }
        ];

        // uploaded reports attach karo
        testReports.forEach(report => {
            // if (Array.isArray(report.upload?.report)) {
                // report.upload.report.forEach(filePath => {
                    attachments.push({
                        filename: path.basename(report.upload?.report), // extract file name from path
                        path: path.join(process.cwd(), report.upload?.report), // local file path
                    });
                // });
            // }
        });

        await sendEmail({
            to: email,
            subject: "Your Lab Report",
            html: "<p>Your lab report is attached.</p>",
            attachments
        });


        return res.status(200).json({
            success: true,
            message: "Report successfully send",
        });
    } catch (error) {
        console.log(error)
        return res.status(500).json({
            success: false,
            message: "Internal Server Error",
        });
    }
};
const getLabs = async (req, res) => {
    const limit = parseInt(req.query.limit) || 10;
    const page = parseInt(req.query.page) || 1;

    try {
        // 1️⃣ Fetch lab users
        const users = await User.find({ role: {$in:['lab']} })
            .select('-passwordHash')
            .populate('labId')
            .limit(limit)
            .skip((page - 1) * limit)
            .lean();

        const labIds = users.map(u => u._id);

        // 2️⃣ Fetch addresses
        const labAddresses = await LabAddress.find({
            userId: { $in: labIds }
        })
            .populate('countryId stateId cityId', 'name')
            .lean();

        const addressMap = {};
        labAddresses.forEach(addr => {
            addressMap[addr.userId.toString()] = addr;
        });

        // 3️⃣ Fetch rating stats (AVG + COUNT)
        const ratingStats = await Rating.aggregate([
            {
                $match: {
                    labId: { $in: labIds }
                }
            },
            {
                $group: {
                    _id: "$labId",
                    avgRating: { $avg: "$star" },
                    totalReviews: { $sum: 1 }
                }
            }
        ]);

        const ratingMap = {};
        ratingStats.forEach(r => {
            ratingMap[r._id.toString()] = {
                avgRating: Number(r.avgRating.toFixed(1)),
                totalReviews: r.totalReviews
            };
        });

        // 4️⃣ Merge everything
        const finalData = users.map(user => ({
            ...user,
            labAddress: addressMap[user._id.toString()] || null,
            avgRating: ratingMap[user._id.toString()]?.avgRating || 0,
            totalReviews: ratingMap[user._id.toString()]?.totalReviews || 0
        }));

        const total = await User.countDocuments({ role: 'lab' });

        return res.status(200).json({
            success: true,
            data: finalData,
            pagination: {
                total,
                totalPage: Math.ceil(total / limit),
                currentPage: page
            }
        });

    } catch (err) {
        console.error(err);
        return res.status(500).json({
            success: false,
            message: err.message
        });
    }
};

const getLabDetail = async (req, res) => {
    const userId = req.params.id;

    try {
        // 1️⃣ Find user
        const user = await User.findById(userId)
        if (!user) {
            return res.status(404).json({
                success: false,
                message: "Lab not found"
            });
        }
        const labData = await Laboratory.findById(user.labId).select("-password");
        const labImage = await LabImage.findOne({ userId: user._id })
        const labAddress = await LabAddress.findOne({ userId }).populate('countryId').populate('stateId')
            .populate('cityId').sort({ createdAt: -1 });
        const labLicense = await LabLicense.findOne({ userId }).sort({ createdAt: -1 });
        const labTest = await Test.find({ labId: user._id }).select('shortName price status')

        // 3️⃣ Fetch ratings
        const rating = await Rating.find({ labId: user?._id })
            .populate({ path: "patientId", select: '-passwordHash', populate: ({ path: 'patientId', select: 'name profileImage' }) })
            .sort({ createdAt: -1 });

        // 4️⃣ Calculate average rating
        const avgStats = await Rating.aggregate([
            { $match: { labId: new mongoose.Types.ObjectId(user?._id) } },
            {
                $group: {
                    _id: null,
                    avgRating: { $avg: "$star" },
                    total: { $sum: 1 }
                }
            }
        ]);

        const avgRating = avgStats.length ? avgStats[0].avgRating : 0;

        // 5️⃣ Count star ratings
        const ratingStats = await Rating.aggregate([
            { $match: { labId: new mongoose.Types.ObjectId(userId) } },
            {
                $group: {
                    _id: "$star",
                    count: { $sum: 1 }
                }
            }
        ]);

        let ratingCounts = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
        ratingStats.forEach(r => {
            ratingCounts[r._id] = r.count;
        });

        // 6️⃣ Return final response
        return res.status(200).json({
            success: true,
            user: labData,
            labAddress,
            labLicense, customId: user.unique_id,
            rating,
            avgRating,
            ratingCounts,
            labImage, labTest
        });

    } catch (err) {
        return res.status(500).json({
            success: false,
            message: err.message
        });
    }
};

export {
    signInLab, updateImage, labLicense, deleteLicense, getProfileDetail, signUpLab, resetPassword, editRequest,
    labPerson, labAddress, forgotEmail, verifyOtp, resendOtp, getProfile, updateLab, changePassword, deleteLab,
    labImage, deleteLabImage, sendReport, getLabs, getLabDetail
}
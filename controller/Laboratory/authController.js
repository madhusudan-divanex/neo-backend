

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

const signUpLab = async (req, res) => {
    const { name, gender, email, contactNumber, password, gstNumber, about } = req.body;
    const logo = req.files?.['logo']?.[0]?.path
    try {
        const isExist = await Laboratory.findOne({ email })
        if (isExist) {
            return res.status(200).json({ message: "Lab already exist", success: false })
        }
        const hashedPassword = await bcrypt.hash(password, 10);

        // Create user
        const newLab = await Laboratory.create({
            name,
            gender,
            email,
            contactNumber,
            password: hashedPassword,
            dob, gstNumber, about, logo
        });

        if (newLab) {
            const code = generateOTP()
            const otp = await Otp.create({ userId: newLaboratory._id, code })
            const emailHtml = `
            Hello ${name}, 
            Your One-Time Password (OTP) for Neo Health is: ${code} 
            This OTP is valid for 10 minutes. Please do not share it with anyone.
            If you did not request this, please ignore this email.
            Thank you,
            The Neo Health Team`
            await sendEmail({
                to: email,
                subject: "Your Neo Health OTP Code!",
                html: emailHtml
            });
            return res.status(200).json({ success: true, newLab, userId: newLaboratory._id });
        } else {
            return res.status(200).json({ success: false, message: "Lab not created" });
        }

    } catch (err) {
        console.error(err);
        return res.status(500).json({ message: 'Server Error' });
    }
}
const signInLab = async (req, res) => {
    const { email, password } = req.body;
    try {
        const isExist = await Laboratory.findOne({ email });
        if (!isExist) return res.status(200).json({ message: 'Lab not Found', success: false });
        const hashedPassword = isExist.password
        const isMatch = await bcrypt.compare(password, hashedPassword);
        if (!isMatch) return res.status(200).json({ message: 'Invalid email or password', success: false });
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
            to: email,
            subject: "You OTP for Neo Health!",
            html: emailHtml
        });
        const isLogin = await Login.findOne({ userId: isExist._id })
        if (isLogin) {
            await Login.findByIdAndUpdate(isLogin._id, {}, { new: true })
            return res.status(200).json({ message: "Email Sent", userId: isExist._id, isNew: false, success: true })
        } else {
            await Login.create({ userId: isExist._id })
            return res.status(200).json({ message: "Email Sent", isNew: true, userId: isExist._id, success: true })
        }
    } catch (err) {
        console.error(err);
        return res.status(500).json({ message: 'Server Error' });
    }
}
const verifyOtp = async (req, res) => {
    const { userId, code } = req.body
    try {
        const isExist = await Laboratory.findById(userId)
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
            message: "OTP sent!"
        });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};

const forgotEmail = async (req, res) => {
    const email = req.params.email
    try {
        const user = await Laboratory.findOne({ email });
        if (!user) {
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
            The Neo Health Team
        `;
        await sendEmail({
            to: email,
            subject: "You password reset for Neo Health!",
            html: emailHtml
        });
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
        const isExist = await Laboratory.findById(userId);
        if (!isExist) return res.status(400).json({ message: 'Invalid email' });
        const hashedPassword = await bcrypt.hash(password, 10);
        const updatePass = await Laboratory.findByIdAndUpdate(userId, { password: hashedPassword }, { new: true })
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
        const isExist = await Laboratory.findById(userId);
        if (!isExist) return res.status(200).json({ message: 'Invalid email' });
        const isMatch = await bcrypt.compare(oldPassword, isExist.password);
        if (!isMatch) return res.status(200).json({ message: 'Old password is incorrect', success: false });
        const hashedPassword = await bcrypt.hash(newPassword, 10);
        const updatePass = await Laboratory.findByIdAndUpdate(userId, { password: hashedPassword }, { new: true })
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
    return Math.floor(1000 + Math.random() * 9000).toString();
}

const getProfile = async (req, res) => {
    try {
        const user = await Laboratory.findById(req.user.user).select('-password');
        if (!user) {
            return res.status(404).json({ success: false, message: 'Lab not found' });
        }
        return res.status(200).json({
            success: true,
            data: user
        });
    } catch (err) {
        return res.status(500).json({ success: false, message: err.message });
    }
};
const getProfileDetail = async (req, res) => {
    const userId = req.params.id
    try {
        const user = await Laboratory.findById(userId).select('-password');
        if (!user) {
            return res.status(404).json({ success: false, message: 'Lab not found' });
        }
        const labPerson = await LabPerson.findOne({ userId }).sort({ createdAt: -1 })
        const labAddress = await LabAddress.findOne({ userId }).sort({ createdAt: -1 })
        const labImg = await LabImage.findOne({ userId }).sort({ createdAt: -1 })
        const rating = await Rating.find({ labId: userId }).populate('patientId').sort({ createdAt: -1 })
        // const eduWork = await LabEduWork.findOne({ userId }).sort({ createdAt: -1 })
        const avgStats = await Rating.aggregate([
            { $match: { labId: new mongoose.Types.ObjectId(userId) } },
            {
                $group: {
                    _id: null,
                    avgRating: { $avg: "$star" },
                    total: { $sum: 1 }
                }
            }
        ]);
        let ratingCounts = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
        ratingStats.forEach(r => ratingCounts[r._id] = r.count);
        const avgRating = avgStats.length ? avgStats[0].avgRating : 0;
        return res.status(200).json({
            success: true,
            user,
            labPerson,
            labAddress, labImg, rating, avgRating
        });
    } catch (err) {
        return res.status(500).json({ success: false, message: err.message });
    }
};
const deleteLab = async (req, res) => {
    const userId = req.user.user
    try {
        const user = await Laboratory.findById(userId)
        if (!user) {
            return res.status(404).json({ success: false, message: 'Lab not found' });
        }
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
    const { userId, fullAddress, country, state, city, pinCode } = req.body;
    try {
        const user = await Laboratory.findById(userId)
        if (!user) return res.status(200).json({ message: "User not found", success: false })

        const data = await LabAddress.findOne({ userId });
        if (data) {
            await LabAddress.findByIdAndUpdate(data._id, { fullAddress, country, state, city, pinCode, userId }, { new: true })
            return res.status(200).json({
                success: true,
                message: "Lab address update successfully",
            });
        } else {
            await LabAddress.create({ fullAddress, country, state, city, pinCode, userId })
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
        const user = await Laboratory.findById(userId)
        if (!user) return res.status(200).json({ message: "User not found", success: false })

        const data = await LabPerson.findOne({ userId });
        if (data) {
            if (photo && data.photo) {
                safeUnlink(data.photo)
            }
            await LabPerson.findByIdAndUpdate(data._id, { name, email, contactNumber, gender, photo, userId }, { new: true })
            return res.status(200).json({
                success: true,
                message: "Education and Work update successfully",
            });
        } else {
            await LabPerson.create({ name, email, contactNumber, gender, photo, userId })
            return res.status(200).json({
                success: true,
                message: "Education and work saved successfully",
            });
        }
    } catch (error) {
        return res.status(500).json({
            success: false,
            message: "Internal Server Error",
        });
    }
};
const labLicense = async (req, res) => {
    try {
        const { userId, labLicenseNumber } = req.body;
        const user = await Laboratory.findById(userId);

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
            req.files.certFiles.forEach((file, idx) => {
                if (certificateList[idx]) {
                    certificateList[idx].certFile = file.path;
                }
            });
        }
        let licenseFilePath = null;
        if (req.files?.licenseFile && req.files.licenseFile[0]) {
            licenseFilePath = req.files.licenseFile[0].path;
        }

        // Fetch existing
        const existing = await LabLicense.findOne({ userId });

        if (existing) {
            if (req.files?.certFiles) {
                existing.labCert.forEach((cert, i) => {
                    if (req.files.certFiles[i]) {
                        safeUnlink(cert.certFile);
                    }
                });
            }

            if (licenseFilePath && existing.licenseFile) {
                safeUnlink(existing.licenseFile);
            }
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
        const lab = await Laboratory.findById(userId);
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
        const user = await Laboratory.findById(labId)
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

export {
    signInLab, updateImage, labLicense, deleteLicense, getProfileDetail, signUpLab, resetPassword, editRequest,
    labPerson, labAddress, forgotEmail, verifyOtp, resendOtp, getProfile, updateLab, changePassword, deleteLab,
    labImage
}
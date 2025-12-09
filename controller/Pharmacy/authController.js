

import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import sendEmail from '../../utils/sendMail.js'
import Otp from '../../models/Pharmacy/otp.model.js';
import Login from '../../models/Pharmacy/login.model.js';
import fs from 'fs'
import EditRequest from '../../models/EditRequest.js';
import PharAddress from '../../models/Pharmacy/pharmacyAddress.model.js';
import Pharmacy from '../../models/Pharmacy/pharmacy.model.js';
import PharPerson from '../../models/Pharmacy/contactPerson.model.js';
import PharImage from '../../models/Pharmacy/pharmacyImg.model.js';
import Rating from '../../models/Rating.js';
import PharLicense from '../../models/Pharmacy/pharmacyLicense.model.js';
import mongoose from 'mongoose';
import safeUnlink from '../../utils/globalFunction.js';

const signUpPhar = async (req, res) => {
    const { name, gender, email, contactNumber, password, gstNumber, about, pharId } = req.body;
    const logo = req.files?.['logo']?.[0]?.path
    try {
        if (pharId) {
            const isExist = await Pharmacy.findById(pharId)
            if (!isExist) {
                return res.status(200).json({ message: "Pharmacymacy not exist", success: false })
            }
            if (logo && isExist.logo) {
                safeUnlink(isExist.logo)
            }
            // Create user
            const newphar = await Pharmacy.findByIdAndUpdate(pharId, {
                name,
                gender,
                email,
                contactNumber,
                gstNumber, about, logo
            }, { new: true });

            if (newphar) {
                return res.status(200).json({ success: true, });
            } else {
                return res.status(200).json({ success: false, message: "Pharmacy not updated" });
            }
        } else {


            const isExist = await Pharmacy.findOne({ email })
            if (isExist) {
                return res.status(200).json({ message: "Pharmacy already exist", success: false })
            }
            const isLast=await Pharmacy.findOne()?.sort({createdAt:-1})
            const nextId = isLast
            ? String(Number(isLast.customId) + 1).padStart(4, '0')
            : '0001';
            const hashedPassword = await bcrypt.hash(password, 10);

            // Create user
            const newphar = await Pharmacy.create({
                name,
                gender,
                email,
                contactNumber,
                password: hashedPassword,
                gstNumber, about, logo,
                customId:nextId
            });

            if (newphar) {
                const token = jwt.sign(
                    { user: newphar._id },
                    process.env.JWT_SECRET,
                    // { expiresIn: isRemember ? "30d" : "1d" }
                );
                return res.status(200).json({ success: true, userId: newphar._id, token });
            } else {
                return res.status(200).json({ success: false, message: "Pharmacy not created" });
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
const signInPhar = async (req, res) => {
    const { email, password } = req.body;
    try {
        // const pharPerson = await EmpAccess.findOne({email}).populate('permissionId')
        // if(pharPerson && pharPerson.password==password){
        //     const empData=await pharStaff.findById(pharPerson.empId)
        //     const token = jwt.sign(
        //         { user: empData.pharId },
        //         process.env.JWT_SECRET,
        //     );
        //     return res.status(200).json({ message: "Login success", user: pharPerson, userId: empData.pharId,isOwner:false, token, success: true })
        // }
        const isExist = await Pharmacy.findOne({ email });
        if (!isExist) return res.status(200).json({ message: 'Phar not Found', success: false });
        const hashedPassword = isExist.password
        const isMatch = await bcrypt.compare(password, hashedPassword);
        if (!isMatch) return res.status(200).json({ message: 'Invalid email or password', success: false });
        const token = jwt.sign(
            { user: isExist._id },
            process.env.JWT_SECRET,
            // { expiresIn: isRemember ? "30d" : "1d" }
        );
        const isLogin = await Login.findOne({ userId: isExist._id })
        if (isLogin) {
            await Login.findByIdAndUpdate(isLogin._id, {}, { new: true })
            return res.status(200).json({ message: "Login success", user: isExist,isOwner:true, userId: isExist._id, token, isNew: false, success: true })
        } else {
            await Login.create({ userId: isExist._id })
            return res.status(200).json({ message: "Login success", isNew: true,isOwner:true, token, userId: isExist._id, success: true })
        }
    } catch (err) {
        console.error(err);
        return res.status(500).json({ message: 'Server Error' });
    }
}
const verifyOtp = async (req, res) => {
    const { userId, code } = req.body
    try {
        const isExist = await Pharmacy.findById(userId)
        if (!isExist) {
            return res.status(200).json({ message: "Pharmacy not exist", success: false })
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
        const isExist = await Pharmacy.findById(id);
        if (!isExist) {
            return res.status(404).json({ success: false, message: 'Phar not found' });
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
        const user = await Pharmacy.findOne({ email });
        if (!user) {
            return res.status(404).json({ success: false, message: 'Phar not found' });
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
        const isExist = await Pharmacy.findById(userId);
        if (!isExist) return res.status(400).json({ message: 'Invalid email' });
        const hashedPassword = await bcrypt.hash(password, 10);
        const updatePass = await Pharmacy.findByIdAndUpdate(userId, { password: hashedPassword }, { new: true })
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
        const isExist = await Pharmacy.findById(userId);
        if (!isExist) return res.status(200).json({ message: 'Invalid email' });
        const isMatch = await bcrypt.compare(oldPassword, isExist.password);
        if (!isMatch) return res.status(200).json({ message: 'Old password is incorrect', success: false });
        const hashedPassword = await bcrypt.hash(newPassword, 10);
        const updatePass = await Pharmacy.findByIdAndUpdate(userId, { password: hashedPassword }, { new: true })
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
const updatePhar = async (req, res) => {
    const { userId, email, contactNumber, name, gender, gstNumber, about } = req.body;
    const logo = req.files?.['logo']?.[0]?.path
    try {
        const isExist = await Pharmacy.findById(userId);
        if (!isExist) return res.status(200).json({ message: 'Phar not exist' });
        const alreadyEmail = await Pharmacy.countDocuments({ email })
        if (alreadyEmail > 1) {
            return res.status(200).json({ message: 'Email already exist' });
        }
        if (logo && isExist.logo) {
            safeUnlink(isExist.logo)
        }
        const updatephar = await Pharmacy.findByIdAndUpdate(userId, { email, contactNumber, name, gender, gstNumber, about, logo: logo || isExist.logo }, { new: true })
        if (updatephar) {
            return res.status(200).json({ message: "Pharmacy data change successfully", userId: isExist._id, success: true })
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
        const user = await Pharmacy.findById(id).select('-password');
        if (!user) {
            return res.status(404).json({ success: false, message: 'Phar not found' });
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
    const userId = req.params.id;

    try {
        // 1️⃣ Find user
        const user = await Pharmacy.findById(userId).select("-password");
        if (!user) {
            return res.status(404).json({
                success: false,
                message: "Pharmacy not found"
            });
        }

        // 2️⃣ Fetch latest related documents
        const pharPerson = await pharPerson.findOne({ userId }).sort({ createdAt: -1 });
        const pharAddress = await PharAddress.findOne({ userId }).sort({ createdAt: -1 });
        const pharImg = await pharImage.findOne({ userId }).sort({ createdAt: -1 });
        const pharLicense = await pharLicense.findOne({ userId }).sort({ createdAt: -1 });
        const isRequest = Boolean(await EditRequest.exists({ pharId: userId }))

        // 3️⃣ Fetch ratings
        const rating = await Rating.find({ pharId: userId })
            .populate("patientId")
            .sort({ createdAt: -1 });

        // 4️⃣ Calculate average rating
        const avgStats = await Rating.aggregate([
            { $match: { pharId: new mongoose.Types.ObjectId(userId) } },
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
            { $match: { pharId: new mongoose.Types.ObjectId(userId) } },
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
            user,
            pharPerson,
            pharAddress,
            pharImg,
            pharLicense,
            rating,
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

const deletePhar = async (req, res) => {
    const userId = req.user.user
    try {
        const user = await Pharmacy.findById(userId)
        if (!user) {
            return res.status(404).json({ success: false, message: 'Phar not found' });
        }
        await Otp.deleteMany({ userId })
        await Login.deleteMany({ userId })
        await Pharmacy.findByIdAndDelete(userId)
        return res.status(200).json({
            success: true,
        });
    } catch (err) {
        return res.status(500).json({ success: false, message: err.message });
    }
};
const pharAddress = async (req, res) => {
    const { userId, fullAddress, country, state, city, pinCode } = req.body;
    try {
        const user = await Pharmacy.findById(userId)
        if (!user) return res.status(200).json({ message: "User not found", success: false })

        const data = await PharAddress.findOne({ userId });
        if (data) {
            await PharAddress.findByIdAndUpdate(data._id, { fullAddress, country, state, city, pinCode, userId }, { new: true })
            return res.status(200).json({
                success: true,
                message: "Pharmacy address update successfully",
            });
        } else {
            await PharAddress.create({ fullAddress, country, state, city, pinCode, userId })
            return res.status(200).json({
                success: true,
                message: "Pharmacy address saved successfully",
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
const pharPerson = async (req, res) => {
    const { userId, name, email, contactNumber, gender } = req.body;
    const photo = req.files?.['photo']?.[0]?.path
    try {
        const user = await Pharmacy.findById(userId)
        if (!user) return res.status(200).json({ message: "User not found", success: false })

        const data = await PharPerson.findOne({ userId });
        if (data) {
            if (photo && data.photo) {
                safeUnlink(data.photo)
            }
            await PharPerson.findByIdAndUpdate(data._id, { name, email, contactNumber, gender, photo, userId }, { new: true })
            return res.status(200).json({
                success: true,
                message: "Pharmacy person update successfully",
            });
        } else {
            await PharPerson.create({ name, email, contactNumber, gender, photo, userId })
            return res.status(200).json({
                success: true,
                message: "Pharmacy person saved successfully",
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
const pharLicense = async (req, res) => {
    try {
        const { userId, pharLicenseNumber } = req.body;

        // Check user exists
        const user = await Pharmacy.findById(userId);
        if (!user) {
            return res.status(404).json({
                message: "User not found",
                success: false
            });
        }

        let certificateList = [];
        if (req.body.pharCert) {
            certificateList = JSON.parse(req.body.pharCert);
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
        const existing = await PharLicense.findOne({ userId });

        if (existing) {
            // Delete replaced certificate files
            existing.pharCert.forEach((cert) => {
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
            const updated = await PharLicense.findByIdAndUpdate(
                existing._id,
                {
                    pharCert: certificateList,
                    pharLicenseNumber,
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
        const created = await PharLicense.create({
            userId,
            pharCert: certificateList,
            pharLicenseNumber,
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
        const user = await Pharmacy.findById(userId)
        if (!user) return res.status(200).json({ message: "Pharmacy not found", success: false })

        if (logo && user.logo) {
            safeUnlink(user.logo)
        }
        await Pharmacy.findByIdAndUpdate(user._id, { logo }, { new: true })
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
const pharImage = async (req, res) => {
    const { userId } = req.body;

    const thumbnailFile = req.files?.['thumbnail']?.[0]?.path;
    const pharImgFiles = req.files?.['pharImg'] || [];
    try {
        const phar = await Pharmacy.findById(userId);
        if (!phar) return res.status(200).json({ success: false, message: "Pharmacy not found" });

        let pharImageData = await PharImage.findOne({ userId });

        if (pharImageData) {
            if (thumbnailFile && pharImageData.thumbnail) {
                safeUnlink(pharImageData.thumbnail);
            }
            if (pharImgFiles.length > 0 && pharImageData.pharImg?.length) {
                pharImageData.pharImg.forEach(img => safeUnlink(img));
            }
            pharImageData.thumbnail = thumbnailFile || pharImageData.thumbnail;
            pharImageData.pharImg = pharImgFiles.length > 0 ? pharImgFiles.map(f => f.path) : pharImageData.pharImg;

            await PharImageData.save();

            return res.status(200).json({
                success: true,
                message: "Pharmacy images updated successfully",
                data: pharImageData
            });
        } else {
            // Create new
            pharImageData = await PharImage.create({
                userId,
                thumbnail: thumbnailFile,
                pharImg: pharImgFiles.map(f => f.path)
            });

            return res.status(200).json({
                success: true,
                message: "Pharmacy images saved successfully",
                data: pharImageData
            });
        }

    } catch (error) {
        // Clean up uploaded files if error
        if (thumbnailFile) safeUnlink(thumbnailFile);
        if (pharImgFiles.length > 0) pharImgFiles.forEach(f => safeUnlink(f.path));

        return res.status(500).json({
            success: false,
            message: error.message
        });
    }
};
const editRequest = async (req, res) => {
    const { pharId, message } = req.body;
    try {
        const user = await Pharmacy.findById(pharId)
        if (!user) return res.status(200).json({ message: "Pharmacy not found", success: false })
        await EditRequest.create({ pharId, message, type: 'pharmacy' })
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

const deletePharImage = async (req, res) => {
    const { pharId, path, type } = req.body;
    try {
        const user = await Pharmacy.findById(pharId)
        if (!user) return res.status(200).json({ message: "Pharmacy not found", success: false })
        if (type == 'thumbnail') {
            await pharImage.findOneAndUpdate({ userId: pharId }, { thumbnail: '' }, { new: true })
            safeUnlink(path)
            return res.status(200).json({
                success: true,
                message: "Image deleted",
            });
        } else {
            const imgDoc = await pharImage.findOne({ userId: pharId });
            await pharImage.findOneAndUpdate({ userId: pharId }, { $pull: { pharImg: path }, }, { new: true })
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

export {
    signInPhar, updateImage, pharLicense, deleteLicense, getProfileDetail, signUpPhar, resetPassword, editRequest,
    pharPerson, pharAddress, forgotEmail, verifyOtp, resendOtp, getProfile, updatePhar, changePassword, deletePhar,
    pharImage, deletePharImage
}
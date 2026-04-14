

import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import sendEmail from '../../utils/sendMail.js'
import Otp from '../../models/Otp.js';
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
import safeUnlink, { sendEmailOtp, sendMobileOtp, sendWelcomeEmail } from '../../utils/globalFunction.js';

import User from '../../models/Hospital/User.js';
import Notification from '../../models/Notifications.js';
import City from '../../models/Hospital/City.js';
import { error } from 'console';
import Country from '../../models/Hospital/Country.js';
import { assignNH12 } from '../../utils/nh12.js';
import PaymentInfo from '../../models/PaymentInfo.js';

const signUpPhar = async (req, res) => {
    const { name, gender, email, contactNumber, password, gstNumber, about, pharId } = req.body;
    const logo = req.files?.['logo']?.[0]?.path
    const category = req.body.category ? JSON.parse(req.body.category) : []
    try {
        if (pharId) {
            const isExist = await User.findById(pharId)
            if (!isExist) {
                return res.status(200).json({ message: "Pharmacymacy not exist", success: false })
            }
            if (logo && isExist.logo) {
                safeUnlink(isExist.logo)
            }
            const isMax = await User.countDocuments({ email, _id: { $ne: isExist._id } })
            if (isMax) {
                safeUnlink(logo)
                return res.status(200).json({ message: "Email already exist", success: false })
            }
            const isContact = await User.countDocuments({ contactNumber, _id: { $ne: isExist._id } })
            if (isContact) {
                safeUnlink(logo)
                return res.status(200).json({ message: "Contact number already exist", success: false })
            }
            // Create user
            const newphar = await Pharmacy.findByIdAndUpdate(isExist.pharId, {
                name,
                gender, category,
                email,
                contactNumber,
                gstNumber, about, logo
            }, { new: true });

            if (newphar) {
                await User.findByIdAndUpdate(pharId, { email, name, contactNumber }, { new: true })
                return res.status(200).json({ success: true, });
            } else {
                return res.status(200).json({ success: false, message: "Pharmacy not updated" });
            }
        } else {


            const isExist = await Pharmacy.findOne({ email })
            if (isExist) {
                return res.status(200).json({ message: "Pharmacy already exist", success: false })
            }
            const isUser = await User.findOne({ email })
            if (isUser) {
                return res.status(200).json({ message: "User already exist", success: false })
            }
            const isLast = await Pharmacy.findOne()?.sort({ createdAt: -1 })
            const nextId = isLast
                ? String(Number(isLast.customId) + 1).padStart(4, '0')
                : '0001';
            const hashedPassword = await bcrypt.hash(password, 10);

            // Create user
            const newphar = await Pharmacy.create({
                name, category,
                gender,
                email,
                contactNumber,
                gstNumber, about, logo,

            });

            if (newphar) {
                const userData = await User.create({ name, email, role: 'pharmacy', created_by: 'self', passwordHash: hashedPassword, pharId: newphar?._id })
                newphar.userId = userData?._id
                await newphar.save()
                const token = jwt.sign(
                    { user: newphar._id },
                    process.env.JWT_SECRET,
                    // { expiresIn: isRemember ? "30d" : "1d" }
                );
                return res.status(200).json({ success: true, userId: userData._id, token });
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
    const { contactNumber, password, email } = req.body;
    try {

        const isExist = contactNumber ? await User.findOne({ contactNumber, role: "pharmacy" }) : await User.findOne({ email, role: "pharmacy" });
        if (!isExist) return res.status(200).json({ message: 'Phar not Found', success: false });
        const hashedPassword = isExist.passwordHash
        const isMatch = await bcrypt.compare(password, hashedPassword);
        if (!isMatch) return res.status(200).json({ message: 'Invalid email or password', success: false });
        const code = generateOTP()
        if (contactNumber) {
            await sendMobileOtp(contactNumber, code)
        } else {
            await sendEmailOtp(email, code)
        }
        const isOtpExist = await Otp.findOne({ phone: contactNumber, email })
        if (isOtpExist) {
            await Otp.findByIdAndDelete(isOtpExist._id)
            const otp = await Otp.create({ phone: contactNumber, email, code })
        } else {
            const otp = await Otp.create({ phone: contactNumber, email, code })
        }
        return res.status(200).json({ message: "Otp Sent", success: true })


    } catch (err) {
        console.error(err);
        return res.status(500).json({ message: 'Server Error' });
    }
}
const verifyOtp = async (req, res) => {
    const { contactNumber, code, email, type } = req.body;

    try {
        // Check if at least one identifier is provided
        if (!email && !contactNumber) {
            return res.status(400).json({
                message: "Either email or contact number is required",
                success: false
            });
        }

        // Check if pharmacy owner exists by contactNumber or email
        const pharmacyOwner = contactNumber
            ? await User.findOne({ contactNumber, role: "pharmacy" })
            : await User.findOne({ email, role: "pharmacy" });


        if (!pharmacyOwner ) {
            return res.status(200).json({
                message: 'Pharmacy not found',
                success: false
            });
        }

        // Build OTP query based on available identifiers
        const otpQuery = { code };
        if (contactNumber) {
            otpQuery.phone = contactNumber;
        }
        if (email) {
            otpQuery.email = email;
        }

        const isOtp = await Otp.findOne(otpQuery);

        // Check for test mode (for both contact number and email)
        const isTestMode = contactNumber == "8290818632" || contactNumber == "9917141332" || email == "test@example.com" || pharmacyOwner?.created_by == "admin";

        if (!isOtp && !isTestMode) {
            return res.status(200).json({
                message: "Code not exist",
                success: false
            });
        }

        // Check OTP expiry (skip for test mode)
        if (!isTestMode && isOtp) {
            const otpExpiryTime = new Date(isOtp.updatedAt);
            otpExpiryTime.setMinutes(otpExpiryTime.getMinutes() + 10);

            if (new Date() > otpExpiryTime) {
                return res.status(200).json({
                    message: "OTP Expired",
                    success: false
                });
            }
        }

        // Validate OTP code
        let isValid = false;
        if (isTestMode) {
            // Test mode validation
            isValid = code == "123456";
        } else {
            // Normal validation
            isValid = code == isOtp?.code;
        }

        // Handle forgot password flow
        if (type === "forgot-password" && isValid) {
            const user = pharmacyOwner ;
            if (!user) {
                return res.status(200).json({
                    message: "User not found",
                    success: false
                });
            }

            const token = jwt.sign(
                {
                    user: user._id,
                    type: "pharmacy",
                    isOwner: !!pharmacyOwner
                },
                process.env.JWT_SECRET,
                { expiresIn: "5m" }
            );

            // Clean up used OTP
            if (isOtp) {
                await Otp.findByIdAndDelete(isOtp._id);
            }

            return res.status(200).json({
                message: "OTP Verified",
                success: true,
                token
            });
        }

        if (!isValid) {
            return res.status(200).json({
                message: "Invalid credentials",
                success: false
            });
        }

        // Owner login flow
        if (pharmacyOwner) {
            const user = await User.findById(pharmacyOwner._id);
            if (!user) {
                return res.status(200).json({
                    message: "User not found",
                    success: false
                });
            }

            const [image, address, person, license] = await Promise.all([
                PharImage.findOne({ userId: user._id }),
                PharAddress.findOne({ userId: user._id }),
                PharPerson.findOne({ userId: user._id }),
                PharLicense.findOne({ userId: user._id }),
            ]);

            let nextStep = null;
            if (!image) nextStep = "/create-account-image";
            else if (!address) nextStep = "/create-account-address";
            else if (!person) nextStep = "/create-account-person";
            else if (!license) nextStep = "/create-account-upload";
            const pharData = await Pharmacy.findById(user?.pharId);

            let isLogin = await Login.findOne({ userId: user._id });
            const token = jwt.sign(
                {
                    user: user._id,
                    type: "pharmacy",
                    isOwner: true
                },
                process.env.JWT_SECRET
            );

            // Clean up used OTP
            if (isOtp) {
                await Otp.findByIdAndDelete(isOtp._id);
            }

            if (isLogin) {
                await Login.findByIdAndUpdate(isLogin._id, {}, { new: true });
                return res.status(200).json({
                    message: "Login success",
                    nextStep,
                    user,
                    isOwner: true,
                    userId: user._id, // Fixed: use user._id instead of pharmacyOwner.userId
                    token,
                    isNew: false,
                    success: true
                });
            } else {
                await Login.create({ userId: user._id });
                return res.status(200).json({
                    message: "Login success",
                    nextStep,
                    user,
                    isOwner: true,
                    userId: user._id, // Fixed: use user._id instead of pharmacyOwner.userId
                    token,
                    isNew: true,
                    success: true
                });
            }
        }


    } catch (err) {
        console.log(err);
        return res.status(400).json({
            success: false,
            error: err.message
        });
    }
};

const resendOtp = async (req, res) => {
    const { contactNumber, email } = req.body;
    try {
        // const isExist = contactNumber? await User.findOne({ contactNumber }):await User.findOne({ email });
        // if (!isExist) {
        //     return res.status(404).json({ success: false, message: 'Doctor not found' });
        // }
        const code = generateOTP()
        if (contactNumber) {

            await sendMobileOtp(contactNumber, code)
        } else {
            await sendEmailOtp(email, code)
        }
        const isOtpExist = await Otp.findOne({ phone: contactNumber, email })
        if (isOtpExist) {
            await Otp.findByIdAndDelete(isOtpExist.contactNumber)
            const otp = await Otp.create({ phone: contactNumber, email, code })
        } else {
            const otp = await Otp.create({ phone: contactNumber, email, code })
        }

        res.status(200).json({
            success: true,
            message: "OTP sent!"
        });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};

const forgotPassword = async (req, res) => {
    const { contactNumber } = req.body
    try {
        const isExist = await User.findOne({ contactNumber, role: "pharmacy" });
        if (!isExist) {
            return res.status(404).json({ success: false, message: 'Pharmacy not found' });
        }
        const code = generateOTP()
        await sendMobileOtp(contactNumber, code)
        const isOtpExist = await Otp.findOne({ phone: contactNumber })
        if (isOtpExist) {
            await Otp.findByIdAndDelete(isOtpExist._id)
            const otp = await Otp.create({ phone: contactNumber, code })
        } else {
            const otp = await Otp.create({ phone: contactNumber, code })
        }

        return res.status(200).json({
            success: true,
            message: "Otp sent!"
        });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};

const resetPassword = async (req, res) => {
    const { password } = req.body;
    const userId = req.user.userId
    try {
        const isExist = await User.findById(userId);
        if (!isExist) return res.status(400).json({ message: 'Invalid email' });
        const hashedPassword = await bcrypt.hash(password, 10);
        const updatePass = await User.findByIdAndUpdate(userId, { passwordHash: hashedPassword }, { new: true })
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
    const { newPassword, oldPassword } = req.body;
    const userId = req.user.userId
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
const updatePhar = async (req, res) => {
    const { email, contactNumber, name, gender, gstNumber, about } = req.body;
    const userId = req.user.userId
    const logo = req.files?.['logo']?.[0]?.path
    try {
        const isExist = await Pharmacy.findById(userId);
        if (!isExist) return res.status(200).json({ message: 'Phar not exist' });
        const alreadyEmail = await Pharmacy.countDocuments({ email })
        if (alreadyEmail > 1) {
            return res.status(200).json({ message: 'Email already exist' });
        }
        const userEmail = await User.countDocuments({ email })
        if (userEmail > 1) {
            return res.status(200).json({ message: 'Email already exist' });
        }
        const userPhone = await User.countDocuments({ contactNumber })
        if (userPhone > 1) {
            return res.status(200).json({ message: 'Contact number already exist' });
        }
        if (logo && isExist.logo) {
            safeUnlink(isExist.logo)
        }
        const updatephar = await Pharmacy.findByIdAndUpdate(userId, { email, contactNumber, name, gender, gstNumber, about, logo: logo || isExist.logo }, { new: true })
        if (updatephar) {
            await User.findOneAndUpdate({ pharId }, { name, email, contactNumber }, { new: true })
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
    return Math.floor(100000 + Math.random() * 900000).toString();
}

const getProfile = async (req, res) => {
    const id = req.params.id
    try {
        const user = await User.findById(id);
        if (!user) {
            return res.status(404).json({ success: false, message: 'Phar not found' });
        }
        const data = await Pharmacy.findById(user.pharId);
        const [image, address, person, license] = await Promise.all([
            PharImage.findOne({ userId: user._id }),
            PharAddress.findOne({ userId: user._id }),
            PharPerson.findOne({ userId: user._id }),
            PharLicense.findOne({ userId: user._id }),
        ]);

        let nextStep = null;
        if (!image) nextStep = "/create-account-image";
        else if (!address) nextStep = "/create-account-address";
        else if (!person) nextStep = "/create-account-person";
        else if (!license) nextStep = "/create-account-upload";
        return res.status(200).json({
            success: true,
            data, nextStep
        });
    } catch (err) {
        return res.status(500).json({ success: false, message: err.message });
    }
};
const getProfileDetail = async (req, res) => {
    const userId = req.params.id;

    try {
        // 1️⃣ Find user
        const user = await User.findById(userId).select("-password");
        if (!user) {
            return res.status(404).json({
                success: false,
                message: "Pharmacy not found"
            });
        }
        const data = await Pharmacy.findById(user.pharId).populate('category')

        // 2️⃣ Fetch latest related documents
        const pharPerson = await PharPerson.findOne({ userId }).sort({ createdAt: -1 });
        const pharAddress = await PharAddress.findOne({ userId }).populate('stateId')
            .populate('countryId')
            .populate('cityId').sort({ createdAt: -1 });
        const pharImg = await PharImage.findOne({ userId }).sort({ createdAt: -1 });
        const pharLicense = await PharLicense.findOne({ userId }).sort({ createdAt: -1 });
        const isRequest = Boolean(await EditRequest.exists({ pharId: userId }))
        const allowEdit = Boolean(await EditRequest.exists({ pharId: userId, status: "approved" }))
        const notifications = await Notification.countDocuments({ userId }) || 0;
        const paymentInfo = await PaymentInfo.findOne({ userId }).sort({ createdAt: -1 })
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
        const unRead = await Notification.countDocuments({ userId })



        // 6️⃣ Return final response
        return res.status(200).json({
            success: true,
            data: data, user,
            pharPerson, unRead,
            pharAddress,
            pharImg, customId: user.unique_id,
            pharLicense,
            rating,
            avgRating, paymentInfo,
            ratingCounts, allowEdit,
            isRequest, notifications
        });

    } catch (err) {
        return res.status(500).json({
            success: false,
            message: err.message
        });
    }
};
const getPharData = async (req, res) => {
    const userId = req.params.id;

    try {
        // 1️⃣ Find user
        const user = await User.findById(userId).select("-password");
        if (!user) {
            return res.status(404).json({
                success: false,
                message: "Pharmacy not found"
            });
        }
        const data = await Pharmacy.findById(user.pharId).select('name email contactNumber about category').populate('category')

        // 2️⃣ Fetch latest related documents
        // const pharPerson = await PharPerson.findOne({ userId }).sort({ createdAt: -1 });
        const pharAddress = await PharAddress.findOne({ userId }).select('fullAddress').sort({ createdAt: -1 });
        const pharImg = await PharImage.findOne({ userId }).select('thumbnail').sort({ createdAt: -1 });
        const pharLicense = await PharLicense.findOne({ userId }).select('pharCert pharLicenseNumber licenseFile').sort({ createdAt: -1 });
        // const isRequest = Boolean(await EditRequest.exists({ pharId: userId }))
        // const allowEdit = Boolean(await EditRequest.exists({ pharId: userId,status:"approved" }))

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
            user: data,
            pharAddress,
            pharImg, customId: user.unique_id,
            pharLicense,
            rating,
            avgRating,
            ratingCounts,
        });

    } catch (err) {
        return res.status(500).json({
            success: false,
            message: err.message
        });
    }
};
const deletePhar = async (req, res) => {
    const userId = req.user.userId
    try {
        const user = await Pharmacy.findById(userId)
        if (!user) {
            return res.status(404).json({ success: false, message: 'Phar not found' });
        }
        await User.deleteOne({ pharId: userId })
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
    const { fullAddress, countryId, stateId, cityId, pinCode, lat, long } = req.body;
    const userId = req.user.userId
    try {
        const user = await User.findById(userId)
        if (!user) return res.status(200).json({ message: "User not found", success: false })

        const data = await PharAddress.findOne({ userId });
        const countryData = await Country.findById(countryId)
        const cityData = await City.findById(cityId)
        const finalLat = (lat !== undefined && lat !== null) ? lat : cityData?.latitude;
        const finalLong = (long !== undefined && long !== null) ? long : cityData?.longitude;
        if (data) {
            await PharAddress.findByIdAndUpdate(data._id, {
                fullAddress, countryId, lat: finalLat,
                long: finalLong,
                stateId, cityId, pinCode, userId
            }, { new: true })
            return res.status(200).json({
                success: true,
                message: "Pharmacy address update successfully",
            });
        } else {
            await assignNH12(userId, countryData?.phonecode)
            await PharAddress.create({
                fullAddress, countryId, stateId, cityId, pinCode, lat: finalLat,
                long: finalLong,
                userId
            })
            return res.status(200).json({
                success: true,
                message: "Pharmacy address saved successfully",
            });
        }
    } catch (error) {
        console.log(error)
        return res.status(500).json({
            success: false,
            message: error,
        });
    }
};
const pharPerson = async (req, res) => {
    const { name, email, contactNumber, gender } = req.body;
    const userId = req.user.userId
    const photo = req.files?.['photo']?.[0]?.path
    try {
        const user = await User.findById(userId)
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
        const userId = req.user.userId
        const { pharLicenseNumber } = req.body;

        // Check user exists
        const user = await User.findById(userId);
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
        await sendWelcomeEmail(userId)

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
    const userId = req.user.userId
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
    const userId = req.user.userId

    const thumbnailFile = req.files?.['thumbnail']?.[0]?.path;
    const pharImgFiles = req.files?.['pharImg'] || [];
    try {
        const phar = await User.findById(userId);
        if (!phar) return res.status(200).json({ success: false, message: "Pharmacy not found" });

        let pharImageData = await PharImage.findOne({ userId });

        if (pharImageData) {

            // 🔸 Thumbnail replace logic
            if (thumbnailFile) {
                if (pharImageData.thumbnail) safeUnlink(pharImageData.thumbnail);
                pharImageData.thumbnail = thumbnailFile;
            }

            // 🔸 pharImg append logic (NOT delete old images)
            if (pharImgFiles.length > 0) {
                const newImages = pharImgFiles.map(f => f.path);
                pharImageData.pharImg = [...pharImageData.pharImg, ...newImages]; // **append only**
            }

            await pharImageData.save();

            return res.status(200).json({
                success: true,
                message: "Pharmacy images updated successfully"
            });
        }
        else {
            // Create new
            pharImageData = await PharImage.create({
                userId,
                thumbnail: thumbnailFile,
                pharImg: pharImgFiles.map(f => f.path)
            });

            return res.status(200).json({
                success: true,
                message: "Pharmacy images saved successfully"
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
    const { message } = req.body;
    const pharId = req.user.userId
    try {
        const user = await User.findById(pharId)
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
    const { path, type } = req.body;
    const pharId = req.user.userId
    try {
        const user = await Pharmacy.findById(pharId)
        if (!user) return res.status(200).json({ message: "Pharmacy not found", success: false })
        if (type == 'thumbnail') {
            await PharImage.findOneAndUpdate({ userId: pharId }, { thumbnail: '' }, { new: true })
            safeUnlink(path)
            return res.status(200).json({
                success: true,
                message: "Image deleted",
            });
        } else {
            const imgDoc = await PharImage.findOne({ userId: pharId });
            await PharImage.findOneAndUpdate({ userId: pharId }, { $pull: { pharImg: path }, }, { new: true })
            safeUnlink(path)
            return res.status(200).json({
                success: true,
                message: "Image deleted",
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
const getPharmacy = async (req, res) => {
    const limit = parseInt(req.query.limit) || 10;
    const page = parseInt(req.query.page) || 1;
    const name = req.query.name

    try {
        const filter = { role: { $in: ['pharmacy'] } }
        if (name) {
            filter.name = { $regex: name, $options: "i" };
        }
        // 1️⃣ Fetch pharmacy users
        const users = await User.find(filter)
            .select('-passwordHash')
            .populate('pharId')
            .limit(limit)
            .skip((page - 1) * limit)
            .lean();

        const pharIds = users.map(u => u._id);

        // 2️⃣ Fetch addresses
        const pharAddresses = await PharAddress.find({
            userId: { $in: pharIds }
        })
            .populate('countryId stateId cityId', 'name')
            .lean();

        const addressMap = {};
        pharAddresses.forEach(addr => {
            addressMap[addr.userId.toString()] = addr;
        });

        // 3️⃣ Fetch rating stats (AVG + COUNT)
        const ratingStats = await Rating.aggregate([
            {
                $match: {
                    pharId: { $in: pharIds }
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
            pharAddress: addressMap[user._id.toString()] || null,
            avgRating: ratingMap[user._id.toString()]?.avgRating || 0,
            totalReviews: ratingMap[user._id.toString()]?.totalReviews || 0
        }));

        const total = await User.countDocuments(filter);

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

export {
    signInPhar, updateImage, pharLicense, deleteLicense, getProfileDetail, signUpPhar, resetPassword, editRequest,
    pharPerson, pharAddress, forgotPassword, verifyOtp, resendOtp, getProfile, updatePhar, changePassword, deletePhar,
    pharImage, deletePharImage, getPharmacy, getPharData
}
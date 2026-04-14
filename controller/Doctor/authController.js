

import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import sendEmail from '../../utils/sendMail.js'
import Otp from '../../models/Otp.js';
import Doctor from '../../models/Doctor/doctor.model.js';
import Login from '../../models/Doctor/login.model.js';
import DoctorKyc from '../../models/Doctor/kyc.model.js';
import fs from 'fs'
import DoctorAbout from '../../models/Doctor/addressAbout.model.js';
import DoctorEduWork from '../../models/Doctor/eduWork.js';
import MedicalLicense from '../../models/Doctor/medicalLicense.model.js';
import EditRequest from '../../models/EditRequest.js';
import Rating from '../../models/Rating.js';
import mongoose from 'mongoose';
import DoctorAppointment from '../../models/DoctorAppointment.js';
import User from '../../models/Hospital/User.js';
import safeUnlink, { generateOTP, sendEmailOtp, sendMobileOtp, sendWelcomeEmail } from '../../utils/globalFunction.js';

import City from '../../models/Hospital/City.js';
import Country from '../../models/Hospital/Country.js';
import BlockUser from '../../models/BlockUser.js';
import DoctorClinic from '../../models/Doctor/Clinic.model.js';
import { assignNH12 } from '../../utils/nh12.js';
import PaymentInfo from '../../models/PaymentInfo.js';


const signUpDoctor = async (req, res) => {
    try {
        const { name, gender, email, contactNumber, password, dob } = req.body;

        // Validation
        if (!name || !email || !password) {
            return res.status(400).json({
                success: false,
                message: "Required fields missing"
            });
        }

        // Check doctor
        const isDoctorExist = await Doctor.findOne({ email }) || await Doctor.findOne({ contactNumber }) || await User.findOne({ email }) || await User.findOne({ contactNumber });
        if (isDoctorExist) {
            return res.status(200).json({
                success: false,
                message: "User already exists"
            });
        }


        const hashedPassword = await bcrypt.hash(password, 10);

        // Create doctor
        const newDoctor = await Doctor.create({
            name,
            gender,
            email,
            contactNumber,
            password: hashedPassword,
            dob,
        });

        // Create user
        const userData = await User.create({
            name,
            email,
            role: "doctor",
            created_by: "self",
            contactNumber,
            passwordHash: hashedPassword,
            doctorId: newDoctor._id,
        });

        // Link doctor → user
        newDoctor.userId = userData._id;
        await newDoctor.save();
        const code = generateOTP()
        await sendMobileOtp(contactNumber, code)
        if (newDoctor) {
            const isOtpExist = await Otp.findOne({ phone: contactNumber })
            if (isOtpExist) {
                await Otp.findByIdAndDelete(isOtpExist._id)
                const otp = await Otp.create({ phone: contactNumber, code })
            } else {
                const otp = await Otp.create({ phone: contactNumber, code })
            }
        }

        return res.status(201).json({
            success: true,
            message: "Doctor registered successfully",
            doctorId: newDoctor._id,
            userId: userData._id, code
        });

    } catch (err) {
        console.error(err);
        return res.status(500).json({
            success: false,
            message: "Server Error"
        });
    }
};

const signInDoctor = async (req, res) => {
    const { contactNumber, password, email } = req.body;
    try {

        const isExist = contactNumber ? await User.findOne({ contactNumber, role: "doctor" }) : await User.findOne({ email, role: "doctor" })
        if (!isExist) return res.status(200).json({ message: 'Doctor not Found', success: false });
        const hashedPassword =isExist.passwordHash;
        const phone =  isExist.contactNumber 
        const isMatch = await bcrypt.compare(password, hashedPassword);
        if (!isMatch) return res.status(200).json({ message: 'Invalid credentials', success: false });
        const code = generateOTP()
        if (contactNumber && contactNumber!=="7375046291") {
            // await sendMobileOtp(contactNumber, code)
        }
        if (email) {
            await sendEmailOtp(email, code)
        }
        const isOtpExist = await Otp.findOne({ phone: contactNumber, email })
        if (isOtpExist) {
            await Otp.findByIdAndDelete(isOtpExist._id)
            const otp = await Otp.create({ phone: contactNumber, email, code })
        } else {
            const otp = await Otp.create({ phone: contactNumber, email, code })
        }
        if (isExist) {
            const isLogin = await Login.findOne({ userId: isExist._id })
            if (isLogin) {
                await Login.findByIdAndUpdate(isLogin._id, {}, { new: true })
                return res.status(200).json({ message: "Otp Sent", code, userId: isExist._id, isNew: false, success: true })
            } else {
                await Login.create({ userId: isExist._id })
                return res.status(200).json({ message: "Otp Sent", code, isNew: true, userId: isExist._id, success: true })
            }
        } else {

            return res.status(200).json({ message: "Otp Sent", code, userId: isEmployee._id, isNew: false, success: true })
        }


    } catch (err) {
        console.error(err);
        return res.status(500).json({ message: 'Server Error' });
    }
}

const verifyOtp = async (req, res) => {
    const { code, email, contactNumber, type } = req.body;

    try {
        // Check if at least one identifier is provided
        if (!email && !contactNumber) {
            return res.status(400).json({
                message: "Either email or contact number is required",
                success: false
            });
        }

        // Build query based on available identifiers
        const otpQuery = { code };
        if (contactNumber) {
            otpQuery.phone = contactNumber;
        }
        if (email) {
            otpQuery.email = email;
        }

        const isCode = await Otp.findOne(otpQuery);
        const dummyUser = contactNumber ? await User.findOne({ contactNumber }) : await User.findOne({ email });
        // Check for test mode (for both contact number and email)
        const isTestMode = contactNumber == "7375046291" || contactNumber == "9917141332" || email == "test@example.com" || dummyUser?.created_by == "admin";; // Add your test email

        if (!isCode && !isTestMode) {
            return res.status(200).json({
                message: "Code not exist",
                success: false
            });
        }

        // Check OTP expiry (skip for test mode)
        if (!isTestMode && isCode) {
            const otpExpiryTime = new Date(isCode?.updatedAt);
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
        } else if (email == "test@example.com") { // Add your test email if needed
            isValid = code == "123456";
        } else {
            // Normal validation
            isValid = code == isCode?.code;
        }

        if (!isValid) {
            return res.status(200).json({
                message: "Invalid OTP",
                success: false
            });
        }


        // Determine which identifier to use for user lookup
        let user;
        let doctor;
        let employee;

        if (contactNumber) {
           
                doctor = await User.findOne({ contactNumber: contactNumber, role: "doctor" });
            
        } else if (email) {
                doctor = await User.findOne({ email: email, role: "doctor" });
            
        }

       if (doctor) {
            user = await User.findById(doctor._id);
            // Handle forgot password flow
            if (type === "forgot-password" && isValid) {
                const user = await User.findById(doctor._id);
                if (!user) {
                    return res.status(200).json({
                        message: "User not found",
                        success: false
                    });
                }

                const token = jwt.sign(
                    { user: user._id, type: "lab", isOwner: true },
                    process.env.JWT_SECRET, { expiresIn: "5m" }
                );

                // Clean up used OTP
                if (isCode) {
                    await Otp.findByIdAndDelete(isCode._id);
                }

                return res.status(200).json({
                    message: "OTP Verified",
                    success: true,
                    token
                });
            }
            const userId = user._id;

            // Check doctor onboarding steps
            const [
                kyc,
                education,
                medicalLicense,
                address,
            ] = await Promise.all([
                DoctorKyc.findOne({ userId }),
                DoctorEduWork.findOne({ userId }),
                MedicalLicense.findOne({ userId }),
                DoctorAbout.findOne({ userId }),
            ]);
            let nextStep = null;

            if (!kyc) {
                nextStep = "/kyc";
            } else if (!education) {
                nextStep = "/education-work";
            } else if (!medicalLicense) {
                nextStep = "/medical-license";
            } else if (!address) {
                nextStep = "/address-about";
            }

            // Check if this is a new login
            let isNew = true;
            const isLogin = await Login.findOne({ userId });
            if (isLogin) {
                isNew = false;
            }

            const token = jwt.sign(
                {
                    user: user._id,
                    isOwner: true,
                    type: 'doctor'
                },
                process.env.JWT_SECRET,
                // { expiresIn: isRemember ? "30d" : "1d" }
            );

            // Clean up used OTP
            if (isCode) {
                await Otp.findByIdAndDelete(isCode._id);
            }

            return res.status(200).json({
                message: "Verify Success",
                nextStep,
                isNew,
                isOwner: true,
                token,
                doctorId: user?.doctorId,
                userId,
                user: user,
                success: true
            });
        }
        // If no user found
        else {
            // Clean up used OTP if exists
            if (isCode) {
                await Otp.findByIdAndDelete(isCode._id);
            }

            return res.status(200).json({
                message: "No doctor or staff found with the provided credentials",
                success: false
            });
        }

    } catch (err) {
        console.log(err);
        return res.status(400).json({
            success: false,
            error: err.message
        });
    }
};
const sendOtp = async (req, res) => {
    const { contactNumber } = req.body;
    try {
        const isExist = await Doctor.findOne({ contactNumber });
        if (!isExist) {
            return res.status(404).json({ success: false, message: 'Doctor not found' });
        }
        const code = generateOTP()
        await sendMobileOtp(contactNumber, code)
        const isOtpExist = await Otp.findOne({ phone: contactNumber })
        if (isOtpExist) {
            await Otp.findByIdAndDelete(isOtpExist?._id)
            const otp = await Otp.create({ phone: contactNumber, code })
        } else {
            const otp = await Otp.create({ phone: contactNumber, code })
        }
        // const emailHtml = `
        //     Hello ${isExist?.name}, 
        //     Your One-Time Password (OTP) for Neo Health is: ${code} 
        //     This OTP is valid for 10 minutes. Please do not share it with anyone.
        //     If you did not request this, please ignore this email.
        //     Thank you,
        //     The Neo Health Team`
        // await sendEmail({
        //     to: isExist.email,
        //     subject: "Your Neo Health OTP Code!",
        //     html: emailHtml
        // });
        res.status(200).json({
            success: true, code,
            message: "OTP sent!"
        });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
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
        const isExist = await User.findOne({ contactNumber, role: "doctor" });
        if (!isExist) {
            return res.status(404).json({ success: false, message: 'Doctor not found' });
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
const updateDoctor = async (req, res) => {
    const { email, contactNumber, name, gender, dob } = req.body;
    const userId = req.user.userId
    try {
        const isExist = await User.findById(userId);
        if (!isExist) return res.status(200).json({ message: 'Doctor not exist' });
        const alreadyEmail = await Doctor.countDocuments({ email })
        if (alreadyEmail > 1) {
            return res.status(200).json({ message: 'Email already exist' });
        }
        const userEmail = await User.countDocuments({ email })
        if (userEmail > 1) {
            return res.status(200).json({ message: 'Email already exist' });
        }
        const userContact = await User.countDocuments({ contactNumber })
        if (userContact > 1) {
            return res.status(200).json({ message: 'Contact number already exist' });
        }
        const updateDoctor = await Doctor.findByIdAndUpdate(isExist.doctorId, { email, contactNumber, name, gender, dob }, { new: true })
        if (updateDoctor) {
            await User.findByIdAndUpdate(userId, { name, email, contactNumber }, { new: true })
            return res.status(200).json({ message: "Doctor data change successfully", userId: isExist._id, success: true })
        } else {
            return res.status(200).json({ message: "Error occure in user data", success: false })
        }
    } catch (err) {
        console.error(err.message);
        if (err.message.includes(' duplicate key error collection')) {
            return res.status(200).json({ message: "Email already exist " })
        } else {
            return res.status(200).json({ message: 'Server Error' });
        }
    }
}


const getProfile = async (req, res) => {
    try {
        const user = await Doctor.findById(req.user.userId).select('-password');
        if (!user) {
            return res.status(404).json({ success: false, message: 'Doctor not found' });
        }
        res.status(200).json({
            success: true,
            data: user
        });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};
const getProfileDetail = async (req, res) => {
    const userId = req.params.id
    try {
        let user;
        if (userId < 24) {
            user = await User.findOne({ unique_id: userId }).select('-passwordHash');

        } else {
            user = await User.findById(userId).select('-passwordHash');
        }
        if (!user) {
            return res.status(404).json({ success: false, message: 'Doctor not found' });
        }
        const doctor = await Doctor.findById(user.doctorId)
        const kyc = await DoctorKyc.findOne({ userId }).sort({ createdAt: -1 })
        const medicalLicense = await MedicalLicense.findOne({ userId }).sort({ createdAt: -1 })
        const aboutDoctor = await DoctorAbout.findOne({ userId }).populate('countryId stateId cityId', 'name isoCode').populate('specialty treatmentAreas').sort({ createdAt: -1 })
        const eduWork = await DoctorEduWork.findOne({ userId }).sort({ createdAt: -1 })
        const rating = await Rating.find({ doctorId: userId }).populate('patientId').sort({ createdAt: -1 })
        const isRequest = await EditRequest.findOne({ doctorId: userId });
        const allowEdit = await EditRequest.exists({ doctorId: userId, status: 'approved' }).then(Boolean)
        const clinicData = await DoctorClinic.findOne({ userId })
        const paymentInfo = await PaymentInfo.findOne({ userId }).sort({ createdAt: -1 })
        const ratingStats = await Rating.aggregate([
            { $match: { doctorId: new mongoose.Types.ObjectId(userId) } },
            {
                $group: {
                    _id: "$start",
                    count: { $sum: 1 }
                }
            }
        ]);

        // ⭐ GET AVERAGE RATING
        const avgStats = await Rating.aggregate([
            { $match: { doctorId: new mongoose.Types.ObjectId(userId) } },
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
            user: doctor, doctorUser: user, clinicData,
            kyc, isRequest, allowEdit, paymentInfo,
            medicalLicense, aboutDoctor, eduWork, rating, avgRating, customId: user.unique_id
        });
    } catch (err) {
        console.log(err)
        return res.status(500).json({ success: false, message: err.message });
    }
};
const deleteDoctor = async (req, res) => {
    const userId = req.user.userId
    try {
        const user = await Doctor.findById(userId)
        if (!user) {
            return res.status(404).json({ success: false, message: 'Doctor not found' });
        }
        await Otp.deleteMany({ userId })
        await Login.deleteMany({ userId })
        await Doctor.findByIdAndDelete(userId)
        await User.findOneAndDelete({ doctorId: userId })
        return res.status(200).json({
            success: true,
        });
    } catch (err) {
        return res.status(500).json({ success: false, message: err.message });
    }
};

const doctorKyc = async (req, res) => {
    const { type } = req.body;
    const userId = req.user.userId
    const frontImage = req.files?.['frontImage']?.[0]?.path
    const backImage = req.files?.['backImage']?.[0]?.path
    try {
        const user = await User.findById(userId)
        if (!user) return res.status(200).json({ message: "User not found", success: false })

        const data = await DoctorKyc.findOne({ userId });
        if (data) {
            if (frontImage && data.frontImage) {
                safeUnlink(data.frontImage)
            }
            if (backImage && data.backImage) {
                safeUnlink(data.backImage)
            }
            await DoctorKyc.findByIdAndUpdate(data._id, { frontImage, backImage, type }, { new: true })

            return res.status(200).json({
                success: true,
                message: "Kyc update successfully",
            });
        } else {
            await DoctorKyc.create({ frontImage, backImage, userId, type })
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
            fs.unlinkSync(frontImage)
        }
        console.error("Error saving profile image:", error);
        return res.status(500).json({
            success: false,
            message: "Internal Server Error",
        });
    }
};
const getDoctorKyc = async (req, res) => {
    const userId = req.params.id;

    try {
        const user = await User.findById(userId)
        if (!user) return res.status(200).json({ message: "User not found", success: false })

        const data = await DoctorKyc.findOne({ userId });
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
const doctorAbout = async (req, res) => {
    const { clinic, lat, long, hospitalName, fullAddress, countryId, stateId, cityId, pinCode, specialty, treatmentAreas, fees, language, aboutYou } = req.body;
    const userId = req.user.userId
    try {
        const user = await User.findById(userId)
        if (!user) return res.status(200).json({ message: "User not found", success: false })
        const countryData = await Country.findById(countryId)
        const cityData = await City.findById(cityId)
        const finalLat = (lat !== undefined && lat !== null) ? lat : cityData?.latitude;
        const finalLong = (long !== undefined && long !== null) ? long : cityData?.longitude;
        const data = await DoctorAbout.findOne({ userId });
        if (data) {
            // await assignNH12(userId,countryData.phonecode)
            await DoctorAbout.findByIdAndUpdate(data._id, { hospitalName, clinic, lat: finalLat, long: finalLong, fullAddress, countryId, stateId, cityId, pinCode, specialty, treatmentAreas, fees, language, aboutYou }, { new: true })
            return res.status(200).json({
                success: true,
                message: "About data update successfully",
            });
        } else {
            if (countryData?.phonecode) {
                await assignNH12(userId, countryData?.phonecode)
            }
            await DoctorAbout.create({ hospitalName, clinic, lat: finalLat, long: finalLong, fullAddress, countryId, stateId, cityId, pinCode, specialty, treatmentAreas, fees, language, aboutYou, userId })
            await sendWelcomeEmail(userId)
            return res.status(200).json({
                success: true,
                message: "About data saved successfully",
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
const doctorClinicData = async (req, res) => {
    const { clinicName, licenseNumber, } = req.body;
    const userId = req.user.userId
    const licenseImage = req.files?.['licenseImage']?.[0]?.path
    const clinicImage = req.files?.['clinicImage']?.[0]?.path
    try {
        const user = await User.findById(userId)
        if (!user) return res.status(200).json({ message: "User not found", success: false })
        const data = await DoctorClinic.findOne({ userId });
        if (data) {
            if (data.licenseImage && licenseImage) {
                safeUnlink(data.licenseImage)
            }
            if (data.clinicImage && clinicImage) {
                safeUnlink(data.clinicImage)
            }
            await DoctorClinic.findByIdAndUpdate(data._id, { clinicName, licenseImage, licenseNumber, clinicImage }, { new: true })
            return res.status(200).json({
                success: true,
                message: "Clinic data update successfully",
            });
        } else {
            await DoctorClinic.create({ clinicName, licenseImage, licenseNumber, clinicImage, userId })
            return res.status(200).json({
                success: true,
                message: "Clinic data saved successfully",
            });
        }
    } catch (error) {
        if (licenseImage && fs.existsSync(licenseImage)) {
            fs.unlinkSync(licenseImage)
        }
        if (clinicImage && fs.existsSync(clinicImage)) {
            fs.unlinkSync(clinicImage)
        }
        console.log(error)
        return res.status(500).json({
            success: false,
            message: "Internal Server Error",
        });
    }
};
const getDoctorClinic = async (req, res) => {
    const userId = req.params.id;

    try {
        const user = await User.findById(userId)
        if (!user) return res.status(200).json({ message: "User not found", success: false })

        const data = await DoctorClinic.findOne({ userId })
        if (data) {
            return res.status(200).json({
                success: true,
                data,
                message: "Clinic data fetch successfully",
            });
        }
        return res.status(200).json({
            success: false,
            message: "Clinic data not found ",
        });

    } catch (error) {
        return res.status(500).json({
            success: false,
            message: "Internal Server Error",
        });
    }
};
const getDoctorAbout = async (req, res) => {
    const userId = req.params.id;

    try {
        const user = await User.findById(userId)
        if (!user) return res.status(200).json({ message: "User not found", success: false })

        const data = await DoctorAbout.findOne({ userId }).populate('countryId').populate('stateId').populate('cityId').populate('specialty');
        if (data) {
            return res.status(200).json({
                success: true,
                data,
                message: "About data fetch successfully",
            });
        }
        return res.status(200).json({
            success: false,
            message: "About data not found ",
        });

    } catch (error) {
        return res.status(500).json({
            success: false,
            message: "Internal Server Error",
        });
    }
};
const doctorEduWork = async (req, res) => {
    const { education, work } = req.body;
    const userId = req.user.userId
    try {
        const user = await User.findById(userId)
        if (!user) return res.status(200).json({ message: "User not found", success: false })


        const data = await DoctorEduWork.findOne({ userId });
        if (data) {
            await DoctorEduWork.findByIdAndUpdate(data._id, { education, work }, { new: true })

            return res.status(200).json({
                success: true,
                message: "Education and Work update successfully",
            });
        } else {
            await DoctorEduWork.create({ education, work, userId })

            return res.status(200).json({
                success: true,
                message: "Education and work saved successfully",
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
const getDoctorEduWork = async (req, res) => {
    const userId = req.params.id;

    try {
        const user = await User.findById(userId)
        if (!user) return res.status(200).json({ message: "User not found", success: false })

        const data = await DoctorEduWork.findOne({ userId });
        if (data) {
            return res.status(200).json({
                success: true,
                data,
                message: "Education and work fetch successfully",
            });
        }
        return res.status(200).json({
            success: false,
            message: "Education and work not found ",
        });

    } catch (error) {
        return res.status(500).json({
            success: false,
            message: "Internal Server Error",
        });
    }
};
const deleteEdu = async (req, res) => {
    try {
        const { id, itemId } = req.params;
        const record = await DoctorEduWork.findById(id);
        const item = record.education.id(itemId);

        if (!item) return res.status(404).json({ success: false, message: "Not found" });

        item.deleteOne();
        await record.save();

        return res.json({ success: true, message: "Education deleted" });

    } catch (err) {
        return res.status(500).json({ success: false, error: err.message });
    }
};
const deleteWork = async (req, res) => {
    try {
        const { id, itemId } = req.params;
        const record = await DoctorEduWork.findById(id);
        const item = record.work.id(itemId);
        if (!item) return res.status(404).json({ success: false, message: "Not found" });
        item.deleteOne();
        await record.save();
        return res.json({ success: true, message: "Work data deleted" });

    } catch (err) {
        return res.status(500).json({ success: false, error: err.message });
    }
};
const doctorLicense = async (req, res) => {
    try {
        const userId = req.user.userId
        const user = await User.findById(userId);
        if (!user)
            return res.status(200).json({ message: "User not found", success: false });

        let medicalLicenseData = req.body.medicalLicense;

        if (typeof medicalLicenseData === "string") {
            try {
                medicalLicenseData = JSON.parse(medicalLicenseData);
            } catch (err) {
                return res.status(400).json({ success: false, error: "Invalid JSON" });
            }
        }

        if (!Array.isArray(medicalLicenseData)) {
            medicalLicenseData = [medicalLicenseData];
        }

        const files = req.files || [];

        // Map files by fieldname index
        const fileMap = {};
        files.forEach(file => {
            const match = file.fieldname.match(/certFile\[(\d+)\]/);
            if (match) fileMap[parseInt(match[1])] = file;
        });

        let userPrescriptionsDoc = await MedicalLicense.findOne({ userId });

        if (!userPrescriptionsDoc) {
            // create new document
            medicalLicenseData.forEach((license, idx) => {
                if (license && fileMap[idx]) {
                    license.certFile = fileMap[idx].path;
                }
            });

            const created = await MedicalLicense.create({
                userId,
                medicalLicense: medicalLicenseData
            });

            return res.status(201).json({
                success: true,
                message: "Medical license created successfully",
                data: created
            });
        }

        // Update existing document
        medicalLicenseData.forEach((newLice) => {
            const idx = newLice._index;
            if (!newLice) return;

            const existingPresc = userPrescriptionsDoc.medicalLicense.id(newLice._id);

            if (existingPresc) {
                if (fileMap[idx]) {
                    safeUnlink(existingPresc.certFile);
                    existingPresc.certFile = fileMap[idx].path;
                }

                existingPresc.certName = newLice.certName || existingPresc.certName;
            } else {
                if (fileMap[idx]) {
                    newLice.certFile = fileMap[idx].path;
                }
                userPrescriptionsDoc.medicalLicense.push(newLice);
            }
        });

        await userPrescriptionsDoc.save();

        return res.status(200).json({
            success: true,
            message: "Medical License updated successfully",
            data: userPrescriptionsDoc
        });
    } catch (error) {
        console.log(error);
        return res.status(500).json({
            success: false,
            message: "Internal Server Error"
        });
    }
};
const getDoctorLicense = async (req, res) => {
    const userId = req.params.id;

    try {
        const user = await User.findById(userId)
        if (!user) return res.status(200).json({ message: "User not found", success: false })

        const data = await MedicalLicense.findOne({ userId });
        if (data) {
            return res.status(200).json({
                success: true,
                data,
                message: "Medical license fetch successfully",
            });
        }
        return res.status(200).json({
            success: false,
            message: "Medical license  not found ",
        });

    } catch (error) {
        return res.status(500).json({
            success: false,
            message: "Internal Server Error",
        });
    }
};
const deleteLicense = async (req, res) => {
    try {
        const { id, itemId } = req.params;
        const record = await MedicalLicense.findOne({ userId: id });
        if (!record) return res.status(404).json({ message: "License not found", success: false });

        const item = record.medicalLicense.id(itemId);
        if (!item) return res.status(404).json({ success: false, message: "Not found" });

        safeUnlink(item.certFile);

        // Remove the subdocument from the array
        record.medicalLicense.pull(itemId);

        await record.save();

        return res.json({ success: true, message: "License deleted" });
    } catch (err) {
        console.log(err);
        return res.status(500).json({ success: false, error: err.message });
    }
};
const updateImage = async (req, res) => {
    const userId = req.user.userId
    const image = req.files?.['profileImage']?.[0]?.path
    try {
        const user = await User.findById(userId)
        if (!user) return res.status(200).json({ message: "Doctor not found", success: false })
        const doctorData = await Doctor.findById(user.doctorId)
        if (doctorData.profileImage) {
            safeUnlink(doctorData.profileImage)
        }
        await Doctor.findByIdAndUpdate(user.doctorId, { profileImage: image }, { new: true })
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
    const { message } = req.body;
    const doctorId = req.user.userId
    try {
        const user = await User.findById(doctorId)
        if (!user) return res.status(200).json({ message: "Doctor not found", success: false })
        await EditRequest.create({ doctorId, message, type: 'doctor' })
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
const getCustomProfile = async (req, res) => {
    const userId = req.params.id
    try {
        let user;
        if (userId.length < 24) {
            user = await User.findOne({ unique_id: userId, role: 'doctor' }).select('-passwordHash').lean();
        } else {
            user = await User.findOne({ _id: userId, role: 'doctor' }).select('-passwordHash').lean();
        }
        if (!user) {
            return res.status(404).json({ success: false, message: 'Doctor not found' });
        }
        // const ptDemographic=await PatientDemographic.findOne({userId:user._id}).sort({createdAt:-1})
        console.log(user)
        const doctorData = await Doctor.findById(user.doctorId).lean()
        res.status(200).json({
            success: true,
            data: { ...user, ...doctorData }
        });
    } catch (err) {
        console.log(err)
        res.status(500).json({ success: false, message: err.message });
    }
};
const getDoctors = async (req, res) => {
    const limit = parseInt(req.query.limit) || 10;
    const page = parseInt(req.query.page) || 1;
    const name = req.query.name;
    const specialty = req.query.specialty // Doctor About
    const language = req.query.language // Doctor About
    const fees = req.query.fees //  Doctor About
    const status = req.query.status // Doctor
    const rating = req.query.rating // Rating
    try {
        const specialties = specialty ? specialty.split(',') : [];
        const languages = language ? language.split(',') : [];
        const minRating = rating ? Number(rating) : 0;
        const maxFees = fees ? Number(fees) : null;

        let filter = { role: 'doctor', fcmToken: { $ne: null } }
        if (name) {
            filter.name = { $regex: name, $options: "i" };
        }
        // 1️⃣ Fetch lab users
        // let userQuery = User.find({ role: 'doctor', created_by: 'self' })
        //     .select('-passwordHash')
        //     .populate('doctorId')
        //     .sort({ createdAt: -1 });

        // if (!isFilterApplied) {
        //     userQuery = userQuery.limit(limit).skip((page - 1) * limit);
        // }
        // const users = await userQuery.lean();
        const users = await User.find(filter).select('name email contactNumber doctorId')
            .populate('doctorId','profileImage').sort({ createdAt: -1 })
            .limit(limit)
            .skip((page - 1) * limit)
            .lean();

        const doctorIds = users.map(u => u._id);
        // 2️⃣ Fetch addresses
        const doctorAddresses = await DoctorAbout.find({
            userId: { $in: doctorIds },
            ...(specialties.length && { specialty: { $in: specialties } }),
            ...(languages.length && { language: { $in: languages } }),
            ...(maxFees && {
                $expr: {
                    $lte: [{ $toDouble: "$fees" }, maxFees]
                }
            })
        })
            .populate('countryId stateId cityId specialty', 'name')
            .lean();


        const addressMap = {};
        doctorAddresses.forEach(addr => {
            addressMap[addr.userId.toString()] = addr;
        });

        // 3️⃣ Fetch rating stats (AVG + COUNT)
        const ratingStats = await Rating.aggregate([
            {
                $match: {
                    doctorId: { $in: doctorIds }
                }
            },
            {
                $group: {
                    _id: "$doctorId",
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
        const validDoctorIds = new Set(
            doctorAddresses.map(d => d.userId.toString())
        );

        let finalData = users
            .filter(user => validDoctorIds.has(user._id.toString()))
            .map(user => ({
                ...user,
                doctorAddress: addressMap[user._id.toString()] || null,
                avgRating: ratingMap[user._id.toString()]?.avgRating || 0,
                totalReviews: ratingMap[user._id.toString()]?.totalReviews || 0
            }))
            .filter(doc => doc.avgRating >= minRating);


        const total = Object.keys(finalData).length;

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
const getDoctorData = async (req, res) => {
    const userId = req.params.id;
    try {
        // 1️⃣ Find user
        const user = await User.findById(userId)
        if (!user) {
            return res.status(404).json({
                success: false,
                message: "Doctor not found"
            });
        }
        const doctorData = await Doctor.findById(user.doctorId).select("-password");
        const doctorAbout = await DoctorAbout.findOne({ userId }).populate('countryId specialty stateId treatmentAreas')
            .populate('cityId').sort({ createdAt: -1 });
        const doctorLicense = await MedicalLicense.findOne({ userId }).sort({ createdAt: -1 });
        const uniquePatientIds = await DoctorAppointment.distinct(
            "patientId",
            { doctorId: user.doctorId }
        );

        const totalPatients = uniquePatientIds.length;


        // 3️⃣ Fetch ratings
        const rating = await Rating.find({ doctorId: user?._id })
            .populate({ path: "patientId", select: '-passwordHash', populate: ({ path: 'patientId', select: 'name profileImage' }) })
            .sort({ createdAt: -1 });

        // 4️⃣ Calculate average rating
        const avgStats = await Rating.aggregate([
            { $match: { doctorId: new mongoose.Types.ObjectId(user?._id) } },
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
            { $match: { doctorId: new mongoose.Types.ObjectId(userId) } },
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
            user: doctorData,
            doctorAbout,
            doctorLicense, customId: user.unique_id,
            rating,
            avgRating,
            ratingCounts, totalPatients
        });

    } catch (err) {
        return res.status(500).json({
            success: false,
            message: err.message
        });
    }
};
export {
    signInDoctor, updateImage, doctorEduWork, getCustomProfile, deleteEdu, doctorLicense, deleteLicense, deleteWork, doctorAbout, getProfileDetail, signUpDoctor, resetPassword, doctorKyc, editRequest, forgotPassword, verifyOtp, resendOtp, getProfile, updateDoctor, changePassword, deleteDoctor, getDoctorKyc,
    getDoctorEduWork, getDoctorLicense, getDoctorAbout, getDoctors, getDoctorData, sendOtp, doctorClinicData, getDoctorClinic
}
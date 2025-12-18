

import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import sendEmail from '../../utils/sendMail.js'
import Otp from '../../models/Doctor/otp.model.js';
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

const signUpDoctor = async (req, res) => {
    const { name, gender, email, contactNumber, password, dob } = req.body;
    try {
        const isExist = await Doctor.findOne({ email })
        if (isExist) {
            return res.status(200).json({ message: "Doctor already exist", success: false })
        }
        const isLast = await Doctor.findOne()?.sort({ createdAt: -1 })
        const nextId = isLast
            ? String(Number(isLast.customId) + 1).padStart(4, '0')
            : '0001';
        const hashedPassword = await bcrypt.hash(password, 10);
        // Create user
        const newDoctor = await Doctor.create({
            name,
            gender,
            email,
            contactNumber,
            password: hashedPassword,
            customId: 'DOC-'+nextId,
            dob,
        });
        if (newDoctor) {
            const code = generateOTP()
            const otp = await Otp.create({ userId: newDoctor._id, code })
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
            return res.status(200).json({ success: true, newDoctor, userId: newDoctor._id });
        } else {
            return res.status(200).json({ success: false, message: "Doctor not created" });
        }

    } catch (err) {
        console.error(err);
        return res.status(500).json({ message: 'Server Error' });
    }
}
const signInDoctor = async (req, res) => {
    const { email, password } = req.body;
    try {
        const isExist = await Doctor.findOne({ email });
        if (!isExist) return res.status(200).json({ message: 'Doctor not Found', success: false });
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
        const isExist = await Doctor.findById(userId)
        if (!isExist) {
            return res.status(200).json({ message: "Doctor not exist", success: false })
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
        const isExist = await Doctor.findById(id);
        if (!isExist) {
            return res.status(404).json({ success: false, message: 'Doctor not found' });
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
        const user = await Doctor.findOne({ email });
        if (!user) {
            return res.status(404).json({ success: false, message: 'Doctor not found' });
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
        res.status(200).json({
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

        const isExist = await Doctor.findById(userId);
        if (!isExist) return res.status(400).json({ message: 'Invalid email' });

        const hashedPassword = await bcrypt.hash(password, 10);
        const updatePass = await Doctor.findByIdAndUpdate(userId, { password: hashedPassword }, { new: true })
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
        const isExist = await Doctor.findById(userId);
        if (!isExist) return res.status(200).json({ message: 'Invalid email' });
        const isMatch = await bcrypt.compare(oldPassword, isExist.password);
        if (!isMatch) return res.status(200).json({ message: 'Old password is incorrect', success: false });
        const hashedPassword = await bcrypt.hash(newPassword, 10);
        const updatePass = await Doctor.findByIdAndUpdate(userId, { password: hashedPassword }, { new: true })
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
    const { userId, email, contactNumber, name, gender, dob } = req.body;
    try {
        const isExist = await Doctor.findById(userId);
        if (!isExist) return res.status(200).json({ message: 'Doctor not exist' });
        const alreadyEmail = await Doctor.countDocuments({ email })
        if (alreadyEmail > 1) {
            return res.status(200).json({ message: 'Email already exist' });
        }
        const updateDoctor = await Doctor.findByIdAndUpdate(userId, { email, contactNumber, name, gender, dob }, { new: true })
        if (updateDoctor) {
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

function generateOTP() {
    return Math.floor(1000 + Math.random() * 9000).toString();
}

const getProfile = async (req, res) => {
    try {
        const user = await Doctor.findById(req.user.user).select('-password');
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
        if(userId<24){
                user = await Doctor.findOne({customId:userId}).select('-password');

        }else{
                user = await Doctor.findById(userId).select('-password');
        }
        if (!user) {
            return res.status(404).json({ success: false, message: 'Doctor not found' });
        }
        const kyc = await DoctorKyc.findOne({ userId }).sort({ createdAt: -1 })
        const medicalLicense = await MedicalLicense.findOne({ userId }).sort({ createdAt: -1 })
        const aboutDoctor = await DoctorAbout.findOne({ userId }).sort({ createdAt: -1 })
        const eduWork = await DoctorEduWork.findOne({ userId }).sort({ createdAt: -1 })
        const rating = await Rating.find({ doctorId: userId }).populate('patientId').sort({ createdAt: -1 })
        const totalPatients = await DoctorAppointment
            .distinct("patientId", { doctorId: userId });

        const totalPatientCount = totalPatients.length;

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
            user, 
            kyc,totalPatientCount,
            medicalLicense, aboutDoctor, eduWork, rating, avgRating
        });
    } catch (err) {
        return res.status(500).json({ success: false, message: err.message });
    }
};
const deleteDoctor = async (req, res) => {
    const userId = req.user.user
    try {
        const user = await Doctor.findById(userId)
        if (!user) {
            return res.status(404).json({ success: false, message: 'Doctor not found' });
        }
        await Otp.deleteMany({ userId })
        await Login.deleteMany({ userId })
        await Doctor.findByIdAndDelete(userId)
        return res.status(200).json({
            success: true,
        });
    } catch (err) {
        return res.status(500).json({ success: false, message: err.message });
    }
};

const doctorKyc = async (req, res) => {
    const { userId, type } = req.body;
    const frontImage = req.files?.['frontImage']?.[0]?.path
    const backImage = req.files?.['backImage']?.[0]?.path
    try {
        const user = await Doctor.findById(userId)
        if (!user) return res.status(200).json({ message: "User not found", success: false })

        const data = await DoctorKyc.findOne({ userId });
        if (data) {
            if (data.frontImage) {
                safeUnlink(data.frontImage)
            }
            if (data.backImage) {
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
const doctorAbout = async (req, res) => {
    const { userId, hospitalName, fullAddress, country, state, city, pinCode, specialty, treatmentAreas, fees, language, aboutYou } = req.body;
    try {
        const user = await Doctor.findById(userId)
        if (!user) return res.status(200).json({ message: "User not found", success: false })

        const data = await DoctorAbout.findOne({ userId });
        if (data) {
            await DoctorAbout.findByIdAndUpdate(data._id, { hospitalName, fullAddress, country, state, city, pinCode, specialty, treatmentAreas, fees, language, aboutYou }, { new: true })
            return res.status(200).json({
                success: true,
                message: "About data update successfully",
            });
        } else {
            await DoctorAbout.create({ hospitalName, fullAddress, country, state, city, pinCode, specialty, treatmentAreas, fees, language, aboutYou, userId })
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
const doctorEduWork = async (req, res) => {
    const { userId, education, work } = req.body;
    try {
        const user = await Doctor.findById(userId)
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
    const { userId } = req.body;
    try {
        const user = await Doctor.findById(userId)
        if (!user) return res.status(200).json({ message: "User not found", success: false })
        const licenseData = JSON.parse(req.body.medicalLicense);

        // Add fileUrl and fileType for each uploaded file
        licenseData.forEach((item, index) => {
            if (req.files[index]) {
                item.certFile = req.files[index].path
            }
        });
        const data = await DoctorEduWork.findOne({ userId });
        if (data) {
            await DoctorEduWork.findByIdAndUpdate(data._id, { medicalLicense: licenseData }, { new: true })
            return res.status(200).json({
                success: true,
                message: "Medical History update successfully",
            });
        } else {
            await DoctorEduWork.create({ medicalLicense: licenseData, userId })
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
    const image = req.files?.['profileImage']?.[0]?.path
    try {
        const user = await Doctor.findById(userId)
        if (!user) return res.status(200).json({ message: "Doctor not found", success: false })

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
    const { doctorId, message } = req.body;
    try {
        const user = await Doctor.findById(doctorId)
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
    const userId=req.params.id
    try {
        let user;
        if(userId<24){
            user = await Doctor.findOne({customId:userId}).select('-password').lean();
        }else{
            user = await Doctor.findById(userId).select('-password').lean();
        }
        if (!user) {
            return res.status(404).json({ success: false, message: 'Doctor not found' });
        }
        // const ptDemographic=await PatientDemographic.findOne({userId:user._id}).sort({createdAt:-1})
        res.status(200).json({
            success: true,
            data: user
        });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};
export { signInDoctor, updateImage, doctorEduWork,getCustomProfile, deleteEdu, doctorLicense, deleteLicense, deleteWork, doctorAbout, getProfileDetail, signUpDoctor, resetPassword, doctorKyc, editRequest, forgotEmail, verifyOtp, resendOtp, getProfile, updateDoctor, changePassword, deleteDoctor }
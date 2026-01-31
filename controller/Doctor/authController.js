

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
import User from '../../models/Hospital/User.js';
import safeUnlink from '../../utils/globalFunction.js';
import DoctorStaff from '../../models/Doctor/DoctorEmpPerson.model.js';
import EmpAccess from '../../models/Doctor/empAccess.model.js';
import City from '../../models/Hospital/City.js';
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
        const isDoctorExist = await Doctor.findOne({ email }) || await Doctor.findOne({ contactNumber })|| await User.findOne({ email });
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
            passwordHash: hashedPassword,
            doctorId: newDoctor._id,
        });

        // Link doctor → user
        newDoctor.userId = userData._id;
        await newDoctor.save();

        return res.status(201).json({
            success: true,
            message: "Doctor registered successfully",
            doctorId: newDoctor._id,
            userId: userData._id
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
    const { contactNumber, password } = req.body;
    try {


        const isExist = await Doctor.findOne({ contactNumber }).populate('userId')
        const isEmployee = await DoctorStaff.findOne({
            "contactInformation.contactNumber": contactNumber
        });;
        if (!isExist && !isEmployee) return res.status(200).json({ message: 'Doctor not Found', success: false });
        const access = isEmployee && await EmpAccess
            .findOne({ empId: isEmployee._id })
            .populate("permissionId");
        const hashedPassword = isExist ? isExist.userId?.passwordHash : access.password;
        const phone = isExist ? isExist.contactNumber : isEmployee.contactInformation.contactNumber
        const isMatch = await bcrypt.compare(password, hashedPassword);
        if (!isMatch) return res.status(200).json({ message: 'Invalid phone or password', success: false });
        const code = generateOTP()
        const isOtpExist = await Otp.findOne({ phone })
        if (isOtpExist) {
            await Otp.findByIdAndDelete(isOtpExist._id)
            const otp = await Otp.create({ phone, code })
        } else {
            const otp = await Otp.create({ phone, code })
        }
        if (isExist) {
            const isLogin = await Login.findOne({ userId: isExist._id })
            if (isLogin) {
                await Login.findByIdAndUpdate(isLogin._id, {}, { new: true })
                return res.status(200).json({ message: "Otp Sent", userId: isExist.userId._id, isNew: false, success: true })
            } else {
                await Login.create({ userId: isExist._id })
                return res.status(200).json({ message: "Otp Sent", isNew: true, userId: isExist.userId._id, success: true })
            }
        } else {

            return res.status(200).json({ message: "Otp Sent", userId: isEmployee._id, isNew: false, success: true })
        }


    } catch (err) {
        console.error(err);
        return res.status(500).json({ message: 'Server Error' });
    }
}

const verifyOtp = async (req, res) => {
    const { phone, code, name, gender, email, contactNumber, password, dob } = req.body
    try {
        // const isOtp = await Otp.findOne({ phone })
        // if (!isOtp) {
        //     return res.status(200).json({ message: "Doctor not exist", success: false })
        // }
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
                const [userExists, doctorExists] = await Promise.all([
                    User.findOne({ email }),
                    Doctor.findOne({ $or: [{ email }, { contactNumber }] })
                ]);

                if (userExists || doctorExists) {
                    return res.status(409).json({ success: false, message: "Doctor already exists" });
                }

                const hashedPassword = await bcrypt.hash(password, 10);
                const newDoctor = await Doctor.create({
                    name,
                    gender,
                    email,
                    dob,
                    contactNumber,
                });

                if (newDoctor) {
                    const user = await User.create(
                        {
                            doctorId: newDoctor?._id,
                            email,
                            name,
                            role: 'doctor',
                            created_by: 'self',
                            passwordHash: hashedPassword
                        },
                    )
                    const token = jwt.sign(
                        { user: user._id },
                        process.env.JWT_SECRET,
                        // { expiresIn: isRemember ? "30d" : "1d" }
                    );
                    await Doctor.findByIdAndUpdate(newDoctor._id, { userId: user._id }, { new: true })
                    return res.status(200).json({ success: true, nextStep: '/doctor/kyc', token, userId: user._id });
                } else {
                    return res.status(200).json({ success: false, message: "Doctor not created" });
                }

            } else {
                return res.status(200).json({ message: "Invalid otp", success: false })
            }
        } else {
            const employee = await DoctorStaff.findOne({
                "contactInformation.contactNumber": phone
            });
            if (employee) {
                const access = await EmpAccess
                    .findOne({ empId: employee._id })
                    .populate("permissionId");

                if (!access) {
                    return res.status(401).json({ success: false, message: "Invalid credentials" });
                }

                const user = await User.findById(employee.doctorId)
                const token = jwt.sign(
                    { user: user._id },
                    process.env.JWT_SECRET,
                    // { expiresIn: isRemember ? "30d" : "1d" }
                );

                return res.status(200).json({
                    success: true,
                    isOwner: false,
                    staffId: employee._id, token, userId: user._id, doctorId: user.doctorId
                });
            }
            else {

                const doctor = await Doctor.findOne({ contactNumber: contactNumber })
                const user = await User.findById(doctor.userId)
                const userId = doctor.userId
                const [
                    kyc,
                    education,
                    medicalLicense,
                    address,
                ] = await Promise.all([
                    DoctorKyc.findOne({ userId }),
                    DoctorEduWork.findOne({ userId }),
                    MedicalLicense.findOne({ userId }),
                    DoctorAbout.findOne({
                        userId,
                    }),
                ]);

                let nextStep = null;

                if (!kyc) {
                    nextStep = "/doctor/kyc";
                } else if (!education) {
                    nextStep = "/doctor/education-work";
                } else if (!medicalLicense) {
                    nextStep = "/doctor/medical-license";
                } else if (!address) {
                    nextStep = "doctor/address";
                }
                const isValid = code == "1234"
                let isNew = true;
                const isLogin = await Login.findOne({ userId })
                if (isLogin) {
                    isNew = false;
                }
                if (isValid) {
                    const token = jwt.sign(
                        { user: user._id, isOwner: true, type: 'doctor' },
                        process.env.JWT_SECRET,
                        // { expiresIn: isRemember ? "30d" : "1d" }
                    );
                    return res.status(200).json({ message: "Verify Success", nextStep, isOwner: true, token, doctorId: user?.doctorId, userId, user: user, success: true })
                } else {
                    return res.status(200).json({ message: "Invalid credentials", success: false })
                }
            }
        }
    } catch (err) {
        console.log(err)
        return res.status(400).json({ success: false, error: err.message });
    }
};
const sendOtp = async (req, res) => {
    const { contactNumber } = req.body;
    try {
        // const isExist = await Patient.findOne({contactNumber: phone });
        // if (!isExist) {
        //     return res.status(404).json({ success: false, message: 'Patient not found' });
        // }
        // const code = generateOTP()
        const code = "1234"
        const isOtpExist = await Otp.findOne({ phone: contactNumber })
        if (isOtpExist) {
            await Otp.findByIdAndDelete(isOtpExist.contactNumber)
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
            success: true,
            message: "OTP sent!"
        });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
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
        const user = await User.findOne({ email });
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
    const { userId, email, contactNumber, name, gender, dob } = req.body;
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
        const updateDoctor = await Doctor.findByIdAndUpdate(isExist.doctorId, { email, contactNumber, name, gender, dob }, { new: true })
        if (updateDoctor) {
            await User.findByIdAndUpdate(userId, { name, email }, { new: true })
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
            user = await User.findOne({ unique_id: userId }).select('-password');

        } else {
            user = await User.findById(userId).select('-password');
        }
        if (!user) {
            return res.status(404).json({ success: false, message: 'Doctor not found' });
        }
        const doctor = await Doctor.findById(user.doctorId)
        const kyc = await DoctorKyc.findOne({ userId }).sort({ createdAt: -1 })
        const medicalLicense = await MedicalLicense.findOne({ userId }).sort({ createdAt: -1 })
        const aboutDoctor = await DoctorAbout.findOne({ userId }).populate('countryId stateId cityId', 'name isoCode').sort({ createdAt: -1 })
        const eduWork = await DoctorEduWork.findOne({ userId }).sort({ createdAt: -1 })
        const rating = await Rating.find({ doctorId: userId }).populate('patientId').sort({ createdAt: -1 })
        const isRequest = await EditRequest.findOne({ doctorId: userId });
        const allowEdit = await EditRequest.exists({ doctorId: userId, status: 'approved' }).then(Boolean)

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
            user: doctor,
            kyc, isRequest, allowEdit,
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
    const { userId, type } = req.body;
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
    const { userId, lat, long, hospitalName, fullAddress, countryId, stateId, cityId, pinCode, specialty, treatmentAreas, fees, language, aboutYou } = req.body;
    try {
        const user = await User.findById(userId)
        if (!user) return res.status(200).json({ message: "User not found", success: false })
        const cityData = await City.findById(cityId)
        const finalLat = (lat !== undefined && lat !== null) ? lat : cityData?.latitude;
        const finalLong = (long !== undefined && long !== null) ? long : cityData?.longitude;
        const data = await DoctorAbout.findOne({ userId });
        if (data) {
            await DoctorAbout.findByIdAndUpdate(data._id, { hospitalName, lat:finalLat, long:finalLong, fullAddress, countryId, stateId, cityId, pinCode, specialty, treatmentAreas, fees, language, aboutYou }, { new: true })
            return res.status(200).json({
                success: true,
                message: "About data update successfully",
            });
        } else {
            await DoctorAbout.create({ hospitalName, lat:finalLat, long:finalLong, fullAddress, countryId, stateId, cityId, pinCode, specialty, treatmentAreas, fees, language, aboutYou, userId })
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
const getDoctorAbout = async (req, res) => {
    const userId = req.params.id;

    try {
        const user = await User.findById(userId)
        if (!user) return res.status(200).json({ message: "User not found", success: false })

        const data = await DoctorAbout.findOne({ userId }).populate('countryId').populate('stateId').populate('cityId');
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
    const { userId, education, work } = req.body;
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
        const { userId } = req.body;
        const user = await User.findById(userId)
        if (!user) return res.status(200).json({ message: "User not found", success: false })
        let medicalLicenseData = req.body.medicalLicense;
        // If medicalLicense data comes as JSON string (from multipart/form-data), parse it
        if (typeof medicalLicenseData === "string") {
            try {
                medicalLicenseData = JSON.parse(medicalLicenseData);
            } catch (err) {
                return res.status(400).json({ success: false, error: "Invalid medicalLicense data JSON" });
            }
        }

        // Ensure medicalLicenseData is an array
        if (!Array.isArray(medicalLicenseData)) {
            medicalLicenseData = [medicalLicenseData];
        }

        const files = req.files || [];

        // Find existing medicalLicense document for the user
        let userPrescriptionsDoc = await MedicalLicense.findOne({ userId });

        if (!userPrescriptionsDoc) {
            // No existing doc, create new one
            // Attach uploaded file paths to medicalLicense
            medicalLicenseData.forEach((license, i) => {
                if (license && files[i]) {
                    license.certFile = files[i].path;
                }
            });
            const created = await MedicalLicense.create({
                userId,
                medicalLicense: medicalLicenseData,
            });

            return res.status(201).json({
                success: true,
                message: "Medical license created successfully",
                data: created,
            });
        }

        // If doc exists, update or add medicalLicense
        medicalLicenseData.forEach((newLice, index) => {
            if (!newLice) return; // skip if undefined

            const existingPresc = userPrescriptionsDoc.medicalLicense.id(newLice._id);

            if (existingPresc) {
                // Update existing license
                if (files[index]) {
                    safeUnlink(existingPresc.certFile);
                    existingPresc.certFile = files[index].path;
                }


                existingPresc.certName = newLice.certName || existingPresc.certName;


            } else {
                // Add new license
                if (files[index]) {
                    newLice.certFile = files[index].path;
                }
                userPrescriptionsDoc.medicalLicense.push(newLice);
            }
        });

        await userPrescriptionsDoc.save();

        return res.status(200).json({
            success: true,
            message: "Medical License updated successfully",
            data: userPrescriptionsDoc,
        });
    } catch (error) {
        console.log(error)
        return res.status(500).json({
            success: false,
            message: "Internal Server Error",
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
    const { doctorId, message } = req.body;
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
        const users = await User.find(filter).select('-passwordHash')
            .populate('doctorId').sort({ createdAt: -1 })
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
    signInDoctor, updateImage, doctorEduWork, getCustomProfile, deleteEdu, doctorLicense, deleteLicense, deleteWork, doctorAbout, getProfileDetail, signUpDoctor, resetPassword, doctorKyc, editRequest, forgotEmail, verifyOtp, resendOtp, getProfile, updateDoctor, changePassword, deleteDoctor, getDoctorKyc,
    getDoctorEduWork, getDoctorLicense, getDoctorAbout, getDoctors, getDoctorData, sendOtp
}
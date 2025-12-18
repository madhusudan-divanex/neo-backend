

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
import Prescriptions from '../../models/Patient/prescription.model.js';
import EditRequest from '../../models/EditRequest.js';
import LabAppointment from '../../models/LabAppointment.js';
import safeUnlink from '../../utils/globalFunction.js';

const signUpPatient = async (req, res) => {
    const { name, gender, email, contactNumber, password, } = req.body;
    try {
        const isExist = await Patient.findOne({ email })
        if (isExist) {
            return res.status(200).json({ message: "Patient already exist", success: false })
        }
        const hashedPassword = await bcrypt.hash(password, 10);

        // Create user
        const isLast = await Patient.findOne()?.sort({ createdAt: -1 })
        const nextId = isLast
            ? String(Number(isLast.customId) + 1).padStart(4, '0')
            : '0001';
        const newPatient = await Patient.create({
            name,
            gender,
            email,
            contactNumber,
            customId: 'PAT-'+nextId,
            password: hashedPassword,
        });

        if (newPatient) {
            const code = generateOTP()
            const otp = await Otp.create({ userId: newPatient._id, code })
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
            return res.status(200).json({ success: true, newPatient, userId: newPatient._id });
        } else {
            return res.status(200).json({ success: false, message: "Patient not created" });
        }

    } catch (err) {
        console.error(err);
        return res.status(500).json({ message: 'Server Error' });
    }
}
const signInPatient = async (req, res) => {
    const { email, password } = req.body;
    try {
        const isExist = await Patient.findOne({ email });
        if (!isExist) return res.status(200).json({ message: 'Patient not Found', success: false });
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
        const isExist = await Patient.findById(userId)
        if (!isExist) {
            return res.status(200).json({ message: "Patient not exist", success: false })
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
        const isExist = await Patient.findById(id);
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
        const user = await Patient.findOne({ email });
        if (!user) {
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
            subject: "You password reset  for Neo Health!",
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

        const isExist = await Patient.findById(userId);
        if (!isExist) return res.status(400).json({ message: 'Invalid user' });

        const hashedPassword = await bcrypt.hash(password, 10);
        const updatePass = await Patient.findByIdAndUpdate(userId, { password: hashedPassword }, { new: true })
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

        const isExist = await Patient.findById(userId);
        if (!isExist) return res.status(200).json({ message: 'Invalid email' });
        const isMatch = await bcrypt.compare(oldPassword, isExist.password);
        if (!isMatch) return res.status(200).json({ message: 'Old password is incorrect', success: false });

        const hashedPassword = await bcrypt.hash(newPassword, 10);
        const updatePass = await Patient.findByIdAndUpdate(userId, { password: hashedPassword }, { new: true })
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
    try {
        const isExist = await Patient.findById(userId);
        if (!isExist) return res.status(200).json({ message: 'Patient not exist' });
        const alreadyEmail = await Patient.countDocuments({ email })
        if (alreadyEmail > 1) {
            return res.status(200).json({ message: 'Email already exist' });
        }
        const updatePatient = await Patient.findByIdAndUpdate(userId, { email, contactNumber, name, gender }, { new: true })
        if (updatePatient) {
            return res.status(200).json({ message: "Patient data change successfully", userId: isExist._id, success: true })
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
        const user = await Patient.findById(req.user.user).select('-password');
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
    const userId=req.params.id
    try {
        let user;
        if(userId<24){
            user = await Patient.findOne({customId:userId}).select('-password').lean();
        }else{
            user = await Patient.findById(userId).select('-password').lean();
        }
        if (!user) {
            return res.status(404).json({ success: false, message: 'Patient not found' });
        }
        const ptDemographic=await PatientDemographic.findOne({userId:user._id}).sort({createdAt:-1})
        res.status(200).json({
            success: true,
            data: {...user,dob:ptDemographic?.dob}
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
            user = await Patient.findOne({ customId: userId }).select('-password');
        } else {
            user = await Patient.findById(userId).select('-password');
        }
        if (!user) {
            return res.status(404).json({ success: false, message: 'Patient not found' });
        }
        const fullId=await userId<24? user._id :userId
        const kyc = await PatientKyc.findOne({ userId:fullId }).sort({ createdAt: -1 })
        const medicalHistory = await MedicalHistory.findOne({ userId:fullId }).sort({ createdAt: -1 })
        const demographic = await PatientDemographic.findOne({ userId:fullId }).sort({ createdAt: -1 })
        const prescription = await Prescriptions.findOne({ userId:fullId }).sort({ createdAt: -1 })
        const labAppointment = await LabAppointment.find({ patientId: fullId }).sort({ createdAt: -1 })

        return res.status(200).json({
            success: true,
            user,
            kyc,
            labAppointment,
            demographic, prescription, medicalHistory
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
        const user = await Patient.findById(userId)
        if (!user) return res.status(200).json({ message: "User not found", success: false })

        const data = await PatientKyc.findOne({ userId });
        if (data) {
            if (data.frontImage) {
                safeUnlink(data.frontImage)
            }
            if (data.backImage) {
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
            fs.unlinkSync(frontImage)
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
        const user = await Patient.findById(userId)
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
        return res.status(500).json({
            success: false,
            message: "Internal Server Error",
        });
    }
};
const getPatientDemographic = async (req, res) => {
    const userId = req.params.id;

    try {
        const user = await Patient.findById(userId)
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
const patientMedicalHistory = async (req, res) => {
    const { userId, alcohol, smoking, allergies, medicationDetail, onMedication, chronicCondition, familyHistory } = req.body;
    try {
        const user = await Patient.findById(userId)
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
const addPrescriptions = async (req, res) => {
  try {
    const { userId } = req.body;
    let prescriptionsData = req.body.prescriptions;

    if (!Array.isArray(prescriptionsData)) {
      prescriptionsData = [prescriptionsData];
    }

    const files = req.files || [];

    // Find existing document for user
    let userPrescriptionsDoc = await Prescriptions.findOne({ userId });

    if (!userPrescriptionsDoc) {
      // Create new document if doesn't exist
      // Attach file paths to new prescriptions
      prescriptionsData.forEach((prescription, i) => {
        if (files[i]) {
          prescription.fileUrl = files[i].path;
        }
      });

      const created = await Prescriptions.create({
        userId,
        prescriptions: prescriptionsData,
      });

      return res.status(201).json({
        success: true,
        message: "Prescriptions created successfully",
        data: created,
      });
    }
    prescriptionsData.forEach((newPresc, index) => {
      const existingPresc = userPrescriptionsDoc.prescriptions.id(newPresc._id); 
      if (existingPresc) {
        // If file uploaded for this prescription, delete old file and update fileUrl
        if (files[index]) {
          safeUnlink(existingPresc.fileUrl);
          existingPresc.fileUrl = files[index].path;
        }

        // Update other fields
        existingPresc.name = newPresc.name;
        existingPresc.diagnosticName = newPresc.diagnosticName;
        // update other fields similarly if any

      } else {
        // If no matching existing prescription, push new one
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
    res.status(500).json({ success: false, error: err.message });
  }
};


 
const deletePrescription = async (req, res) => {
    try {
        const { id, itemId } = req.params;

        const record = await Prescriptions.findById(id);
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
        const user = await Patient.findById(patientId)
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
        const users = await Patient.find({ name:{ $regex: name, $options: "i" } })
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
    getPatientDemographic,getCustomProfile,getNameProfile
}
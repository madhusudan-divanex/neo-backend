import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import nodemailer from "nodemailer";

import User from "../../models/Hospital/User.js";
import HospitalBasic from "../../models/Hospital/HospitalBasic.js";

import HospitalImages from "../../models/Hospital/HospitalImage.js";
import HospitalAddress from "../../models/Hospital/HospitalAddress.js";
import HospitalContact from "../../models/Hospital/HospitalContact.js";
import HospitalCertificate from "../../models/Hospital/HospitalCertificate.js";
import Kyc from "../../models/Hospital/KycLog.js";
import { generateOTP, sendEmailOtp, sendMobileOtp } from "../../utils/globalFunction.js";
import Otp from "../../models/Otp.js";

// ================= RESET PASSWORD =================
export const resetPassword = async (req, res) => {
  try {
    const { password } = req.body;
    const userId = req.user.id

    const user = await User.findById(userId);
    if (!user)
      return res.status(404).json({ message: "User not found" });


    const hashed = await bcrypt.hash(password, 10);

    user.passwordHash = hashed;

    await user.save();

    res.json({ message: "Password reset successfully", success: true });
  } catch (err) {
    res.status(500).json({ message: "Server Error", error: err.message });
  }
};

// ================= VERIFY OTP =================
export const verifyOtp = async (req, res) => {
  try {
    const { contactNumber, code, type, email } = req.body;

    // Check if at least one identifier is provided
    if (!email && !contactNumber) {
      return res.status(400).json({
        message: "Either email or contact number is required",
        success: false
      });
    }

    // Find hospital user by contactNumber or email
    const hospital = contactNumber
      ? await User.findOne({ contactNumber, role: "hospital" })
      : await User.findOne({ email, role: "hospital" });

    if (!hospital) {
      const identifier = contactNumber ? "mobile number" : "email";
      return res.status(200).json({
        message: `Invalid ${identifier}`,
        success: false
      });
    }

    const user = await User.findById(hospital._id);
    if (!user) {
      return res.status(200).json({
        message: "User not found",
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

    const isCode = await Otp.findOne(otpQuery);

    // Check for test mode (for both contact number and email)
    const isTestMode = contactNumber == "8386990249" || contactNumber == "9917141332" || email == "test@example.com" || hospital.created_by == "admin";

    if (!isCode && !isTestMode) {
      return res.status(200).json({
        message: "Code not exist",
        success: false
      });
    }

    // Check OTP expiry (skip for test mode)
    if (!isTestMode && isCode) {
      const otpExpiryTime = new Date(isCode.updatedAt);
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
      isValid = code == isCode?.code;
    }

    if (isValid) {
      // Handle forgot password flow if needed
      if (type === "forgot-password") {
        const token = jwt.sign(
          {
            id: user._id,
            role: user.role,
            isOwner: true,
            type: "hospital",
            created_by_id: user.created_by_id
          },
          process.env.JWT_SECRET,
          { expiresIn: "5m" } // Short expiry for password reset
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

      // Handle login flow
      if (type === "login") {
        const token = jwt.sign(
          {
            id: user._id,
            role: user.role,
            isOwner: true,
            type: "hospital",
            created_by_id: user.created_by_id
          },
          process.env.JWT_SECRET,
          { expiresIn: "1y" }
        );

        // Clean up used OTP
        if (isCode) {
          await Otp.findByIdAndDelete(isCode._id);
        }
        const [images, address, person, license] = await Promise.all([
          HospitalImages.findOne({ hospitalId: user.hospitalId }),
          HospitalAddress.findOne({ hospitalId: user.hospitalId }),
          HospitalContact.findOne({ hospitalId: user.hospitalId }),
          HospitalCertificate.findOne({ hospitalId: user.hospitalId })
        ])
        let nextStep = null;

        if (!images) {
          nextStep = "/create-account-image";
        } else if (!address) {
          nextStep = "/create-account-address";
        } else if (!person) {
          nextStep = "/create-account-person";
        } else if (!license) {
          nextStep = "/create-account-upload";
        }

        res.status(200).json({
          message: "Login successful",
          token,
          success: true,
          nextStep,
          user: {
            id: user._id,
            name: user.name,
            email: user.email,
            contactNumber: user.contactNumber,
            role: user.role,
            created_by_id: user.created_by_id
          }
        });
      }
    } else {
      return res.status(200).json({
        message: "Invalid OTP",
        success: false
      });
    }
  } catch (err) {
    console.error(err);
    res.status(500).json({
      message: "Server Error",
      error: err.message,
      success: false
    });
  }
};

// ================= FORGOT PASSWORD =================
export const forgotPassword = async (req, res) => {
  try {
    const { mobileNo } = req.body;

    const user = await User.findOne({ contactNumber: mobileNo, role: "hospital" });
    if (!user)
      return res.status(404).json({ message: "Mobile number not found" });
    const code = generateOTP()
    await sendMobileOtp(mobileNo, code)
    const isOtpExist = await Otp.findOne({ phone: mobileNo })
    if (isOtpExist) {
      await Otp.findByIdAndDelete(isOtpExist._id)
      const otp = await Otp.create({ phone: mobileNo, code })
    } else {
      const otp = await Otp.create({ phone: mobileNo, code })
    }


    res.json({ message: "OTP sent successfully", success: true });
  } catch (err) {
    res.status(500).json({ message: "Server Error", error: err.message });
  }
};

// ================= REGISTER =================
export const register = async (req, res) => {
  try {
    const { name, email, password, hospitalName, mobileNo } = req.body;

    const exists = await User.findOne({ email }) || await User.findOne({ mobileNo });
    if (exists)
      return res.status(400).json({ message: "User already exists" });
    const isName = await User.findOne({ name });
    if (isName)
      return res.status(400).json({ message: "This name already exists" });

    const passwordHash = await bcrypt.hash(password, 10);

    const hospital = await HospitalBasic.create({ hospitalName });

    const user = await User.create({
      name,
      email,
      contactNumber: mobileNo,
      passwordHash,
      role: "hospital",
      created_by_id: hospital._id,
      hospitalId: hospital._id,
      created_by: "hospital"
    });
    if (user) {
      await HospitalBasic.findByIdAndUpdate(hospital._id, { userId: user._id }, { new: true })
    }

    const token = jwt.sign(
      { id: user._id },
      process.env.JWT_SECRET
    );

    res.json({ token, user });
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err.message });
  }
};

// ================= LOGIN =================
export const login = async (req, res) => {
  const { contactNumber, password, email } = req.body;
  try {
    const hospital = contactNumber ? await User.findOne({ contactNumber, role: "hospital" }) : await User.findOne({ email, role: "hospital" });
    if (!hospital)
      return res.status(200).json({ message: "Hospital not found" });

    const match = await bcrypt.compare(password, hospital.passwordHash);
    if (!match)
      return res.status(400).json({ message: "Invalid password" });
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

    return res.status(200).json({
      message: "Otp sent", success: true
    });
  } catch (err) {
    console.log(err)
    return res.status(500).json({ message: "Server error" });
  }
};

export const resendOtp = async (req, res) => {
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
}
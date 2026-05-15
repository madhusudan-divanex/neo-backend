import User from "../models/Hospital/User.js";
import Staff from "../models/Staff/Staff.js";
import jwt from 'jsonwebtoken'
import mongoose from "mongoose";
import bcrypt from "bcryptjs";
import Country from "../models/Hospital/Country.js";
import { assignNH12 } from "../utils/nh12.js";
import StaffEmployement from "../models/Staff/StaffEmployement.js";
import Otp from "../models/Otp.js";
import { generateOTP, sendEmailOtp, sendMobileOtp } from "../utils/globalFunction.js";
import DoctorAbout from "../models/Doctor/addressAbout.model.js";


export const createStaffProfile = async (req, res) => {
  try {
    // 🔹 Files
    const profileImage = req.files?.profileImage?.[0]?.path || null;
    // 🔹 Extract fields directly from req.body
    const {
      name,
      dob,
      gender,
      address,
      countryId,
      stateId,
      cityId,
      pincode,
      contactNumber,
      email,
      emergencyContactName,
      emergencyContactPhone,
    } = req.body;

    // ✅ Validation
    if (!name || !email || !contactNumber) {
      return res.status(400).json({
        success: false,
        message: "Name, email and contactNumber are required"
      });
    }

    const userData = req.user && (req.user.id || req.user.userId);
    if (!userData) {
      return res.status(404).json({ message: "Requesting user not found" });
    }
    // ✅ Check duplicate user
    const existingUser = await User.findOne({
      $or: [{ email }, { contactNumber }]
    });

    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: "User already exists"
      });
    }
    // 🔐 password hash
    const rawPassword = contactNumber.slice(-4) + "@123";
    const passwordHash = await bcrypt.hash(rawPassword, 10);

    // ✅ Create user
    const user = await User.create({
      email,
      contactNumber,
      name,
      passwordHash,
      role: "staff",
      created_by_id: userData,
      created_by: req.user?.role || "admin"
    });
    // 🔹 Assign NH12
    if (countryId) {
      const countryData = await Country.findById(countryId);
      if (countryData?.phonecode) {
        await assignNH12(user._id, countryData.phonecode);
      }
    }
    // ✅ Create staff profile
    const staff = await Staff.create({
      userId: user._id,
      profileImage,
      name,
      dob,
      gender,
      address,
      countryId,
      stateId,
      cityId,
      pincode,
      contactNumber,
      email,
      emergencyContactName,
      emergencyContactPhone,

    });
    if (staff) {
      await User.findByIdAndUpdate(user._id, { staffId: staff._id }, { new: true })
    }

    return res.status(201).json({
      success: true,
      message: "Staff created successfully",
      data: staff,
      user
    });

  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};
export const createStaffProffessional = async (req, res) => {
  try {
    const certificateFiles = req.files?.certificates || [];
    let certificateNames = [];

    if (req.body.certificateNames) {
      certificateNames =
        typeof req.body.certificateNames === "string"
          ? JSON.parse(req.body.certificateNames)
          : req.body.certificateNames;
    }
    const certificates = certificateFiles.map((file, index) => ({
      certificateName: certificateNames[index] || file.originalname,
      certificateFile: file.path
    }));

    // 🔹 Extract fields directly from req.body
    const { staffId, education, profession,
      specialization,
      experience,
      bio, } = req.body;

    const userData = req.user && (req.user.id || req.user.userId);

    if (!userData) {
      return res.status(404).json({ message: "Requesting user not found" });
    }

    // ✅ Check duplicate user
    const staffData = await User.findById(staffId);

    if (!staffData) {
      return res.status(400).json({
        success: false,
        message: "Staff not founds"
      });
    }
    // ✅ Create staff profile
    const staff = await Staff.findByIdAndUpdate(staffData?.staffId, {
      profession,
      specialization,
      experience,
      bio,
      education: education ? JSON.parse(education) : [],
      certificates
    }, { new: true });


    return res.status(201).json({
      success: true,
      message: "Staff professional detail created successfully",
      data: staff
    });

  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message
    });
  }
};
export const getStaffByNHId = async (req, res) => {
  const id = req.params.id
  const organizationId = req.user.id || req.user.userId
  try {
    const user = await User.findOne({ nh12: id, role: "staff" }).select('name email contactNumber nh12')
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    const staffData = await Staff.findOne({ userId: user._id }).populate('countryId stateId cityId')
    const isEmployement = await StaffEmployement.findOne({ organizationId, userId: user._id }).populate('permissionId')
    if (isEmployement) {
      return res.status(200).json({ success: true, staffData, employment: isEmployement, user })
    } else {

      return res.status(200).json({ success: true, staffData })
    }

  } catch (error) {
    return res.status(500).json({ message: error?.message, success: false })
  }
}
export const getStaffById = async (req, res) => {
  const id = req.params.id
  const organizationId = req.user.id || req.user.userId
  try {
    const user = await User.findById(id).select('name email contactNumber nh12 role')
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    if (user.role == "staff") {
      const staffData = await Staff.findOne({ userId: user._id }).populate('countryId stateId cityId')
      const isEmployement = await StaffEmployement.findOne({ organizationId, userId: user._id }).populate('permissionId')
      return res.status(200).json({ success: true, staffData, employment: isEmployement, user })
    } else {
      const staffData = await DoctorAbout.findOne({ userId: user._id })
      const isEmployement = await StaffEmployement.findOne({ userId: user._id, organizationId }).populate('permissionId')
      return res.status(200).json({ success: true, staffData, employment: isEmployement, user })
    }


  } catch (error) {
    console.log(error)
    return res.status(500).json({ message: error?.message, success: false })
  }
}
export const createStaffEmployement = async (req, res) => {
  try {
    const userId = req.user && (req.user.id || req.user.userId);
    const userData = await User.findById(userId)
    if (!userData) {
      return res.status(404).json({ message: "Requesting user not found" });
    }
    const { staffId, fees, department, role, note, joinDate, salary, status, contactNumber, email, contractStart, contractEnd,
      password, permissionId } = req.body
    const staff = await User.findOne({ _id: staffId, role: "staff" })
    if (!staff) return res.status(404).json({ message: "staff not found", success: false })

    const staffEmp = await StaffEmployement.findOne({ userId: staff._id, organizationId: userData?._id })
    if (staffEmp) {
      const passwordHash = await bcrypt.hash(password, 10)
      const empData = await StaffEmployement.findOneAndUpdate({ userId: staff._id, organizationId: userData?._id }, {

        organizationType: userData?.role, fees,
        department, role, note, joinDate, salary, status, contactNumber, email,
        password: passwordHash, permissionId, contractStart, contractEnd
      })

      if (empData) {
        return res.status(200).json({ message: "Employement updated", success: true })
      } else {
        return res.status(200).json({ message: "Error occure while createing employement updated", success: false })
      }
    } else {
      const passwordHash = await bcrypt.hash(password, 10)
      const empData = await StaffEmployement.create({
        userId: staff._id,
        organizationId: userData?._id, fees,
        organizationType: userData?.role,
        department, role, note, joinDate, salary, status, contactNumber, email,
        password: passwordHash, permissionId, contractStart, contractEnd
      })

      if (empData) {
        return res.status(200).json({ message: "Employement Created", success: true })
      } else {
        return res.status(200).json({ message: "Error occure while createing employement created", success: false })
      }
    }


  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};
export const getStaffEmployement = async (req, res) => {
  try {
    const userId = req.user && (req.user.id || req.user.userId);
    const userData = await User.findById(userId)
    if (!userData) {
      return res.status(404).json({ message: "Requesting user not found" });
    }
    const data = await StaffEmployement.find({ status: { $ne: "inactive" }, organizationId: userId }).select('role userId').populate('userId','name').sort({createdAt:-1})

    return res.status(200).json({ message: "Employement fetched", data, success: true })
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};
export const updateStaffEmployement = async (req, res) => {
  try {
    const userId = req.user && (req.user.id || req.user.userId);
    const userData = await User.findById(userId)
    if (!userData) {
      return res.status(404).json({ message: "Requesting user not found" });
    }
    const { empId, department, role, position, joinDate, salary, status, contactNumber, email,
      password, permissionId } = req.body

    const empData = await StaffEmployement.findByIdAndUpdate(empId, {
      department, role, position, joinDate, salary, status, contactNumber, email,
      password, permissionId
    }, { new: true })

    if (empData) {
      return res.status(200).json({ message: "Employement Updated", success: true })
    } else {
      return res.status(200).json({ message: "Error occure while createing employement created", success: false })
    }


  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};
export const getStaffList = async (req, res) => {
  const id = req.user.id || req.user.userId;
  const { name, limit = 10, page = 1, status, userRole } = req.query;

  try {
    let filter = { organizationId: id, userRole: "staff" };

    if (status) {
      filter.status = status;
    }
    if (userRole) {
      filter.userRole = userRole
    }

    const limitInt = parseInt(limit);
    const pageInt = parseInt(page);
    const skip = (pageInt - 1) * limitInt;

    const total = await StaffEmployement.countDocuments(filter);

    const staffData = await StaffEmployement.find(filter)
      .select('userId permissionId department status role joinDate')
      .populate({
        path: 'userId',
        select: 'nh12 name email contactNumber',
        match: name ? { name: { $regex: name, $options: 'i' } } : {}, // ✅ user filter applied
        populate: {
          path: 'staffId',
          select: 'profileImage gender'
        }
      })
      .populate('permissionId', 'name')
      .limit(limitInt)
      .skip(skip);

    // ❗ important: null users remove karo (match fail hone par)
    const filteredData = staffData.filter(item => item.userId !== null);

    return res.status(200).json({
      success: true,
      staffData: filteredData,
      pagination: {
        total: filteredData.length, // optional: ya original total use karo
        page: pageInt,
        limit: limitInt,
        totalPages: Math.ceil(total / limitInt)
      }
    });

  } catch (error) {
    return res.status(500).json({ message: error?.message, success: false });
  }
};
export const staffAction = async (req, res) => {
  const { empId, status } = req.body
  try {
    const data = await StaffEmployement.findByIdAndUpdate(empId, { status }, { new: true })
    if (data) {
      return res.status(200).json({ message: "Staff employment status was updated", success: true })
    } else {
      return res.status(404).json({ message: "Staff employment not found", success: false })
    }
  } catch (error) {
    return res.status(500).json({ message: error?.message, success: false })
  }
}
export const staffLogin = async (req, res) => {
  const { panelId, email, contactNumber, password, withOtp } = req.body
  try {
    const panelData = await User.findOne({ nh12: panelId })
    if (!panelData) {
      return res.status(404).json({ message: "User not found " })
    }
    const isStaff = await StaffEmployement.findOne({
      $or: [
        ...(email ? [{ email }] : []),
        ...(contactNumber ? [{ contactNumber }] : [])
      ],
      organizationId: panelData._id, status: "active"
    })
    if (!isStaff) {
      return res.status(404).json({ message: "Staff not found " })
    }
    console.log(isStaff, email, contactNumber)
    const staffUser = await User.findById(isStaff.userId)
    const isMatch = await bcrypt.compare(password, isStaff.password);
    if (isMatch) {
      if (withOtp) {
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
          message: "Otp sent", success: true, staffId: staffUser?._id
        });
      } else {
        const token = jwt.sign(
          {
            id: panelData._id,
            created_by_id: panelData._id,
            isOwner: false,
            loginUser: staffUser?._id,
            type: panelData?.role,
            permissionId: isStaff.permissionId,
          },
          process.env.JWT_SECRET,
          { expiresIn: "1y" }
        );
        if (panelData.role == "hospital") {
          return res.status(200).json({
            message: "Login successful",
            token,
            success: true,
            staffId: staffUser?._id,
            user: {
              id: panelData._id,
              name: panelData.name,
              email: panelData.email,
              contactNumber: panelData.contactNumber,
              role: panelData.role,
              created_by_id: panelData.created_by_id
            }
          });
        } else {
          return res.status(200).json({
            message: "Login successful",
            token,
            success: true,
            staffId: staffUser?._id,
            userId: panelData?._id
          })
        }
      }

    } else {
      return res.status(404).json({ message: "Invalid credentials " })
    }


  } catch (error) {
    return res.status(500).json({ message: error?.message, success: false })
  }
}
export const verifyOtp = async (req, res) => {
  const { staffId, panelId, email, contactNumber, code } = req.body
  try {
    if (!email && !contactNumber) {
      return res.status(400).json({
        message: "Either email or contact number is required",
        success: false
      });
    }
    const otpQuery = { code };
    if (contactNumber) {
      otpQuery.phone = contactNumber;
    }
    if (email) {
      otpQuery.email = email;
    }
    const isCode = await Otp.findOne(otpQuery);
    if (!isCode) {
      return res.status(200).json({
        message: "Code not exist",
        success: false
      });

    }
    if (isCode) {
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
    let isValid = code == isCode?.code;
    if (isValid) {
      const panelData = await User.findOne({ nh12: panelId })
      const staffEmployement = await StaffEmployement.findOne({
        organizationId: panelData._id,
        userId: staffId, status: "active"
      })
      console.log(staffEmployement)
      const token = jwt.sign(
        {
          id: panelData._id,
          created_by_id: panelData._id,
          isOwner: false,
          loginUser: staffId,
          type: panelData?.role,
          permissionId: staffEmployement.permissionId,
        },
        process.env.JWT_SECRET,
        { expiresIn: "1y" }
      );
      if (isCode) {
        await Otp.findByIdAndDelete(isCode._id);
      }
      if (panelData.role == "hospital") {
        return res.status(200).json({
          message: "Login successful",
          token,
          success: true,
          staffId,
          user: {
            id: panelData._id,
            name: panelData.name,
            email: panelData.email,
            contactNumber: panelData.contactNumber,
            role: panelData.role,
            created_by_id: panelData.created_by_id
          }
        });
      } else {
        return res.status(200).json({
          message: "Login successful",
          token,
          success: true,
          staffId,
          userId: panelData?._id
        })
      }
    } else {
      return res.status(200).json({
        message: "Invalid OTP",
        success: false
      });
    }




  } catch (error) {
    return res.status(500).json({ message: error?.message, success: false })
  }
}
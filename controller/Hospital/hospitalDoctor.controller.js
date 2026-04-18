import DoctorAbout from "../../models/Doctor/addressAbout.model.js";
import Doctor from "../../models/Doctor/doctor.model.js";
import HospitalDoctor from "../../models/Hospital/HospitalDoctor.js";
import User from "../../models/Hospital/User.js";
import bcrypt from "bcryptjs";
import safeUnlink from "../../utils/globalFunction.js";
import fs from 'fs';
import MedicalLicense from "../../models/Doctor/medicalLicense.model.js";
import DoctorEduWork from "../../models/Doctor/eduWork.js";
import DoctorAppointment from "../../models/DoctorAppointment.js";
import Permissions from '../../models/Permission.js'
import BedAllotment from "../../models/Hospital/BedAllotment.js";
import TimeSlot from "../../models/TimeSlot.js";
import mongoose from "mongoose";
import Country from "../../models/Hospital/Country.js";
import { assignNH12 } from "../../utils/nh12.js";
import HospitalAudit from "../../models/Hospital/HospitalAudit.js";
import StaffEmployement from "../../models/Staff/StaffEmployement.js";
export const createHospitalDoctor = async (req, res) => {
  const image = req.file?.path;
  try {
    const hospitalId = req.user._id;

    // Because of FormData, req.body fields are strings. Parse personal and address if sent as JSON strings
    let personal = {};
    let address = {};

    if (req.body.personal) {
      personal = JSON.parse(req.body.personal);
    } else {
      // or map fields manually from req.body
      personal = {
        name: req.body.name,
        email: req.body.email,
        contactNumber: req.body.contactNumber,
        gender: req.body.gender,
        dob: req.body.dob,
        profileImage: image
      };
    }

    if (req.body.address) {
      address = JSON.parse(req.body.address);
    } else {
      // map manually or leave empty
      address = {
        countryId: req.body.countryId,
        stateId: req.body.stateId,
        cityId: req.body.cityId,
        pinCode: req.body.pinCode,
        fullAddress: req.body.fullAddress,

        contact: {
          emergencyContactName: req.body.emergencyContactName,
          emergencyContactNumber: req.body.emergencyContactNumber,
        },
      };
    }

    // Check if doctor exists
    const isExist = await User.findOne({
      $or: [
        { email: personal.email },
        { contactNumber: personal.contactNumber }
      ]
    });

    if (isExist) {
      const path = req.file?.path;
      if (path && fs.existsSync(path)) {
        safeUnlink(path);
      }

      return res.status(200).json({
        message: "Doctor already exists",
        success: false
      });
    }

    // Create Doctor
    const personalData = await Doctor.create({
      profileImage: req.file?.path,
      name: personal.name,
      email: personal.email,
      contactNumber: personal.contactNumber,
      gender: personal.gender,
      dob: personal.dob,
    });

    if (personalData) {
      // Create User with hashed password
      const rawPassword = personal.contactNumber.slice(-4) + "@123";
      const passwordHash = await bcrypt.hash(rawPassword, 10);

      const pt = await User.create({
        name: personal.name,
        doctorId: personalData._id,
        email: personal.email,
        role: 'doctor',
        created_by: "hospital",
        created_by_id: hospitalId,
        passwordHash,
      });

      // Link userId to Doctor
      await Doctor.findByIdAndUpdate(personalData._id, { userId: pt._id }, { new: true });

      // Create DoctorAbout / Address
      const addressData = await DoctorAbout.create({
        userId: pt._id,
        ...address,
      });
      const contryData = await Country.findById(req.body.countryId)
      if (contryData) {
        await assignNH12(pt._id, contryData?.phonecode)
      }
      if (req.user.loginUser) {
        await HospitalAudit.create({ hospitalId, actionUser: req.user.loginUser, note: "created a doctor personal information." })
      } else {
        await HospitalAudit.create({ hospitalId, note: "created a doctor personal information." })
      }
      return res.status(201).json({
        success: true, doctorId: pt._id,
        message: "User created successfully",
      });
    }
    return res.status(200).json({
      success: false,
      message: "Doctor not created",
    });


  } catch (error) {
    const path = req.file?.path;
    if (path && fs.existsSync(path)) {
      safeUnlink(path);
    }
    console.error(error);
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};


export const getMyAllStaffList = async (req, res) => {
  try {
    const hospitalId = req.user.id;

    const staff = await HospitalDoctor.find({ hospitalId })
      .select("-accessInfo.passwordHash")
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      data: staff
    });

  } catch (err) {
    res.status(500).json({
      success: false,
      message: err.message
    });
  }
};

export const getHospitalDoctorList = async (req, res) => {
  try {
    const hospitalId = req.user._id || req.query.userId;
    const {
      page = 1,
      limit = 10,
      search = "",
      departments,
      doctorStatus
    } = req.query;

    const skip = (Number(page) - 1) * Number(limit);

    /* --------------------------------------------------
       1. Fetch doctors from EmpEmployement (source of truth)
    --------------------------------------------------- */
    const empQuery = {organizationId: hospitalId,userRole:"doctor" };

    if (doctorStatus) {
      const statusArray = Array.isArray(doctorStatus)
        ? doctorStatus
        : doctorStatus.split(",");

      empQuery.status = { $in: statusArray };
    }

    if (departments) {
      const deptArray = departments.split(",");
      empQuery.department = { $in: deptArray };
    }
    const employments = await StaffEmployement
      .find(empQuery)
      .select("userId");
    const userIds = employments.map(e => e.userId);

    if (!userIds.length) {
      return res.json({
        success: true,
        data: [],
        pagination: {
          total: 0,
          page: Number(page),
          limit: Number(limit),
          totalPages: 0
        }
      });
    }

    /* --------------------------------------------------
       2. Fetch users (doctors)
    --------------------------------------------------- */
    const userQuery = {
      _id: { $in: userIds },
      role: "doctor"
    };

    if (search) {
      userQuery.$or = [
        { name: { $regex: search, $options: "i" } },
        { email: { $regex: search, $options: "i" } }
      ];
    }
    const [staff, total] = await Promise.all([
      User.find(userQuery)
        .select("name email contactNumber doctorId")
        .populate("doctorId", "profileImage")
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(Number(limit)),

      User.countDocuments(userQuery)
    ]);
    const staffIds = staff.map(u => u._id);

    /* --------------------------------------------------
       3. Doctor About
    --------------------------------------------------- */
    const doctorAbouts = await DoctorAbout.find({
      userId: { $in: staffIds }
    }).select('specialty userId').populate('specialty', 'name');

    /* --------------------------------------------------
   4. Total Unique Patient Count (Appointment + Bed)
--------------------------------------------------- */

    const totalPatientCounts = await DoctorAppointment.aggregate([
      {
        $match: {
          doctorId: { $in: staffIds },
          hospitalId
        }
      },
      {
        $project: {
          doctorId: 1,
          patientId: 1
        }
      },

      // Merge BedAllotment collection
      {
        $unionWith: {
          coll: "bedallotments", // ⚠️ must match actual collection name
          pipeline: [
            {
              $match: {
                doctorId: { $in: staffIds },
                hospitalId
              }
            },
            {
              $project: {
                doctorId: 1,
                patientId: 1
              }
            }
          ]
        }
      },

      // Remove duplicate doctor-patient combinations
      {
        $group: {
          _id: {
            doctorId: "$doctorId",
            patientId: "$patientId"
          }
        }
      },

      // Count unique patients per doctor
      {
        $group: {
          _id: "$_id.doctorId",
          totalUniquePatientCount: { $sum: 1 }
        }
      }
    ]);

    /* --------------------------------------------------
       5. Employment details
    --------------------------------------------------- */
    const doctorEmployements = await StaffEmployement.find({
      userId: { $in: staffIds },
      organizationId:hospitalId
    }).select('status userId');
    const totalPatientMap = new Map(
      totalPatientCounts.map(d => [
        d._id.toString(),
        d.totalUniquePatientCount
      ])
    );
    /* --------------------------------------------------
       6. Merge everything
    --------------------------------------------------- */
    const staffWithDetails = staff.map(user => {
      const about = doctorAbouts.find(
        da => da.userId.toString() === user._id.toString()
      );

      const totalPatientMap = new Map(
        totalPatientCounts.map(d => [
          d._id.toString(),
          d.totalUniquePatientCount
        ])
      );

      const employement = doctorEmployements.find(
        de => de.userId.toString() === user._id.toString()
      );

      return {
        ...user.toObject(),
        doctorAbout: about || null,
        employement: employement || null,
        uniquePatientCount: totalPatientMap.get(user._id.toString()) || 0
      };
    });

    /* --------------------------------------------------
       7. Response
    --------------------------------------------------- */
    res.json({
      success: true,
      data: staffWithDetails,
      pagination: {
        total,
        page: Number(page),
        limit: Number(limit),
        totalPages: Math.ceil(total / limit)
      }
    });

  } catch (error) {
    console.log(error)
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};


export const getHospitalDoctorByIdNew = async (req, res) => {
  try {
    const hospitalId = req.user.id;
    const { id } = req.params;

    const doctor = await Doctor.findOne({
      userId: id,
    });
    const user = await User.findById(id);

    if (!doctor) {
      return res.status(404).json({
        success: false,
        message: "Doctor not found"
      });
    }

    const aboutDoctor = await DoctorAbout.findOne({ userId: id }).populate('cityId stateId countryId specialty treatmentAreas', 'name')
    const aboutDoctorEduWork = await DoctorEduWork.findOne({ userId: id })
    const employmentDetails = await StaffEmployement.findOne({ userId: id, organizationId: hospitalId })?.populate('department','departmentName').populate('permissionId','name')
   

    const licenses = await MedicalLicense.findOne({ userId: id }) || [];

    return res.json({
      success: true, customId: user.nh12,
      data: { doctor, aboutDoctor }, aboutDoctorEduWork, employmentDetails,  licenses
    });

  } catch (err) {
    console.error("getHospitalDoctorById error:", err);
    return res.status(500).json({
      success: false,
      message: err.message
    });
  }
};
export const getHospitalDoctorEmployement = async (req, res) => {
  try {
    const hospitalId = req.params.hospitalId;
    const userId = req.params.doctorId;

    const user = await User.findById(userId);
    const hospital = await User.findOne({ hospitalId });

    if (!user || !hospitalId) {
      return res.status(404).json({
        success: false,
        message: "Doctor not found"
      });
    }
    const employmentDetails = await StaffEmployement.findOne({ userId: user._id, organizationId: hospital?._id })?.populate('department').populate('hospitalId', 'name')

    return res.json({
      success: true,
      employmentDetails,
    });

  } catch (err) {
    console.error("getHospitalDoctorById error:", err);
    return res.status(500).json({
      success: false,
      message: err.message
    });
  }
};

export const getHospitalDoctorById = async (req, res) => {
  try {
    const hospitalId = req.user.id;
    const { id } = req.params;

    const staff = await HospitalDoctor.findOne({
      _id: id,
      hospitalId
    }).select("-accessInfo.passwordHash");

    if (!staff) {
      return res.status(404).json({
        success: false,
        message: "Doctor not found"
      });
    }

    const base_url = process.env.BASE_URL;

    res.json({
      success: true,
      data: staff,
      base_url
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: err.message
    });
  }
};

export const updateHospitalDoctor = async (req, res) => {
  try {
    const { id } = req.params;
    const data = JSON.parse(req.body.data);
    const hospitalId = req.user.id;

    const staff = await HospitalDoctor.findOne({
      _id: id,
      hospitalId
    });

    if (!staff) {
      return res.status(404).json({
        success: false,
        message: "Doctor not found"
      });
    }

    const user = await User.findOne({ _id: staff.userId });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "Linked user not found"
      });
    }

    if (
      data.accessInfo.accessEmail &&
      data.accessInfo.accessEmail !== user.email
    ) {
      const emailExists = await User.findOne({
        email: data.accessInfo.accessEmail,
        _id: { $ne: user._id }
      });

      if (emailExists) {
        return res.status(400).json({
          success: false,
          message: "Email already registered"
        });
      }

      user.email = data.accessInfo.accessEmail;
    }

    if (data.accessInfo.password) {
      const salt = await bcrypt.genSalt(10);
      user.passwordHash = await bcrypt.hash(
        data.accessInfo.password,
        salt
      );
    }

    user.name = data.personalInfo.name;
    await user.save();

    if (req.files?.profileImage?.length) {
      data.personalInfo.profileImage =
        req.files.profileImage[0].filename;
    } else {
      data.personalInfo.profileImage =
        staff.personalInfo.profileImage;
    }

    data.professionalInfo.education = Array.isArray(
      data.professionalInfo?.educations
    )
      ? data.professionalInfo.educations.map(e => ({
        university: e.university,
        degree: e.degree,
        yearFrom: e.fromYear,
        yearTo: e.toYear
      }))
      : staff.professionalInfo.education || [];

    const uploadedCertificates = req.files?.certificates || [];

    data.professionalInfo.certificates = Array.isArray(
      data.professionalInfo?.certificates
    )
      ? data.professionalInfo.certificates.map((c, index) => ({
        certificateName: c.name || "",
        certificateFile:
          uploadedCertificates[index]?.filename ||
          c.certificateFile ||
          ""
      }))
      : [];

    data.accessInfo = {
      userId: user._id,
      username: data.accessInfo.username,
      accessEmail: data.accessInfo.accessEmail,
      permissionType:
        data.accessInfo.permissionType ||
        staff.accessInfo.permissionType
    };

    data.userId = user._id;
    Object.assign(staff, data);
    await staff.save();

    return res.json({
      success: true,
      message: "Doctor updated successfully",
      data: staff
    });

  } catch (err) {
    console.error("updateHospitalDoctor error:", err);
    return res.status(500).json({
      success: false,
      message: err.message
    });
  }
};

export const deleteDoctor = async (req, res) => {
  try {
    const hospitalId = req.user._id;
    const { id } = req.params;

    const doctor = await User.findOne({
      _id: id,
      created_by_id: hospitalId
    });

    if (!doctor) {
      return res.status(404).json({
        success: false,
        message: "Doctor not found"
      });
    }
    await StaffEmployement.findOneAndDelete({ userId: doctor._id });
    await User.findByIdAndUpdate(
      doctor._id,
      { $unset: { created_by_id: "" } }
    );

    await doctor.deleteOne();

    res.json({
      success: true,
      message: "Doctor deleted successfully"
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: err.message
    });
  }
};
export const saveDoctorProfessionalDetails = async (req, res) => {
  try {
    const { doctorId, education, work, medicalLicenseMeta, specialty, treatmentAreas, aboutYou } = req.body;
    if (!doctorId) {
      return res.status(400).json({
        success: false,
        message: "Doctor ID is required",
      });
    }

    /** -------- Parse JSON fields -------- */
    const parsedEducation = education ? JSON.parse(education) : [];
    const parsedWork = work ? JSON.parse(work) : [];
    const parsedLicenseMeta = medicalLicenseMeta
      ? JSON.parse(medicalLicenseMeta)
      : [];

    /** -------- Save / Update Education & Work -------- */
    const eduWorkPayload = {
      userId: doctorId,
      education: parsedEducation.map((e) => ({
        university: e.university,
        degree: e.degree,
        startYear: e.startYear,
        endYear: e.endYear,
      })),
      work: parsedWork,
    };

    await DoctorEduWork.findOneAndUpdate(
      { userId: doctorId },
      eduWorkPayload,
      { upsert: true, new: true }
    );
    /** -------- Update Doctor About Info -------- */
    const aboutPayload = {
      specialty,
      treatmentAreas: treatmentAreas ? JSON.parse(treatmentAreas) : [],
      aboutYou,
    };
    await DoctorAbout.findOneAndUpdate(
      { userId: doctorId },
      aboutPayload,
      { new: true }
    );

    /** -------- Handle License Files -------- */
    let licenseData = [];

    if (req.files && req.files.length) {
      licenseData = parsedLicenseMeta.map((meta, index) => ({
        certName: meta.certName,
        certFile: req.files[index]?.path,
      }));
    }
    if (licenseData.length) {
      await MedicalLicense.findOneAndUpdate(
        { userId: doctorId },
        {
          userId: doctorId,
          medicalLicense: licenseData,
        },
        { upsert: true, new: true }
      );
    }
    if (req.user.loginUser) {
      await HospitalAudit.create({ hospitalId, actionUser: req.user.loginUser, note: "Doctor proffessional records saved." })
    } else {
      await HospitalAudit.create({ hospitalId, note: "Doctor proffessional records saved." })
    }

    return res.status(200).json({
      success: true,
      message: "Professional details saved successfully",
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};

export const doctorEmploymentDetails = async (req, res) => {
  try {
    const { doctorId, joinDate, role, onLeaveDate, contractStart, contractEnd, salary, note, fees, reportingTo, employmentType, department, status } = req.body;
    if (!doctorId) {
      return res.status(400).json({
        success: false,
        message: "Doctor ID is required",
      });
    }
    /** -------- Save / Update Education & Work -------- */
    // if (fees) {
    //   await DoctorAbout.findOneAndUpdate(
    //     { userId: doctorId },
    //     { fees },
    //     { new: true }
    //   );
    // }
    const empPayload = {
      userId: doctorId,
      role,
      joinDate,
      contractStart,
      contractEnd,
      salary,
      note,
      fees,
      employmentType, status,userRole:"doctor",
      department, organizationId: req.user._id
    };
    await StaffEmployement.findOneAndUpdate(
      { userId: doctorId },
      empPayload,
      { upsert: true, new: true }
    );
    if (req.user.loginUser) {
      await HospitalAudit.create({ hospitalId:req.user._id, actionUser: req.user.loginUser, note: "Doctor employment records saved." })
    } else {
      await HospitalAudit.create({ hospitalId:req.user._id, note: "Doctor employment records saved." })
    }
    return res.status(200).json({
      success: true,
      message: "Employment details saved successfully",
    });
  } catch (error) {
    console.error("Employment details error:", error);
    return res.status(500).json({ success: false, message: "Server error", });
  }
}
export const saveDoctorAccess = async (req, res) => {
  const { userId, userName, email,contactNumber, password, permissionId, hospitalId } = req.body;
  try {
    const employee = await User.findById(userId);
    if (!employee) return res.status(200).json({ success: false, message: "Employee not found" });

    const permission = await Permissions.findById(permissionId);
    if (!permission) return res.status(200).json({ success: false, message: "Permission not found" });
    const emailExists = await StaffEmployement.findOne({
      email: email.toLowerCase(),
      userId: { $ne: userId },
      organizationId:hospitalId
    });

    if (emailExists) {
      return res.status(200).json({
        success: false,
        message: "Email already assigned to another user",
      });
    }
    const numberExists = await StaffEmployement.findOne({
      contactNumber: contactNumber,
      userId: { $ne: userId },
      organizationId:hospitalId
    });

    if (numberExists) {
      return res.status(200).json({
        success: false,
        message: "ContactNumber already assigned to another user",
      });
    }
    const isExist = await StaffEmployement.findOne({ userId: userId });
    let data;
    if (isExist) {
      const accessData = { ...req.body }
      if (req.body.password) {
        let hashPassword = await bcrypt.hash(password, 10)
        accessData.password = hashPassword
      }
      data = await StaffEmployement.findOneAndUpdate({ userId: userId }, accessData, { new: true });
      if (!data) return res.status(200).json({ success: false, message: "Access record not found" });
      if (req.user.loginUser) {
        await HospitalAudit.create({ hospitalId, actionUser: req.user.loginUser, note: "Doctor access record updated." })
      } else {
        await HospitalAudit.create({ hospitalId, note: "Doctor access record updated." })
      }
      return res.status(200).json({
        success: true,
        message: "Employee access updated",
        data
      });
    } else {
      let accessData = { ...req.body }
      let hashPassword = await bcrypt.hash(password, 10)
      if (hashPassword) {
        accessData.password = hashPassword
      }
      data = await StaffEmployement.create(accessData);
      if (req.user.loginUser) {
        await HospitalAudit.create({ hospitalId, actionUser: req.user.loginUser, note: "Doctor access record created." })
      } else {
        await HospitalAudit.create({ hospitalId, note: "Doctor access record created." })
      }
      return res.status(200).json({
        success: true,
        message: "Employee access created",
        data
      });
    }

  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};
export const getTimeSlots = async (req, res) => {
  try {
    const { userId, hospitalId } = req.params;
    const data = await TimeSlot.find({ userId, hospitalId }).sort({ day: 1 });

    return res.json({ success: true, data });
  } catch (error) {
    return res.status(200).json({ message: "Server Error", success: false })
  }
};
export const addTimeSlot = async (req, res) => {
  try {


    const { userId, day, startTime, endTime, hospitalId } = req.body;

    let doc = await TimeSlot.findOne({ userId, day, hospitalId });

    if (!doc) {
      doc = new TimeSlot({ userId, day, slots: [], hospitalId });
    }

    // overlap check
    const overlap = doc.slots.some(
      s => !(endTime <= s.startTime || startTime >= s.endTime)
    );

    if (overlap) {
      return res.status(400).json({
        success: false,
        message: "Time slot overlaps with existing slot"
      });
    }

    doc.slots.push({ startTime, endTime });
    await doc.save();

    return res.json({ success: true, message: "Slot added successfully" });
  } catch (error) {
    console.log(error)
    return res.status(200).json({ message: "Server Error", success: false })
  }
};
export const updateDaySlot = async (req, res) => {
  try {
    const { slotId, slots } = req.body;
    const doc = await TimeSlot.findById(slotId);
    if (!doc) return res.status(404).json({ success: false, message: "Time slot not found" });
    doc.slots = slots
    await doc.save();
    return res.json({ success: true, message: "Slot updated" });

  } catch (error) {
    console.log(error)
    return res.status(200).json({ message: "Server Error", success: false })
  }
};
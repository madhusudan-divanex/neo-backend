import DoctorAbout from "../../models/Doctor/addressAbout.model.js";
import Doctor from "../../models/Doctor/doctor.model.js";
import HospitalDoctor from "../../models/Hospital/HospitalDoctor.js";
import User from "../../models/Hospital/User.js";
import bcrypt from "bcryptjs";
import safeUnlink from "../../utils/globalFunction.js";
import fs from 'fs';
import MedicalLicense from "../../models/Doctor/medicalLicense.model.js";
import DoctorEduWork from "../../models/Doctor/eduWork.js";
import EmpEmployement from "../../models/Hospital/DoctorEmployement.js";
import DoctorAccess from "../../models/Hospital/DoctorAccess.js";
import HospitalPermission from "../../models/Hospital/HospitalPermission.model.js";
import DoctorAppointment from "../../models/DoctorAppointment.js";
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
        specialty: req.body.specialty,
        treatmentAreas: req.body.treatmentAreas ? JSON.parse(req.body.treatmentAreas) : [],
        fees: req.body.fees,
        language: req.body.language ? JSON.parse(req.body.language) : [],
        aboutYou: req.body.aboutYou,
        contact: {
          emergencyContactName: req.body.emergencyContactName,
          emergencyContactNumber: req.body.emergencyContactNumber,
        },
      };
    }

    // Check if doctor exists
    const isExist = await User.findOne({ email: personal.email }) || await Doctor.findOne({ contactNumber: personal.contactNumber });
    if (isExist) {
      const path = req.file?.path;
      if (path && fs.existsSync(path)) {
        safeUnlink(path);
      }
      return res.status(200).json({ message: "Doctor already exists", success: false });
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
    const hospitalId = req.user._id || req.query.hospital;
    const {
      page = 1,
      limit = 10,
      search = "",
      department,
      status
    } = req.query;

    const skip = (page - 1) * limit;

    const query = { created_by_id: hospitalId, role: 'doctor' };

    if (search) {
      query.$or = [
        { "name": { $regex: search, $options: "i" } },
        { "email": { $regex: search, $options: "i" } },
      ];
    }
    const filter = { hospitalId }
    if (status) {
      query.status = status;
    }

    const [staff, total] = await Promise.all([
      User.find(query)
        .populate('doctorId')
        .select("-passwordHash")
        .sort({ createdAt: -1 })
        .skip(Number(skip))
        .limit(Number(limit)),
      User.countDocuments(query)
    ]);

    const userIds = staff.map(user => user._id);

    const doctorAbouts = await DoctorAbout.find({ userId: { $in: userIds } });
    const doctorPatientCounts = await DoctorAppointment.aggregate([
      {
        $match: {
          doctorId: { $in: userIds }
        }
      },
      {
        $group: {
          _id: {
            doctorId: "$doctorId",
            patientId: "$patientId"
          }
        }
      },
      {
        $group: {
          _id: "$_id.doctorId",
          uniquePatientCount: { $sum: 1 }
        }
      }
    ]);
    const doctorEmployement = await EmpEmployement.find({ userId: { $in: userIds } });


    const staffWithAbout = staff.map(user => {
      const about = doctorAbouts.find(da => da.userId.toString() === user._id.toString());
      const patientCountObj = doctorPatientCounts.find(
        dp => dp._id.toString() === user._id.toString()
      );
      const employement = doctorEmployement.find(de => de.userId.toString() == user._id)
      return {
        ...user.toObject(),
        doctorAbout: about || null,
        employement,
        uniquePatientCount: patientCountObj
          ? patientCountObj.uniquePatientCount
          : 0
      };
    });
    res.json({
      success: true,
      data: staffWithAbout,
      pagination: {
        total,
        page: Number(page),
        limit: Number(limit),
        totalPages: Math.ceil(total / limit)
      }
    });

  } catch (err) {
    res.status(500).json({
      success: false,
      message: err.message
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

    const aboutDoctor = await DoctorAbout.findOne({ userId: id }).populate('cityId stateId countryId')
    const aboutDoctorEduWork = await DoctorEduWork.findOne({ userId: id })
    const employmentDetails = await EmpEmployement.findOne({ userId: id, hospitalId: hospitalId })?.populate('department')
    const accessInfo = await DoctorAccess.findOne({ userId: id }).populate('permissionId')

    const licenses = await MedicalLicense.findOne({ userId: id }) || [];

    return res.json({
      success: true, customId: user.unique_id,
      data: { doctor, aboutDoctor }, aboutDoctorEduWork, employmentDetails, accessInfo, licenses
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

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "Doctor not found"
      });
    }
    const employmentDetails = await EmpEmployement.findOne({ userId, hospitalId })?.populate('department').populate('hospitalId', 'name')

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
    await EmpEmployement.findOneAndDelete({ userId: doctor._id });
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

    return res.status(200).json({
      success: true,
      message: "Professional details saved successfully",
    });
  } catch (error) {
    console.error("Professional details error:", error);
    return res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};

export const doctorEmploymentDetails = async (req, res) => {
  try {
    const { doctorId, joinDate, position, onLeaveDate, contractStart, contractEnd, salary, note, fees, reportingTo, employmentType, department, status } = req.body;
    if (!doctorId) {
      return res.status(400).json({
        success: false,
        message: "Doctor ID is required",
      });
    }
    /** -------- Save / Update Education & Work -------- */
    if (fees) {
      await DoctorAbout.findOneAndUpdate(
        { userId: doctorId },
        { fees },
        { new: true }
      );
    }
    const empPayload = {
      userId: doctorId,
      position: position,
      joinDate,
      onLeaveDate,
      contractStart,
      contractEnd,
      salary,
      note,
      fees,
      reportingTo,
      employmentType, status,
      department, hospitalId: req.user._id
    };
    await EmpEmployement.findOneAndUpdate(
      { userId: doctorId },
      empPayload,
      { upsert: true, new: true }
    );
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
  const { userId, userName, email, password, permissionId } = req.body;
  try {
    const employee = await User.findById(userId);
    if (!employee) return res.status(200).json({ success: false, message: "Employee not found" });

    const permission = await HospitalPermission.findById(permissionId);
    if (!permission) return res.status(200).json({ success: false, message: "Permission not found" });
    const emailExists = await DoctorAccess.findOne({
      email: email.toLowerCase(),
      userId: { $ne: userId },
    });

    if (emailExists) {
      return res.status(200).json({
        success: false,
        message: "Email already assigned to another user",
      });
    }
    const isExist = await DoctorAccess.findOne({ userId: userId });
    let data;
    if (isExist) {
      data = await DoctorAccess.findOneAndUpdate({ userId: userId }, { userName, email, password, permissionId }, { new: true });
      if (!data) return res.status(200).json({ success: false, message: "Access record not found" });
      return res.status(200).json({
        success: true,
        message: "Employee access updated",
        data
      });
    } else {
      data = await DoctorAccess.create(req.body);
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
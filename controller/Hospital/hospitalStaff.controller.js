import Doctor from "../../models/Doctor/doctor.model.js";
import Country from "../../models/Hospital/Country.js";
import DoctorAccess from "../../models/Hospital/DoctorAccess.js";
import HospitalDoctorAccess from "../../models/Hospital/DoctorAccess.js";
import Staff from "../../models/Hospital/Staff.js";
import User from "../../models/Hospital/User.js";
import bcrypt from "bcryptjs";
import { assignNH12 } from "../../utils/nh12.js";
import HospitalAudit from "../../models/Hospital/HospitalAudit.js";

export const createHospitalStaff = async (req, res) => {
  try {
    const data = JSON.parse(req.body.data);
    data.hospitalId = req.user.id;

    // ===============================
    // CHECK EMAIL
    // ===============================
    const existingUser = await User.findOne({
      email: data.accessInfo.accessEmail
    });

    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: "Email already registered",
        identifier: "email"
      });
    }

    const existingDoctorByEmail = await DoctorAccess.findOne({
      email: data.accessInfo.accessEmail,
      hospitalId: req.user.id
    });

    if (existingDoctorByEmail) {
      return res.status(400).json({
        success: false,
        message: "Email already registered for this hospital",
        identifier: "email"
      });
    }

    const existingDoctorByContact = await DoctorAccess.findOne({
      contactNumber: data.accessInfo.contactNumber,
      hospitalId: req.user.id
    });

    if (existingDoctorByContact) {
      return res.status(400).json({
        success: false,
        message: "Contact number already registered for this hospital",
        identifier: "contactNumber"
      });
    }

    // ===============================
    // PASSWORD
    // ===============================
    if (!data.accessInfo?.password) {
      return res.status(400).json({
        success: false,
        message: "Password is required"
      });
    }

    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(
      data.accessInfo.password,
      salt
    );

    const user = await User.create({
      name: data.personalInfo.name,
      email: data.accessInfo.accessEmail,
      passwordHash,
      contactNumber: data.accessInfo.contactNumber,
      role: "staff",
      created_by_id: data.hospitalId,
      created_by: "hospital"
    });

    // ===============================
    // PROFILE IMAGE ✅ FIX
    // ===============================
    if (req.files?.profileImage?.length) {
      data.personalInfo.profileImage =
        req.files.profileImage[0].filename;
    }

    // ===============================
    // EDUCATION NORMALIZE
    // ===============================
    data.professionalInfo.education = Array.isArray(
      data.professionalInfo?.educations
    )
      ? data.professionalInfo.educations.map(e => ({
        university: e.university,
        degree: e.degree,
        yearFrom: e.fromYear,
        yearTo: e.toYear
      }))
      : [];

    // ===============================
    // CERTIFICATES ✅ FIX (IMPORTANT)
    // ===============================
    const uploadedCertificates = req.files?.certificates || [];

    data.professionalInfo.certificates = Array.isArray(
      data.professionalInfo?.certificates
    )
      ? data.professionalInfo.certificates.map((c, index) => ({
        certificateName: c.certificateName || "",
        certificateFile: uploadedCertificates[index]
          ? uploadedCertificates[index].filename
          : ""
      }))
      : [];

    // ===============================
    // ACCESS INFO CLEAN
    // ===============================
    data.accessInfo = {
      userId: user._id,
      contactNumber: data.accessInfo.contactNumber,
      accessEmail: data.accessInfo.accessEmail,
      permissionId: data.accessInfo.permissionId
    };
    data.userId = user._id;

    // ===============================
    // CREATE STAFF
    // ===============================

    const contryData = await Country.findById(data.personalInfo?.countryId)
    if (contryData) {
      await assignNH12(user._id, contryData?.phonecode)
    }
    const staff = await Staff.create(data);
    if (staff) {
      await AuditLog.create({
        orgId: data.hospitalId, actorId: req.user.loginUser || data.hospitalId, panel: "hospital",
        method: "CREATE",
        shortDesc: "Staff added",
        description: `Staff added for ${user.name} NHC id ${user.nh12}.`
      })
    }
    return res.json({
      success: true,
      message: "Staff created successfully",
      data: staff
    });

  } catch (err) {
    console.error("createHospitalStaff error:", err);
    return res.status(500).json({
      success: false,
      message: err.message
    });
  }
};

export const getMyAllStaffList = async (req, res) => {
  try {
    const hospitalId = req.user.id;

    const staff = await Staff.find({ hospitalId })
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

export const getHospitalStaffList = async (req, res) => {
  try {
    const hospitalId = req.user.id;

    const {
      page = 1,
      limit = 6,
      search = "",
      department,
      status
    } = req.query;

    const skip = (page - 1) * limit;

    // ---------- FILTER QUERY ----------
    const query = { hospitalId };

    if (search) {
      query.$or = [
        { "personalInfo.name": { $regex: search, $options: "i" } },
        { "personalInfo.email": { $regex: search, $options: "i" } },
        { "personalInfo.mobile": { $regex: search, $options: "i" } }
      ];
    }

    if (department) {
      query["employmentInfo.department"] = department;
    }

    if (status) {
      query.status = status;
    }

    const [staff, total] = await Promise.all([
      Staff.find(query)
        .select("-accessInfo.passwordHash").populate('employmentInfo.department', 'departmentName')
        .sort({ createdAt: -1 })
        .skip(Number(skip))
        .limit(Number(limit)),
      Staff.countDocuments(query)
    ]);

    const base_url = process.env.BASE_URL;

    res.json({
      success: true,
      data: staff,
      base_url,
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

export const getHospitalStaffByIdNew = async (req, res) => {
  try {
    const hospitalId = req.user.id;
    const { id } = req.params;

    const staff = await Staff.findOne({
      _id: id,
      hospitalId
    }).populate('personalInfo.countryId').populate('personalInfo.stateId').populate('personalInfo.cityId');

    if (!staff) {
      return res.status(404).json({
        success: false,
        message: "Staff not found"
      });
    }

    const BASE_URL = process.env.BASE_URL;

    if (staff.personalInfo?.profileImage) {
      staff.personalInfo.profileImage =
        `${BASE_URL}/uploads/staff/${staff.personalInfo.profileImage}`;
    }

    staff.professionalInfo?.certificates?.forEach(cert => {
      if (cert.certificateFile) {
        cert.certificateFile =
          `${BASE_URL}/uploads/certificates/${cert.certificateFile}`;
      }
    });

    return res.json({
      success: true,
      data: staff
    });

  } catch (err) {
    console.error("getHospitalStaffById error:", err);
    return res.status(500).json({
      success: false,
      message: err.message
    });
  }
};

export const getHospitalStaffById = async (req, res) => {
  try {
    const hospitalId = req.user.id;
    const { id } = req.params;

    const staff = await Staff.findOne({
      _id: id,
      hospitalId
    }).select("-accessInfo.passwordHash").populate('employmentInfo.department', 'departmentName')
      .populate('personalInfo.countryId').populate('personalInfo.stateId').populate('personalInfo.cityId');

    if (!staff) {
      return res.status(404).json({
        success: false,
        message: "Staff not found"
      });
    }
    const staffUser = await User.findById(staff.userId)

    const base_url = process.env.BASE_URL;

    res.json({
      success: true,
      data: staff,
      base_url, user: staffUser
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: err.message
    });
  }
};
export const deleteHospitalStaffById = async (req, res) => {
  try {
    const hospitalId = req.user.id;
    const { id } = req.params;

    const staff = await Staff.findOneAndDelete({
      _id: id,
      hospitalId
    })

    if (!staff) {
      return res.status(404).json({
        success: false,
        message: "Staff not found"
      });
    }

    const base_url = process.env.BASE_URL;

    res.json({
      success: true,
      message: "Staff Deleted"
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: err.message
    });
  }
};
export const updateHospitalStaff = async (req, res) => {
  try {
    const { id } = req.params;
    const data = JSON.parse(req.body.data);
    const hospitalId = req.user.id;

    const staff = await Staff.findOne({
      _id: id,
      hospitalId
    });

    if (!staff) {
      return res.status(404).json({
        success: false,
        message: "Staff not found"
      });
    }

    const user = await User.findOne({ _id: staff.userId });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "Linked user not found"
      });
    }
    const newEmail = data.accessInfo?.accessEmail;
    const newContact = data.accessInfo?.contactNumber;
    if (
      (data.accessInfo.accessEmail &&
        data.accessInfo.accessEmail !== user.email) ||
      (data.accessInfo.contactNumber &&
        data.accessInfo.contactNumber !== user.contactNumber)
    ) {
      const emailExists = await User.findOne({
        _id: { $ne: user._id },
        $or: [
          ...(newEmail ? [{ email: newEmail }] : []),
          ...(newContact ? [{ contactNumber: newContact }] : [])
        ]
      }) || await DoctorAccess.findOne({ email: data.accessInfo.email, hospitalId }) || await DoctorAccess.findOne({ contactNumber: data.accessInfo.contactNumber, hospitalId });

      if (emailExists) {
        return res.status(400).json({
          success: false,
          message: "Email or contact number already registered"
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
    user.contactNumber = data.accessInfo?.contactNumber
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
      contactNumber: data.accessInfo.contactNumber,
      accessEmail: data.accessInfo.accessEmail,
      permissionId:
        data.accessInfo.permissionId ||
        staff.accessInfo.permissionId
    };

    data.userId = user._id;
    Object.assign(staff, data);
    await staff.save();
    // console.log(data.personalInfo)
    // const countryData=await Country.findById(data?.personalInfo?.countryId)
    // if(countryData?.phonecode){
    //   await assignNH12(user._id,countryData?.phonecode)
    // }
    await AuditLog.create({
      orgId: data.hospitalId, actorId: req.user.loginUser || data.hospitalId, panel: "hospital",
      method: "UPDATE",
      shortDesc: "Staff updated",
      description: `Staff updated for ${user.name} NHC id ${user.nh12}.`
    })
    return res.json({
      success: true,
      message: "Staff updated successfully",
      data: staff
    });

  } catch (err) {
    return res.status(500).json({
      success: false,
      message: err.message
    });
  }
};
export const getHospitalStaffData = async (req, res) => {
  try {
    const hospitalId = req.user.id;
    const { id } = req.params;

    const staff = await Staff.findOne({
      userId: id,
      hospitalId
    }).select("-accessInfo.passwordHash").populate("accessInfo.permissionId").populate({ path: "userId", select: '-passwordHash' });

    if (!staff) {
      const doctor = await HospitalDoctorAccess.findOne({ userId: id, hospitalId }).populate("permissionId")
      if (!doctor) {
        return res.status(404).json({
          success: false,
          message: "Staff not found"
        });
      }
      const userDoctor = await User.findById(id)
      const doctorData = await Doctor.findById(userDoctor.doctorId)
      return res.status(200).json({
        message: "data fetched",
        success: true,
        userDoctor, doctorData, access: doctor
      })
    }
    const base_url = process.env.BASE_URL;

    res.json({
      success: true,
      data: staff, userDoctor: staff.userId,
      access: staff.accessInfo, doctorData: staff,
      base_url
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: err.message
    });
  }
};
export const getHospitalStaffNh12 = async (req, res) => {
  try {
    const hospitalId = req.user.id;
    const { id } = req.params;
    const user = await User.findOne({ nh12: id })
    if (!user) {
      return res.status(404).json({ message: "Staff not found", success: false })
    }
    const staff = await Staff.findOne({
      userId: user._id,
      hospitalId
    }).populate({ path: "userId", select: 'name' });
    if (!staff) {
      return res.status(200).json({ success: true, data: user, role: "doctor" })
    }

    res.json({
      success: true,
      data: user, role: staff?.employmentInfo?.role

    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: err.message
    });
  }
};
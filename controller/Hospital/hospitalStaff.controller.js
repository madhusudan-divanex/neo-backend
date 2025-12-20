import HospitalStaff from "../../models/Hospital/HospitalStaff.js";
import User from "../../models/Hospital/User.js";
import bcrypt from "bcryptjs";

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
        message: "Email already registered"
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
      role: "staff",
      hospitalId: data.hospitalId
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
      username: data.accessInfo.username,
      accessEmail: data.accessInfo.accessEmail,
      permissionType: data.accessInfo.permissionType || "limited"
    };
    data.userId = user._id;
    // ===============================
    // CREATE STAFF
    // ===============================
    const staff = await HospitalStaff.create(data);

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

    const staff = await HospitalStaff.find({ hospitalId })
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

    // Search (name, email, mobile)
    if (search) {
      query.$or = [
        { "personalInfo.name": { $regex: search, $options: "i" } },
        { "personalInfo.email": { $regex: search, $options: "i" } },
        { "personalInfo.mobile": { $regex: search, $options: "i" } }
      ];
    }

    // Department filter
    if (department) {
      query["employmentInfo.department"] = department;
    }

    // Status filter
    if (status) {
      query.status = status;
    }

    // ---------- DATA ----------
    const [staff, total] = await Promise.all([
      HospitalStaff.find(query)
        .select("-accessInfo.passwordHash")
        .sort({ createdAt: -1 })
        .skip(Number(skip))
        .limit(Number(limit)),

      HospitalStaff.countDocuments(query)
    ]);
 const base_url = process.env.BASE_URL;
    res.json({
      success: true,
      data: staff,
      base_url:base_url,
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

    const staff = await HospitalStaff.findOne({
      _id: id,
      hospitalId
    });

    if (!staff) {
      return res.status(404).json({
        success: false,
        message: "Staff not found"
      });
    }

    const BASE_URL = process.env.BASE_URL;

    // ✅ Profile image full URL
    if (staff.personalInfo?.profileImage) {
      staff.personalInfo.profileImage =
        `${BASE_URL}/uploads/staff/${staff.personalInfo.profileImage}`;
    }

    // ✅ Certificates full URL
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

    const staff = await HospitalStaff.findOne({
      _id: id,
      hospitalId
    }).select("-accessInfo.passwordHash");

    if (!staff) {
      return res.status(404).json({
        success: false,
        message: "Staff not found"
      });
    }
    const base_url = process.env.BASE_URL;
    res.json({
      success: true,
      data: staff,
      base_url:base_url
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

    // ===============================
    // FIND STAFF
    // ===============================
    const staff = await HospitalStaff.findOne({
      _id: id,
      hospitalId
    });

    if (!staff) {
      return res.status(404).json({
        success: false,
        message: "Staff not found"
      });
    }

    
    // UPDATE USER (EMAIL / PASSWORD)
    const user = await User.findOne({_id: staff.userId});

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "Linked user not found"
      });
    }

    // 👉 Email change check
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

    // 👉 Password update (OPTIONAL)
    if (data.accessInfo.password) {
      const salt = await bcrypt.genSalt(10);
      user.passwordHash = await bcrypt.hash(
        data.accessInfo.password,
        salt
      );
    }

    user.name = data.personalInfo.name;
    await user.save();

    // ===============================
    // PROFILE IMAGE
    // ===============================
    if (req.files?.profileImage?.length) {
      data.personalInfo.profileImage =
        req.files.profileImage[0].filename;
    } else {
      data.personalInfo.profileImage =
        staff.personalInfo.profileImage;
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
      : staff.professionalInfo.education || [];

    // ===============================
    // CERTIFICATES
    // ===============================
    const uploadedCertificates = req.files?.certificates || [];

    data.professionalInfo.certificates = Array.isArray(
        data.professionalInfo?.certificates
      )
        ? data.professionalInfo.certificates.map((c, index) => ({
            certificateName: c.name || "",   // ✅ ALWAYS THIS
            certificateFile:
              uploadedCertificates[index]?.filename ||
              c.certificateFile ||
              ""
          }))
        : [];

    // ===============================
    // ACCESS INFO CLEAN
    // ===============================
    data.accessInfo = {
      userId: user._id,
      username: data.accessInfo.username,
      accessEmail: data.accessInfo.accessEmail,
      permissionType:
        data.accessInfo.permissionType ||
        staff.accessInfo.permissionType
    };

    // ===============================
    // UPDATE STAFF
    // ===============================
    data.userId = user._id;
    Object.assign(staff, data);
    await staff.save();

    return res.json({
      success: true,
      message: "Staff updated successfully",
      data: staff
    });

  } catch (err) {
    console.error("updateHospitalStaff error:", err);
    return res.status(500).json({
      success: false,
      message: err.message
    });
  }
};



